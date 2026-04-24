import { useEffect, useMemo, forwardRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import "moment/locale/pt-br";
import util from "../../util";

import {
  Button,
  Typography,
  TextField,
  Snackbar,
  Slide,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";

import CustomDrawer from "../../components/Drawer";
import CustomDialog from "../../components/DialogAlert";
import PopSyncCalendarDrive from "../../components/pop-sync-calendarDrive";

import {
  filterAgendamentos,
  updateAgendamentoState,
  createAgendamentoRequest,
  editAgendamentoRequest,
  deleteAgendamentoRequest,
  setAlerta,
  allServicos,
  allClientes, // novo
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
  const theme = useTheme();

  const {
    agendamentos,
    agendamento,
    behavior,
    components,
    form,
    alerta,
    servicos,
    clientes, // novo
  } = useSelector((state) => state.agendamento);

  useEffect(() => {
    dispatch(
      filterAgendamentos(
        moment().weekday(0).format("YYYY-MM-DD"),
        moment().weekday(6).format("YYYY-MM-DD")
      )
    );
    dispatch(allServicos());
    dispatch(allClientes()); // novo
  }, [dispatch]);

  const formatEventos = useMemo(() => {
    return agendamentos.map((item) => ({
      ...item,
      title: `${item.servicoId?.titulo} - ${item.clienteId?.nome} ${item.clienteId?.sobrenome?.charAt(0) || ""}. - ${item.colaboradorId?.nome} ${item.colaboradorId?.sobrenome?.charAt(0) || ""}.`,
      start: moment(item.data).toDate(),
      end: moment(item.data)
        .add(util.hourToMinutes(moment(item.servicoId?.duracao).format("HH:mm")), "minutes")
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

  const handleNovoAgendamento = () => {
    dispatch(
      updateAgendamentoState({
        behavior: "create",
        agendamento: {
          clienteId: "",
          colaboradorId: null,
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
        form: { ...form, disabled: false },
      })
    );
  };

  const normalizeId = (field) =>
    typeof field === "object" ? field?._id : field;

  const handleSalvar = () => {
    const payload = {
      ...agendamento,
      clienteId: normalizeId(agendamento.clienteId),
      servicoId: normalizeId(agendamento.servicoId),
      colaboradorId: normalizeId(agendamento.colaboradorId),
    };

    if (behavior === "create") {
      dispatch(createAgendamentoRequest(payload));
    } else {
      dispatch(editAgendamentoRequest(payload));
    }
  };

  const handleExcluir = () => {
    dispatch(deleteAgendamentoRequest(agendamento._id));
    setComponent("confirmDelete", false);
    setComponent("drawer", false);
  };

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.status === "confirmado" ? "#28a745" : "#ff5722",
      color: "#fff",
      borderRadius: "4px",
      border: "none",
      padding: "5px",
      fontSize: "0.875rem",
    },
  });

  const calendarStyles = {
    cursor: "pointer",
    backgroundColor:
      theme.palette.mode === "dark" ? "rgba(47, 50, 67, 0.5)" : "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(4px)",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
    height: "600px",
    borderRadius: 2,
    boxShadow: theme.shadows[3],
  };

  const servicoSelecionadoId =
    typeof agendamento?.servicoId === "object"
      ? agendamento?.servicoId?._id || ""
      : agendamento?.servicoId || "";

  const servicoSelecionadoTitulo =
    typeof agendamento?.servicoId === "object"
      ? agendamento?.servicoId?.titulo
      : servicos?.find((s) => s.value === agendamento?.servicoId)?.label;

  const clientesOptions = (clientes || []).map((c) => ({
    value: c.value || c._id,
    label: c.label || `${c.nome || ""} ${c.sobrenome || ""}`.trim(),
  }));

  const clienteSelecionadoId =
    typeof agendamento?.clienteId === "object"
      ? agendamento?.clienteId?._id || ""
      : agendamento?.clienteId || "";

  return (
    <div className="col p-5 overflow-auto h-100">
      <PopSyncCalendarDrive />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="m-0" style={{ color: "white" }}>Agendamentos</h2>
        <Button variant="contained" onClick={handleNovoAgendamento}>
          + Agendamento
        </Button>
      </div>

      <Calendar
        localizer={localizer}
        onRangeChange={(periodo) => {
          const { start, end } = formatRange(periodo);
          dispatch(filterAgendamentos(start, end));
        }}
        events={formatEventos}
        defaultView="week"
        selectable
        popup
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
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
        }}
      />

      <CustomDrawer
        show={components.drawer}
        anchor="right"
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

        {(behavior === "create" || behavior === "update") ? (
          <FormControl fullWidth margin="normal">
            <InputLabel id="servico-label">Serviço</InputLabel>
            <Select
              labelId="servico-label"
              label="Serviço"
              value={servicoSelecionadoId}
              onChange={(e) => setAgendamento("servicoId", e.target.value)}
              disabled={form.disabled}
            >
              {servicos?.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Serviço:</strong> {servicoSelecionadoTitulo || "-"}
          </Typography>
        )}
        <FormControl fullWidth margin="normal">
          <InputLabel id="cliente-label">Cliente</InputLabel>
          <Select
            labelId="cliente-label"
            label="Cliente"
            value={clienteSelecionadoId}
            onChange={(e) => setAgendamento("clienteId", e.target.value)}
            disabled={behavior !== "create"} // <- só permite escolher no + Agendamento
          >
            {clientesOptions.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="body2">
          <strong>Colaborador:</strong> {agendamento?.colaboradorId?.nome || "-"} {agendamento?.colaboradorId?.sobrenome || ""}
        </Typography>

        <div className="d-flex gap-2 mt-4">
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
        </div>
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
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => dispatch(setAlerta({ ...alerta, open: false }))} severity={alerta.severity}>
          <strong>{alerta.title}</strong><br />
          {alerta.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Agendamentos;