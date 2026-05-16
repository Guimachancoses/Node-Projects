import { useEffect, useMemo, useState, forwardRef, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import "moment/locale/pt-br";
import util from "../../util";

import {
  Box,
  Button,
  Typography,
  TextField,
  Snackbar,
  Slide,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  useMediaQuery,
  useTheme
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";

import CustomDrawer from "../../components/Drawer";
import CustomDialog from "../../components/DialogAlert";
import MobileCalendarToolbar from "../../components/MobileCalendarToolbar"

import {
  filterAgendamentos,
  updateAgendamentoState,
  createAgendamentoRequest,
  editAgendamentoRequest,
  deleteAgendamentoRequest,
  setAlerta,
  allServicos,
  allClientes,
  allColaboradores,
} from "../../store/modules/agendamento/actions";


moment.locale("pt-br");
const localizer = momentLocalizer(moment);

const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const Agendamentos = () => {
  const dispatch = useDispatch();

  // ...
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDark = theme.palette.mode === "dark"

  const views = useMemo(() => {
    if (isMobile) return { day: true, agenda: true };
    if (isTablet) return { day: true, week: true, agenda: true };
    return { month: true, week: true, day: true, agenda: true };
  }, [isMobile, isTablet]);

  const fallbackView = isMobile ? "day" : "week";
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(fallbackView);

  const allowedViews = useMemo(() => Object.keys(views), [views]);

  const safeCurrentView = useMemo(() => {
    return allowedViews.includes(currentView) ? currentView : fallbackView;
  }, [allowedViews, currentView, fallbackView]);

  // Garante que a view atual sempre existe no conjunto de views permitido
  useEffect(() => {
    if (!allowedViews.includes(currentView)) {
      setCurrentView(fallbackView);
    }
  }, [allowedViews, currentView, fallbackView]);

  const {
    agendamentos,
    agendamento,
    behavior,
    components,
    form,
    alerta,
    servicos,
    clientes,
    colaboradores,
  } = useSelector((state) => state.agendamento);

  useEffect(() => {
    if (isMobile) setCurrentView("day");
    else if (isTablet) setCurrentView("week");
    else setCurrentView("week");
  }, [isMobile, isTablet]);

  useEffect(() => {
    dispatch(
      filterAgendamentos(
        moment().weekday(0).format("YYYY-MM-DD"),
        moment().weekday(6).format("YYYY-MM-DD")
      )
    );
    dispatch(allServicos());
    dispatch(allClientes());
    dispatch(allColaboradores());
  }, [dispatch]);

  const formatEventos = useMemo(() => {
    return (agendamentos || []).map((item) => ({
      ...item,
      title: item?.servicoId?.titulo
        ? `${item.servicoId.titulo} - ${item?.clienteId?.nome || ""}`
        : "Agendamento",
      start: moment(item.data).toDate(),
      end: moment(item.data)
        .add(
          util.hourToMinutes(moment(item?.servicoId?.duracao).format("HH:mm")),
          "minutes"
        )
        .toDate(),
    }));
  }, [agendamentos]);

  const formatRange = (periodo) => {
    if (Array.isArray(periodo)) {
      return {
        start: moment(periodo[0]).format("YYYY-MM-DD"),
        end: moment(periodo[periodo.length - 1]).format("YYYY-MM-DD"),
      };
    }
    return {
      start: moment(periodo.start).format("YYYY-MM-DD"),
      end: moment(periodo.end).format("YYYY-MM-DD"),
    };
  };

  const setComponent = (component, state) => {
    dispatch(
      updateAgendamentoState({
        components: { ...components, [component]: state },
      })
    );
  };

  const setAgendamento = (key, value) => {
    dispatch(
      updateAgendamentoState({
        agendamento: { ...agendamento, [key]: value },
      })
    );
  };

  const getId = (field) => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field._id || field.id || field.value || "";
  };

  const normalizeId = (field) => (typeof field === "object" ? field?._id : field);

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
      })
    );
    setComponent("drawer", true);
  };

  const handleSelectEvent = (event) => {
    dispatch(
      updateAgendamentoState({
        behavior: "view",
        agendamento: event,
        form: { ...form, disabled: true },
      })
    );
    setComponent("drawer", true);
  };

  const handleEditar = () => {
    if (isLockedForEdit) return;
    dispatch(
      updateAgendamentoState({
        behavior: "update",
        agendamento: {
          ...agendamento,
          servicoId: getId(agendamento?.servicoId),
          colaboradorId: getId(agendamento?.colaboradorId),
        },
        form: { ...form, disabled: false },
      })
    );
  };

  const handleSalvar = () => {
    const payload = {
      ...agendamento,
      clienteId: normalizeId(agendamento.clienteId),
      servicoId: normalizeId(agendamento.servicoId),
      colaboradorId: normalizeId(agendamento.colaboradorId),
    };

    if (behavior === "create") dispatch(createAgendamentoRequest(payload));
    else dispatch(editAgendamentoRequest(payload));
  };

  const handleExcluir = () => {
    dispatch(deleteAgendamentoRequest(agendamento._id));
    setComponent("confirmDelete", false);
    setComponent("drawer", false);
  };

  const eventStyleGetter = (event) => {
    // considera fim do evento; se não tiver, usa start
    const eventEnd = moment(event?.end || event?.start);
    const isPast = eventEnd.isBefore(moment());

    const backgroundColor = isPast
      ? "#d9d9d9" // cinza claro para evento passado
      : event?.status === "confirmado"
        ? "#2e7d32" // verde
        : "#ef6c00"; // laranja

    return {
      style: {
        backgroundColor,
        color: isPast ? "#4a4a4a" : "#fff",
        borderRadius: 8,
        border: "none",
        padding: isMobile ? "2px 4px" : "4px 6px",
        fontSize: isMobile ? "0.72rem" : "0.82rem",
        lineHeight: 1.2,
        opacity: isPast ? 0.9 : 1,
      },
    };
  };

  const calendarStyles = {
    cursor: "pointer",
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(11, 16, 25, 0.78)"
        : "rgba(255, 255, 255, 0.90)",

    backdropFilter: "blur(6px)",
    color: theme.palette.mode === "dark" ? "#f3f6fb" : "#0f172a",
    height: isMobile ? "calc(100dvh - 230px)" : "calc(100dvh - 220px)",
    minHeight: 420,
    borderRadius: 12,
    boxShadow: theme.shadows[3],
    padding: isMobile ? 4 : 8,

    border: `1px solid ${theme.palette.mode === "dark"
      ? "rgba(255,255,255,0.14)"
      : "rgba(0,0,0,0.08)"
      }`,

    transition: "all 0.2s ease",

    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.shadows[8],
      borderColor:
        theme.palette.mode === "dark"
          ? "rgba(255,255,255,0.28)"
          : "rgba(0,0,0,0.18)",
    },
  };

  const servicosOptions = (servicos || []).map((s) => ({
    value: s.value || s._id || s.id,
    label: s.label || s.titulo || s.nome || "Sem nome",
  }));

  const clientesOptions = (clientes || []).map((c) => ({
    value: c.value || c._id,
    label: c.label || `${c.nome || ""} ${c.sobrenome || ""}`.trim(),
  }));

  const colaboradoresOptions = (colaboradores || []).map((c) => ({
    value: c.value || c._id,
    label: c.label || `${c.nome || ""} ${c.sobrenome || ""}`.trim(),
  }));

  const servicoSelecionadoId = getId(agendamento?.servicoId);
  const clienteSelecionadoId =
    typeof agendamento?.clienteId === "object"
      ? agendamento?.clienteId?._id || ""
      : agendamento?.clienteId || "";
  const colaboradorSelecionadoId =
    typeof agendamento?.colaboradorId === "object"
      ? agendamento?.colaboradorId?._id || ""
      : agendamento?.colaboradorId || "";

  const originalAgendamentoRef = useRef(null);

  const normalizeAgendamento = (a = {}) => ({
    data: a?.data ? String(a.data) : "",
    clienteId: typeof a?.clienteId === "object" ? a?.clienteId?._id || "" : a?.clienteId || "",
    colaboradorId: typeof a?.colaboradorId === "object" ? a?.colaboradorId?._id || "" : a?.colaboradorId || "",
    servicoId: typeof a?.servicoId === "object" ? a?.servicoId?._id || "" : a?.servicoId || "",
    status: a?.status || "",
    statusPagamento: a?.statusPagamento || "",
  });

  useEffect(() => {
    // quando abrir para visualizar/editar, salva snapshot
    if (components?.drawer && (behavior === "view" || behavior === "update")) {
      originalAgendamentoRef.current = normalizeAgendamento(agendamento);
    }
  }, [components?.drawer, behavior, agendamento]);

  const hasChanges = useMemo(() => {
    if (behavior === "create") return true;
    if (!originalAgendamentoRef.current) return false;
    return (
      JSON.stringify(normalizeAgendamento(agendamento)) !==
      JSON.stringify(originalAgendamentoRef.current)
    );
  }, [agendamento, behavior]);

  const agendamentoMoment = useMemo(() => {
    // usa data (persistida) e fallback para start (evento do calendário)
    return moment(agendamento?.data || agendamento?.start);
  }, [agendamento?.data, agendamento?.start]);

  const isLockedForEdit = useMemo(() => {
    if (!agendamentoMoment.isValid()) return false;

    const now = moment();
    const isBeforeToday = agendamentoMoment.isBefore(now, "day");
    const isTodayWithPastHour =
      agendamentoMoment.isSame(now, "day") &&
      agendamentoMoment.hour() < now.hour();

    return isBeforeToday || isTodayWithPastHour;
  }, [agendamentoMoment]);

  const isFormReadOnly =
    form?.disabled || (behavior === "update" && isLockedForEdit);

  const normalizeStatus = (status) => {
    const s = String(status || "").trim().toLowerCase();
    if (["a", "agendado", "pendente"].includes(s)) return "A";
    if (["c", "confirmado"].includes(s)) return "C";
    if (["f", "finalizado"].includes(s)) return "F";
    if (["x", "cancelado"].includes(s)) return "X";
    return "";
  };

  const statusValue = normalizeStatus(agendamento?.status);

  const isFilled = (v) => String(v ?? "").trim() !== "";

  const requiredFilled = useMemo(() => {
    const clienteId = normalizeId(agendamento?.clienteId);
    const servicoId = normalizeId(agendamento?.servicoId);
    const colaboradorId = normalizeId(agendamento?.colaboradorId);

    return (
      isFilled(agendamento?.data) &&
      isFilled(clienteId) &&
      isFilled(servicoId) &&
      isFilled(colaboradorId) &&
      isFilled(agendamento?.status) &&
      isFilled(agendamento?.statusPagamento)
    );
  }, [agendamento]);

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 1, sm: 2 },
        overflowX: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={1.5}
        mb={2}
      >
        <Typography
          variant={isMobile ? "h6" : "h5"}
          sx={{
            color: isDark ? "#fff" : "var(--primary-light)",
            fontWeight: 700,
          }}
        >
          Agendamentos
        </Typography>

        <Button
          variant="contained"
          onClick={handleNovoAgendamento}
          startIcon={<span className="mdi mdi-plus" />}
          fullWidth={isMobile}
          sx={{
            textTransform: "none",
            minHeight: 40,
            fontSize: "0.9rem",
            fontWeight: 600,
            alignSelf: { xs: "stretch", sm: "auto" },
          }}
        >
          Novo Agendamento
        </Button>
      </Stack>

      <Calendar
        localizer={localizer}
        date={currentDate}
        events={(formatEventos || []).filter((e) => e?.start && e?.end)}
        titleAccessor={(event) => event?.title || "Agendamento"}
        view={safeCurrentView}
        onView={(nextView) => {
          if (allowedViews.includes(nextView)) {
            setCurrentView(nextView);
          }
        }}
        onNavigate={(newDate) => setCurrentDate(newDate)}
        components={isMobile ? { toolbar: MobileCalendarToolbar } : undefined}
        views={views}
        defaultView={fallbackView}
        selectable
        popup
        step={30}
        timeslots={2}
        onRangeChange={(periodo) => {
          const { start, end } = formatRange(periodo);
          dispatch(filterAgendamentos(start, end));
        }}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        scrollToTime={moment().hour(8).minute(0).toDate()}
        style={calendarStyles}
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Evento",
          showMore: (total) => `+ ver mais (${total})`,
          noEventsInRange: "Sem agendamentos nesse período",
        }}
      />

      <CustomDrawer
        show={components.drawer}
        anchor={isMobile ? "bottom" : "right"}
        isOpen={components.drawer}
        onClose={() => setComponent("drawer", false)}
      >
        <Typography variant="h6" gutterBottom>
          {behavior === "create" ? "Novo Agendamento" : "Detalhes do Agendamento"}
        </Typography>
        <p>Verifique as informações antes de salvar:</p>

        <TextField
          label="Data e Hora"
          type="datetime-local"
          fullWidth
          margin="normal"
          disabled={isFormReadOnly}
          value={agendamento?.data ? moment(agendamento.data).format("YYYY-MM-DDTHH:mm") : ""}
          onChange={(e) => setAgendamento("data", e.target.value)}
          InputProps={{
            style: {
              fontSize: "0.8rem", // Altere esse valor conforme quiser
            }
          }}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel id="servico-label">Serviço</InputLabel>
          <Select
            labelId="servico-label"
            label="Serviço"
            disabled={isFormReadOnly}
            value={servicoSelecionadoId}
            onChange={(e) => setAgendamento("servicoId", e.target.value)}
            sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
            MenuProps={{
              PaperProps: {
                sx: {
                  fontSize: "0.8rem", // Aplica no dropdown
                },
              },
            }}
          >
            {servicosOptions.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel id="cliente-label">Cliente</InputLabel>
          <Select
            labelId="cliente-label"
            label="Cliente"
            disabled={isFormReadOnly}
            value={clienteSelecionadoId}
            onChange={(e) => setAgendamento("clienteId", e.target.value)}
            sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
            MenuProps={{
              PaperProps: {
                sx: {
                  fontSize: "0.8rem", // Aplica no dropdown
                },
              },
            }}
          >
            {clientesOptions.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel id="colaborador-label">Colaborador</InputLabel>
          <Select
            labelId="colaborador-label"
            label="Colaborador"
            value={colaboradorSelecionadoId}
            disabled={isFormReadOnly}
            onChange={(e) => setAgendamento("colaboradorId", e.target.value)}
            sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
            MenuProps={{
              PaperProps: {
                sx: {
                  fontSize: "0.8rem", // Aplica no dropdown
                },
              },
            }}
          >
            {colaboradoresOptions.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel id="status-agendamento-label">Status do Agendamento</InputLabel>
          <Select
            labelId="status-agendamento-label"
            label="Status do Agendamento"
            value={statusValue}
            onChange={(e) => setAgendamento("status", e.target.value)}
            disabled={isFormReadOnly}
            sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
            MenuProps={{
              PaperProps: {
                sx: {
                  fontSize: "0.8rem", // Aplica no dropdown
                },
              },
            }}
          >
            <MenuItem value="A">Agendado</MenuItem>
            <MenuItem value="C" disabled={behavior !== "update"}>Confirmado</MenuItem>
            <MenuItem value="F" disabled={behavior !== "update"}>Finalizado</MenuItem>
            <MenuItem value="X" disabled={behavior !== "update"}>Cancelado</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel id="status-pagamento-label">Status do Pagamento</InputLabel>
          <Select
            labelId="status-pagamento-label"
            label="Status do Pagamento"
            value={agendamento?.statusPagamento || ""}
            onChange={(e) => setAgendamento("statusPagamento", e.target.value)}
            disabled={isFormReadOnly}
            sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
            MenuProps={{
              PaperProps: {
                sx: {
                  fontSize: "0.8rem", // Aplica no dropdown
                },
              },
            }}
          >
            <MenuItem value="P">Pendente</MenuItem>
            <MenuItem value="PG">Pago</MenuItem>
            <MenuItem value="E">Estornado</MenuItem>
            <MenuItem value="N">Não se aplica</MenuItem>
          </Select>
        </FormControl>

        <Stack direction={{ xs: "column", sm: "row" }} gap={1.2} mt={3}>
          {behavior === "view" && (
            <Button variant="outlined" onClick={handleEditar} disabled={isLockedForEdit}>
              Alterar agendamento
            </Button>
          )}

          {(behavior === "create" || behavior === "update") && (
            <Button
              variant="contained"
              onClick={handleSalvar}
              disabled={
                form.loading ||
                !requiredFilled ||
                (behavior === "update" && (!hasChanges || isLockedForEdit))
              }
            >
              Salvar
            </Button>
          )}

          {behavior !== "create" && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setComponent("confirmDelete", true)}
            >
              Excluir
            </Button>
          )}
        </Stack>
      </CustomDrawer>

      <CustomDialog
        open={components.confirmDelete}
        title="Confirmar exclusão"
        content="Tem certeza que deseja excluir este agendamento? Essa ação não poderá ser desfeita."
        onClose={() => setComponent("confirmDelete", false)}
        onConfirm={handleExcluir}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />

      <Snackbar
        open={alerta.open}
        autoHideDuration={5000}
        onClose={() => dispatch(setAlerta({ ...alerta, open: false }))}
        TransitionComponent={SlideTransition}
        anchorOrigin={{
          vertical: "top",
          horizontal: isMobile ? "center" : "right",
        }}
      >
        <Alert
          onClose={() => dispatch(setAlerta({ ...alerta, open: false }))}
          severity={alerta.severity}
          sx={{ width: "100%" }}
        >
          <strong>{alerta.title}</strong>
          <br />
          {alerta.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Agendamentos;