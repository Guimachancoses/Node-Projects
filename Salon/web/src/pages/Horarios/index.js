import { useEffect, useState, forwardRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useTheme } from "@mui/material/styles"; // Para acessar o tema

import {
  Button,
  TextField,
  Checkbox,
  Autocomplete,
  FormControlLabel,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Slide from "@mui/material/Slide";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

// icons
import SaveIcon from "@mui/icons-material/Save";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

import {
  allHorarios,
  allServicos,
  updateHorario,
  addHorario,
  filterColaboradores,
  setAlerta,
  removeHorario,
} from "../../store/modules/horario/actions";

import CustomDrawer from "../../components/Drawer";
import CustomDialog from "../../components/DialogAlert";

import dayjs from "dayjs";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale("pt-br");
const localizer = momentLocalizer(moment);

const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const Horarios = () => {
  const dispatch = useDispatch();
  const { horario, horarios, servicos, colaboradores, components, behavior } =
    useSelector((state) => state.horario);
  const theme = useTheme(); // Obtém o tema (dark ou light)

  useEffect(() => {
    // Todos horários
    dispatch(allHorarios());

    // Todos os serviços
    dispatch(allServicos());
  }, []);

  useEffect(() => {
    if (horario.especialidades.length > 0) {
      dispatch(filterColaboradores());
    }
  }, [dispatch, horario.especialidades]);

  const setComponent = (component, state) => {
    dispatch(
      updateHorario({
        components: { ...components, [component]: state },
      })
    );
  };

  const setHorario = (key, value) => {
    dispatch(
      updateHorario({
        horario: { ...horario, [key]: value },
      })
    );
  };

  // Função para estilizar eventos
  const eventStyleGetter = (event) => {
    const backgroundColor =
      event.status === "confirmado" ? "#28a745" : "#ff5722"; // Verde para confirmados, Laranja para outros
    const color = "white"; // Cor do texto
    return {
      style: {
        backgroundColor,
        color,
        borderRadius: "4px",
        border: "none",
        padding: "5px",
        fontSize: "0.875rem",
      },
    };
  };

  // Estilo do Calendário conforme o tema (dark ou light)
  const calendarStyles = {
    cursor: "pointer",
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(47, 50, 67, 0.5)" // fundo levemente translúcido no modo escuro
        : "rgba(255, 255, 255, 0.8)", // fundo levemente translúcido no modo claro
    backdropFilter: "blur(4px)", // efeito de blur (vidro fosco)
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
    height: "600px",
    borderRadius: 2,
    boxShadow: theme.shadows[3],
  };

  const diasDaSemana = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];

  const diasSemanaData = [
    new Date(2021, 3, 11, 0, 0, 0, 0),
    new Date(2021, 3, 12, 0, 0, 0, 0),
    new Date(2021, 3, 13, 0, 0, 0, 0),
    new Date(2021, 3, 14, 0, 0, 0, 0),
    new Date(2021, 3, 15, 0, 0, 0, 0),
    new Date(2021, 3, 16, 0, 0, 0, 0),
    new Date(2021, 3, 17, 0, 0, 0, 0),
  ];

  const formatEventos = horarios
    .map((horario, index) =>
      horario.dias.map((dia) => ({
        resourse: horario,
        title: `${horario.especialidades.length} espec. e ${horario.colaboradores.length} colab.`,
        start: new Date(
          diasSemanaData[dia].setHours(
            parseInt(moment(horario.inicio).format("HH")),
            parseInt(moment(horario.inicio).format("mm"))
          )
        ),
        end: new Date(
          diasSemanaData[dia].setHours(
            parseInt(moment(horario.fim).format("HH")),
            parseInt(moment(horario.fim).format("mm"))
          )
        ),
      }))
    )
    .flat();

  const [loading, setLoading] = useState(false);

  const handleClickSave = () => {
    setLoading(true);
    save();
    // Simula uma requisição assíncrona
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const save = () => {
    dispatch(addHorario());
    //console.log("Clicou em salvar");
  };

  // Ao clicar em excluir
  const remove = () => {
    dispatch(removeHorario());
  };

  const handleNovoColaborador = () => {
    dispatch(
      updateHorario({
        behavior: "create",
        horario: {
          diasi: [],
          inicio: "",
          fim: "",
          especialidades: [],
          colaboradores: [],
        },
      })
    );
    setComponent("drawer", true);
    //console.log("Criar novo cliente");
  };

  // Responsavel pelo alerta
  const alerta = useSelector((state) => state.servico.alerta);

  const handleClose = () => {
    dispatch(setAlerta({ ...alerta, open: false }));
  };

  const handleOpenDialog = () => {
    setComponent("confirmDelete", true);
  };

  const handleCloseDialog = () => {
    setComponent("confirmDelete", false);
  };

  return (
    <div className="col p-5 overflow-auto h-100">
      {/* Drawer Component Controlado diretamente pelo estado do Redux */}
      <div
        style={{ display: "flex", flexDirection: "column", marginLeft: "16px" }}
      >
        <CustomDrawer
          show={components.drawer}
          anchor="right"
          isOpen={components.drawer}
          onClose={() => setComponent("drawer", false)}
        >
          <div className="col-12">
            <h3>
              {behavior === "create" ? "Criar novo" : "Atualizar"} horário de
              atendimento
            </h3>
            {/* Aqui você pode adicionar inputs, formulários, etc */}
            <p>Verifique as informações antes de salvar:</p>
            <div className="row mt-3">
              <div className="form-group col-12 mb-3"></div>
              <div className="form-group col-12">
                <Autocomplete
                  multiple
                  options={diasDaSemana.map((label, index) => ({
                    label,
                    value: index,
                  }))}
                  getOptionLabel={(option) => option.label}
                  value={(horario.dias || []).map((diaIndex) => ({
                    label: diasDaSemana[diaIndex],
                    value: diaIndex,
                  }))}
                  onChange={(event, newValue) => {
                    setHorario(
                      "dias",
                      newValue.map((item) => item.value)
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Dias da semana"
                      variant="outlined"
                      fullWidth
                    />
                  )}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={horario.dias?.length === diasDaSemana.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setHorario(
                            "dias",
                            diasDaSemana.map((_, i) => i)
                          );
                        } else {
                          setHorario("dias", []);
                        }
                      }}
                    />
                  }
                  label="Selecionar Todos"
                />
              </div>
              <div className="form-group col-12 mb-3">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="Horário Inicial"
                    value={horario?.inicio ? dayjs(horario?.inicio) : null} // Valor inicial
                    onChange={(newValue) => setHorario("inicio", newValue)}
                    minutesStep={30}
                    ampm={false}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth />
                    )}
                  />
                </LocalizationProvider>
              </div>
              <div className="form-group col-12 mb-3">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="Horário Final"
                    value={horario?.fim ? dayjs(horario?.fim) : null} // Valor inicial
                    onChange={(newValue) => setHorario("fim", newValue)}
                    minutesStep={30}
                    ampm={false}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth />
                    )}
                  />
                </LocalizationProvider>
              </div>
              <div className="form-group col-12">
                <Autocomplete
                  multiple
                  options={servicos}
                  getOptionLabel={(option) => option.label || option.nome}
                  value={servicos.filter((s) =>
                    horario.especialidades.includes(s.value)
                  )}
                  onChange={(e, newValue) =>
                    setHorario(
                      "especialidades",
                      newValue.map((v) => v.value)
                    )
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Especialidades" fullWidth />
                  )}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        horario.especialidades.length === servicos.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setHorario(
                            "especialidades",
                            servicos.map((s) => s.value)
                          );
                        } else {
                          setHorario("especialidades", []);
                        }
                      }}
                    />
                  }
                  label="Selecionar Todas"
                />
              </div>
              <div className="form-group col-12 mt-3">
                <Autocomplete
                  multiple
                  options={colaboradores}
                  getOptionLabel={(option) => option.label || option.nome}
                  value={colaboradores.filter((c) =>
                    horario.colaboradores.includes(c.value)
                  )}
                  disabled={horario.especialidades.length === 0}
                  onChange={(e, newValue) => {
                    setHorario(
                      "colaboradores",
                      newValue.map((v) => v.value)
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Colaboradores" fullWidth />
                  )}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled={horario.especialidades.length === 0}
                      checked={
                        horario.colaboradores.length === colaboradores.length &&
                        colaboradores.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setHorario(
                            "colaboradores",
                            colaboradores.map((c) => c.value)
                          );
                        } else {
                          setHorario("colaboradores", []);
                        }
                      }}
                    />
                  }
                  label="Selecionar Todos"
                />
              </div>
            </div>
          </div>
          <Button
            fullWidth
            variant="contained"
            onClick={handleClickSave}
            loading={loading}
            loadingPosition="start"
            startIcon={<SaveIcon />}
            size="large"
            sx={{
              mt: 3,
              backgroundColor: behavior === "create" ? "#2e7d32" : "#1565c0", // verde e azul
              "&:hover": {
                mt: 3,
                backgroundColor: behavior === "create" ? "#1b5e20" : "#0d47a1",
              },
            }}
          >
            {behavior === "create" ? "Salvar" : "Salvar alterações"}
          </Button>
          {behavior === "update" && (
            <Button
              fullWidth
              loading={loading}
              loadingPosition="start"
              variant="contained"
              startIcon={<DeleteForeverIcon />}
              size="large"
              onClick={() => {
                handleOpenDialog();
                setComponent("confirmDelete", true);
              }}
              sx={{
                mt: 3,
                backgroundColor: behavior === "update" ? "#d62828" : "#d62828", // verde e azul
                "&:hover": {
                  mt: 3,
                  backgroundColor:
                    behavior === "update" ? "#d62828" : "#d62828",
                },
              }}
            >
              Remover Horário de Atendimento
            </Button>
          )}
        </CustomDrawer>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="w-100 d-flex justify-content-between">
            <h2 className="mb-4 mt-0" style={{ color: "white" }}>
              Horários de Atendimento
            </h2>
            <div>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleNovoColaborador}
              >
                <span className="mdi mdi-plus"> Novo Horário</span>
              </button>
            </div>
          </div>
          <Calendar
            localizer={localizer}
            toolbar={false}
            formats={{
              dateFormat: "dd",
              dayFormat: (date, culturem, localizer) =>
                localizer.format(date, "dddd", culturem),
            }}
            events={formatEventos}
            date={diasSemanaData[moment().day()]}
            view="week"
            selectable={true}
            popup={true}
            onSelectEvent={(e) => {
              dispatch(
                updateHorario({
                  behavior: "update",
                })
              );
              dispatch(
                updateHorario({
                  horario: e.resourse,
                })
              );
              setComponent("drawer", true);
            }}
            onSelectSlot={(slotInfo) => {
              const { start, end } = slotInfo;
              dispatch(
                updateHorario({
                  behavior: "create",
                  horario: {
                    ...horario,
                    dias: [moment(start).day()],
                    inicio: start,
                    fim: end,
                  },
                })
              );
              setComponent("drawer", true);
            }}
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
            style={calendarStyles} // Aplica o estilo baseado no tema
            eventPropGetter={eventStyleGetter} // Aplica a estilização personalizada aos eventos
          />
        </div>
      </div>
      <Snackbar
        open={alerta.open}
        autoHideDuration={5000}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleClose} severity={alerta.severity}>
          <strong>{alerta.title}</strong>
          <br />
          {alerta.message}
        </Alert>
      </Snackbar>
      <CustomDialog
        open={components.confirmDelete}
        title="Confirmar exclusão"
        content="Tem certeza que deseja excluir o serviço selecionado? Essa ação não poderá ser desfeita."
        onClose={handleCloseDialog}
        onConfirm={() => {
          remove();
        }}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </div>
  );
};

export default Horarios;
