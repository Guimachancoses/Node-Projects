import { useEffect, useMemo, useState, forwardRef } from "react";
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
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";

import CustomDrawer from "../../components/Drawer";
import CustomDialog from "../../components/DialogAlert";
import PopSyncCalendarDrive from "../../components/pop-sync-calendarDrive";
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

  const views = useMemo(() => {
    if (isMobile) return { day: true, agenda: true };
    if (isTablet) return { day: true, week: true, agenda: true };
    return { month: true, week: true, day: true, agenda: true };
  }, [isMobile, isTablet]);

  const fallbackView = isMobile ? "day" : "week";
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(fallbackView);

  // Garante que a view atual sempre existe no conjunto de views permitido
  useEffect(() => {
    const allowed = Object.keys(views);
    if (!allowed.includes(currentView)) {
      setCurrentView(fallbackView);
    }
  }, [views, currentView, fallbackView]);

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

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.status === "confirmado" ? "#2e7d32" : "#ef6c00",
      color: "#fff",
      borderRadius: 8,
      border: "none",
      padding: isMobile ? "2px 4px" : "4px 6px",
      fontSize: isMobile ? "0.72rem" : "0.82rem",
      lineHeight: 1.2,
    },
  });

  const calendarStyles = {
    cursor: "pointer",
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(47, 50, 67, 0.5)"
        : "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(4px)",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
    height: isMobile ? "calc(100dvh - 230px)" : "calc(100dvh - 220px)",
    minHeight: 420,
    borderRadius: 12,
    boxShadow: theme.shadows[3],
    padding: isMobile ? 4 : 8,
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



  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 1, sm: 2 },
        overflowX: "hidden",
      }}
    >
      <PopSyncCalendarDrive />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={1.5}
        mb={2}
      >
        <Typography
          variant={isMobile ? "h6" : "h5"}
          sx={{ color: "white", fontWeight: 700 }}
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
        view={currentView}
        onView={(nextView) => setCurrentView(nextView)}
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

        <TextField
          label="Data e Hora"
          type="datetime-local"
          fullWidth
          margin="normal"
          value={agendamento?.data ? moment(agendamento.data).format("YYYY-MM-DDTHH:mm") : ""}
          onChange={(e) => setAgendamento("data", e.target.value)}
          disabled={form.disabled}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel id="servico-label">Serviço</InputLabel>
          <Select
            labelId="servico-label"
            label="Serviço"
            value={servicoSelecionadoId}
            onChange={(e) => setAgendamento("servicoId", e.target.value)}
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
            value={clienteSelecionadoId}
            onChange={(e) => setAgendamento("clienteId", e.target.value)}
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
            onChange={(e) => setAgendamento("colaboradorId", e.target.value)}
          >
            {colaboradoresOptions.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction={{ xs: "column", sm: "row" }} gap={1.2} mt={3}>
          {behavior === "view" && (
            <Button variant="outlined" onClick={handleEditar}>
              Alterar agendamento
            </Button>
          )}

          {(behavior === "create" || behavior === "update") && (
            <Button variant="contained" onClick={handleSalvar} disabled={form.loading}>
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