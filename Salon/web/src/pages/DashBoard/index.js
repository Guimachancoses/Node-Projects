import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import "moment/locale/pt-br";

import {
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GroupsIcon from "@mui/icons-material/Groups";
import MarkChatUnreadIcon from "@mui/icons-material/MarkChatUnread";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SyncProblemIcon from "@mui/icons-material/SyncProblem";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import {
    allClientes,
    allColaboradores,
    allServicos,
    filterAgendamentos,
    updateAgendamentoState,
} from "../../store/modules/agendamento/actions";

moment.locale("pt-br");

const getFullName = (person = {}) =>
    `${person?.nome || ""} ${person?.sobrenome || ""}`.trim() || "Não informado";

const getServiceTitle = (service = {}) =>
    service?.titulo || service?.nome || service?.label || "Serviço não informado";

const getCollaboratorStatus = (colaborador = {}) => {
    const vinculo = colaborador?.vinculo || colaborador?.status || colaborador?.statusFormat || "A";
    return String(vinculo).toUpperCase();
};

const formatPhone = (telefone = {}) => {
    if (!telefone?.area || !telefone?.numero) return "";

    const area = String(telefone.area).replace(/\D/g, "");
    const numero = String(telefone.numero).replace(/\D/g, "");

    if (!area || !numero) return "";
    return `(${area}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
};

const Dashboard = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isDark = theme.palette.mode === "dark";

    const {
        agendamentos = [],
        clientes = [],
        colaboradores = [],
        servicos = [],
        form = {},
        components = {},
    } = useSelector((state) => state.agendamento || {});

    const { user: userRaw } = useSelector((state) => state.colaborador || {});
    const userStore = userRaw?.user ?? userRaw;
    const barbershopName = userStore?.salao?.nome || userStore?.empresa?.nome || "Parrudus Barbearia";

    useEffect(() => {
        const start = moment().startOf("day").format("YYYY-MM-DD");
        const end = moment().endOf("week").format("YYYY-MM-DD");

        dispatch(filterAgendamentos(start, end));
        dispatch(allClientes());
        dispatch(allColaboradores());
        dispatch(allServicos());
    }, [dispatch]);

    const todayAppointments = useMemo(() => {
        return (agendamentos || [])
            .filter((item) => moment(item?.data || item?.start).isSame(moment(), "day"))
            .sort((a, b) => moment(a?.data || a?.start).diff(moment(b?.data || b?.start)));
    }, [agendamentos]);

    const upcomingAppointments = useMemo(() => {
        return (agendamentos || [])
            .filter((item) => moment(item?.data || item?.start).isSameOrAfter(moment()))
            .sort((a, b) => moment(a?.data || a?.start).diff(moment(b?.data || b?.start)))
            .slice(0, 5);
    }, [agendamentos]);

    const nextAppointment = upcomingAppointments[0] || null;

    const colaboradoresAtivos = useMemo(() => {
        return (colaboradores || []).filter((colaborador) => getCollaboratorStatus(colaborador) === "A");
    }, [colaboradores]);

    const servicosAtivos = useMemo(() => {
        return (servicos || []).filter((servico) => String(servico?.status || "A").toUpperCase() === "A");
    }, [servicos]);

    const confirmedToday = todayAppointments.filter((item) => {
        const status = String(item?.status || "").toLowerCase();
        return status === "a" || status === "confirmado";
    }).length;

    const pendingToday = todayAppointments.filter((item) => {
        const status = String(item?.status || "").toLowerCase();
        return status === "p";
    }).length;

    const inactiveCollaborators = Math.max((colaboradores || []).length - colaboradoresAtivos.length, 0);

    const metrics = [
        {
            label: "Agendamentos hoje",
            value: todayAppointments.length,
            hint: `${confirmedToday} confirmados`,
            icon: <EventAvailableIcon />,
            color: "#00656d",
        },
        {
            label: "Clientes",
            value: (clientes || []).length,
            hint: "Total cadastrado",
            icon: <GroupsIcon />,
            color: "#1976d2",
        },
        {
            label: "Colaboradores",
            value: colaboradoresAtivos.length,
            hint: `${inactiveCollaborators} inativos`,
            icon: <BadgeIcon />,
            color: "#2e7d32",
        },
        {
            label: "Serviços",
            value: servicosAtivos.length,
            hint: `${(servicos || []).length} cadastrados`,
            icon: <MiscellaneousServicesIcon />,
            color: "#7b1fa2",
        },
    ];

    const alerts = [
        {
            show: Boolean(inactiveCollaborators),
            severity: "warning",
            icon: <PersonOffIcon />,
            title: `${inactiveCollaborators} colaborador${inactiveCollaborators > 1 ? "es" : ""} inativo${inactiveCollaborators > 1 ? "s" : ""}`,
            description: "Revise o cadastro antes de distribuir novos horários.",
        },
        {
            show: true,
            severity: "info",
            icon: <SyncProblemIcon />,
            title: "Google Agenda",
            description: "Acompanhe a sincronização pela tela Minha Conta.",
        },
        {
            show: true,
            severity: "info",
            icon: <MarkChatUnreadIcon />,
            title: "WhatsApp",
            description: "Use a integração para lembretes e confirmações.",
        },
    ].filter((alert) => alert.show);

    const handleNovoAgendamento = () => {
        dispatch(
            updateAgendamentoState({
                behavior: "create",
                agendamento: {
                    colaboradorId: "",
                    clienteId: "",
                    servicoId: null,
                    data: moment().format("YYYY-MM-DDTHH:mm"),
                    status: "pendente",
                },
                form: { ...form, disabled: false },
                components: { ...components, drawer: true },
            })
        );

        window.location.href = "/agendamentos";
    };

    const whatsappLink = useMemo(() => {
        const telefone = nextAppointment?.clienteId?.telefone;
        const area = telefone?.area ? String(telefone.area).replace(/\D/g, "") : "";
        const numero = telefone?.numero ? String(telefone.numero).replace(/\D/g, "") : "";

        if (!area || !numero) return "";

        const cliente = getFullName(nextAppointment?.clienteId);
        const horario = moment(nextAppointment?.data || nextAppointment?.start).format("HH:mm");
        const message = encodeURIComponent(
            `Olá ${cliente}, confirmando seu agendamento às ${horario} na ${barbershopName}.`
        );

        return `https://wa.me/55${area}${numero}?text=${message}`;
    }, [barbershopName, nextAppointment]);

    const pageBg = isDark
        ? alpha(theme.palette.background.paper, 0.78)
        : alpha(theme.palette.common.white, 0.92);

    const cardSx = {
        p: { xs: 2, md: 2.25 },
        borderRadius: 2.5,
        bgcolor: pageBg,
        border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.14) : alpha(theme.palette.common.black, 0.08)
            }`,
        backdropFilter: "blur(6px)",
        boxShadow: theme.shadows[3],
    };

    const quietButtonSx = {
        textTransform: "none",
        minHeight: 40,
        color: isDark ? "#fff" : "var(--primary-light)",
        borderColor: isDark ? "rgba(255,255,255,0.7)" : "var(--primary-light)",
    };

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 1640,
                mx: "auto",
                px: { xs: 1, sm: 2.5, md: 1 },
                py: { xs: 1.5, sm: 2.5, md: 0 },
                overflowX: "hidden",
            }}
        >
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                gap={1.5}
                mb={2.5}
            >
                <Box>
                    <Typography
                        variant="caption"
                        sx={{
                            display: "block",
                            mb: 0.25,
                            color: isDark ? "rgba(255,255,255,0.72)" : "#9ACBC8",
                            fontWeight: 900,
                            letterSpacing: 1.4,
                            textTransform: "uppercase",
                        }}
                    >
                        {moment().format("dddd, DD [de] MMMM")}
                    </Typography>
                    <Typography
                        variant={isMobile ? "h6" : "h5"}
                        sx={{
                            color: isDark ? "#fff" : "var(--primary-light)",
                            fontWeight: 800,
                        }}
                    >
                        Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDark ? "rgba(255,255,255,0.72)" : "#9ACBC8", fontWeight: 600 }}>
                        Acompanhe o movimento do dia e acesse as ações principais sem sair da tela.
                    </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                    <Button
                        variant="contained"
                        onClick={handleNovoAgendamento}
                        startIcon={<AddIcon />}
                        fullWidth={isMobile}
                        sx={{ textTransform: "none", minHeight: 40, fontWeight: 700 }}
                    >
                        Novo Agendamento
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PersonAddIcon />}
                        href="/clientes"
                        fullWidth={isMobile}
                        sx={quietButtonSx}
                    >
                        Novo Cliente
                    </Button>
                </Stack>
            </Stack>


            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    mb: 2,
                    order: { xs: 2, lg: 1 },
                    gridTemplateColumns: {
                        xs: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(4, minmax(0, 1fr))",
                    },
                }}
            >
                {metrics.map((metric) => (
                    <MetricCard metric={metric} cardSx={cardSx} />
                ))}
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} lg={7} sx={{ width: { xs: "100%", md: "auto" } }}>
                    <Paper
                        elevation={0}
                        sx={{
                            ...cardSx,
                            height: "100%",
                            minHeight: { xs: "auto", md: 260 },
                            position: "relative",
                            overflow: "hidden",
                            bgcolor: isDark ? alpha(theme.palette.background.paper, 0.82) : alpha("#f7fbfc", 0.96),
                            "&:before": {
                                content: '""',
                                position: "absolute",
                                inset: 0,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)}, transparent 55%)`,
                                pointerEvents: "none",
                            },
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            gap={2}
                            sx={{
                                minWidth: { md: 190 },
                                justifyContent: { md: "center" },
                                mt: { xs: 1, md: 0 },
                            }}
                        >
                            <Box>
                                <SectionLabel icon={<AccessTimeIcon fontSize="small" />} label="Próximo agendamento" />

                                {nextAppointment ? (
                                    <>
                                        <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900} sx={{ mt: 1 }}>
                                            {moment(nextAppointment?.data || nextAppointment?.start).format("HH:mm")}
                                        </Typography>
                                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800}>
                                            {getFullName(nextAppointment?.clienteId)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {moment(nextAppointment?.data || nextAppointment?.start).format("DD/MM/YYYY")} às{" "}
                                            {moment(nextAppointment?.data || nextAppointment?.start).format("HH:mm")}
                                        </Typography>

                                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
                                            <Chip icon={<MiscellaneousServicesIcon />} label={getServiceTitle(nextAppointment?.servicoId)} />
                                            <Chip icon={<BadgeIcon />} label={getFullName(nextAppointment?.colaboradorId)} />
                                            {formatPhone(nextAppointment?.clienteId?.telefone) && (
                                                <Chip label={formatPhone(nextAppointment?.clienteId?.telefone)} />
                                            )}
                                        </Stack>
                                    </>
                                ) : (
                                    <EmptyNextAppointment />
                                )}
                            </Box>

                            <Stack
                                direction={{ xs: "column", sm: "row", md: "column" }}
                                gap={1}
                                sx={{ minWidth: { md: 190 }, justifyContent: { md: "center" } }}
                            >
                                <Button variant="contained" startIcon={<CalendarMonthIcon />} href="/agendamentos" sx={{ minHeight: 44 }}>
                                    Ver agenda
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<WhatsAppIcon />}
                                    href={whatsappLink || undefined}
                                    target={whatsappLink ? "_blank" : undefined}
                                    disabled={!whatsappLink}
                                    sx={{ minHeight: 44 }}
                                >
                                    WhatsApp
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={5} sx={{ width: { xs: "100%", md: "auto" } }}>
                    <Paper
                        elevation={0}
                        sx={{
                            ...cardSx,
                            width: "100%",
                            maxWidth: "100%",
                            height: "100%",
                            minHeight: { xs: "auto", md: 260 },
                        }}
                    >
                        <SectionLabel icon={<EventAvailableIcon fontSize="small" />} label="Resumo do dia" />

                        <Grid container spacing={1.5} sx={{ mt: 1 }}>
                            <Grid item xs={4}>
                                <StatusBox icon={<CheckCircleIcon />} label="Confirmados" value={confirmedToday} color="#2e7d32" />
                            </Grid>
                            <Grid item xs={4}>
                                <StatusBox icon={<ScheduleIcon />} label="Pendentes" value={pendingToday} color="#ef6c00" />
                            </Grid>
                            <Grid item xs={4}>
                                <StatusBox icon={<CalendarMonthIcon />} label="Total" value={todayAppointments.length} color="#00656d" />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <Stack spacing={1.2}>
                            <QuickAction href="/agendamentos" icon={<AddIcon />} label="Criar novo agendamento" />
                            <QuickAction href="/clientes" icon={<PersonAddIcon />} label="Cadastrar cliente" />
                            <QuickAction href="/servicos" icon={<MiscellaneousServicesIcon />} label="Ver serviços" />
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={7}>
                    <Paper elevation={0} sx={cardSx}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                            <Box>
                                <SectionLabel icon={<CalendarMonthIcon fontSize="small" />} label="Agenda compacta" />
                                <Typography variant="h6" fontWeight={900} sx={{ mt: 0.5 }}>
                                    Próximos horários
                                </Typography>
                            </Box>
                            <Tooltip title="Atualizar">
                                <IconButton
                                    onClick={() =>
                                        dispatch(
                                            filterAgendamentos(
                                                moment().startOf("day").format("YYYY-MM-DD"),
                                                moment().endOf("week").format("YYYY-MM-DD")
                                            )
                                        )
                                    }
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>

                        <Stack divider={<Divider flexItem />} spacing={0.5}>
                            {upcomingAppointments.length ? (
                                upcomingAppointments.map((appointment) => (
                                    <AppointmentRow key={appointment?._id || appointment?.id} appointment={appointment} />
                                ))
                            ) : (
                                <Box sx={{ py: 3, textAlign: "center" }}>
                                    <CalendarMonthIcon sx={{ color: "text.disabled", fontSize: 36, mb: 1 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Nenhum agendamento futuro encontrado.
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={5}>
                    <Paper elevation={0} sx={cardSx}>
                        <SectionLabel icon={<WarningAmberIcon fontSize="small" />} label="Atenção" />
                        <Typography variant="h6" fontWeight={900} sx={{ mt: 0.5, mb: 1.5 }}>
                            Alertas importantes
                        </Typography>

                        <Stack spacing={1.2} direction={{ xs: "column", sm: "row" }}>
                            {alerts.map((alert) => (
                                <AlertRow key={alert.title} alert={alert} />
                            ))}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

const SectionLabel = ({ icon, label }) => (
    <Stack direction="row" alignItems="center" spacing={0.75}>
        <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
        <Typography
            variant="overline"
            sx={{
                color: "primary.main",
                fontWeight: 900,
                letterSpacing: 1.6,
                lineHeight: 1,
            }}
        >
            {label}
        </Typography>
    </Stack>
);

const EmptyNextAppointment = () => (
    <Box sx={{ mt: 2 }}>
        <Box
            sx={{
                width: 58,
                height: 58,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
                mb: 1.5,
            }}
        >
            <CalendarMonthIcon sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h5" fontWeight={900}>
            Nenhum horário próximo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 420 }}>
            Quando houver agendamentos futuros, o próximo atendimento aparecerá aqui com acesso rápido à agenda e ao WhatsApp.
        </Typography>
    </Box>
);

const MetricCard = ({ metric, cardSx, isMobile }) => (
    <Paper
        elevation={0}
        sx={{
            ...cardSx,
            height: "100%",
            minHeight: { xs: 98, sm: 108, md: 116 },
            p: { xs: 1.35, sm: 1.75, md: 2.25 },
            transition: "transform 0.18s ease, box-shadow 0.18s ease",
            "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 6,
            },
        }}
    >
        <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
                sx={{
                    width: { xs: 40, sm: 46, md: 48 },
                    height: { xs: 40, sm: 46, md: 48 },
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    color: metric.color,
                    bgcolor: alpha(metric.color, 0.12),
                    flexShrink: 0,
                }}
            >
                {metric.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900} lineHeight={1}>
                    {metric.value}
                </Typography>
                <Typography
                    variant="body2"
                    fontWeight={800}
                    sx={{
                        fontSize: { xs: "0.78rem", sm: "0.875rem" },
                        lineHeight: 1.2,
                        overflowWrap: "anywhere",
                    }}
                >
                    {metric.label}
                </Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                        display: "block",
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        lineHeight: 1.2,
                    }}
                >
                    {metric.hint}
                </Typography>
            </Box>
        </Stack>
    </Paper>
);

const StatusBox = ({ icon, label, value, color }) => (
    <Box
        sx={{
            p: { xs: 1, sm: 1.5 },
            borderRadius: 2,
            minHeight: { xs: 92, sm: 112 },
            bgcolor: alpha(color, 0.1),
            border: `1px solid ${alpha(color, 0.18)}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
        }}
    >
        <Box sx={{ color, display: "flex" }}>{icon}</Box>
        <Box>
            <Typography variant="h5" fontWeight={900} color={color} lineHeight={1}>
                {value}
            </Typography>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, lineHeight: 1.2 }}
            >
                {label}
            </Typography>
        </Box>
    </Box>
);

const QuickAction = ({ href, icon, label }) => (
    <Button
        href={href}
        variant="text"
        fullWidth
        startIcon={icon}
        sx={{
            justifyContent: "flex-start",
            textTransform: "none",
            borderRadius: 2,
            py: 1,
            color: "text.primary",
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
            "&:hover": {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            },
        }}
    >
        {label}
    </Button>
);

const AppointmentRow = ({ appointment }) => {
    const status = String(appointment?.status || "pendente").toLowerCase();
    const statusLabel = status === "a" || status === "confirmado" ? "Confirmado" : "Pendente";
    const statusColor = statusLabel === "Confirmado" ? "success" : "warning";

    return (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.15 }}>
            <Box
                sx={{
                    width: 58,
                    height: 44,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                    fontWeight: 900,
                    flexShrink: 0,
                }}
            >
                {moment(appointment?.data || appointment?.start).format("HH:mm")}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={800} noWrap>
                    {getFullName(appointment?.clienteId)}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                    {getServiceTitle(appointment?.servicoId)} com {getFullName(appointment?.colaboradorId)}
                </Typography>
            </Box>
            <Chip size="small" color={statusColor} label={statusLabel} sx={{ fontWeight: 700 }} />
        </Stack>
    );
};

const AlertRow = ({ alert }) => {
    const colorBySeverity = {
        info: "info.main",
        warning: "warning.main",
        error: "error.main",
    };

    return (
        <Box
            sx={{
                display: "flex",
                gap: 1.2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette[alert.severity]?.main || theme.palette.info.main, 0.1),
                border: (theme) => `1px solid ${alpha(theme.palette[alert.severity]?.main || theme.palette.info.main, 0.14)}`,
            }}
        >
            <Box sx={{ color: colorBySeverity[alert.severity] || "info.main", mt: 0.2 }}>{alert.icon}</Box>
            <Box >
                <Typography fontWeight={900}>{alert.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                    {alert.description}
                </Typography>
            </Box>
        </Box>
    );
};

export default Dashboard;
