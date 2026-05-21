import { useEffect, useMemo, useState, forwardRef, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

import {
  Box,
  Button,
  TextField,
  Checkbox,
  Autocomplete,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Typography,
  Stack,
  Grid,
} from "@mui/material";

import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Slide from "@mui/material/Slide";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

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

const getId = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.value || item._id || item.id || "";
};

const toIdArray = (arr) =>
  (arr || [])
    .map(getId)
    .filter(Boolean)
    .map(String);

const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const eventColors = [
  "#2e7d32",
  "#1565c0",
  "#7b1fa2",
  "#ef6c00",
  "#00838f",
  "#c62828",
  "#5d4037",
  "#455a64",
];

const Horarios = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDark = theme.palette.mode === "dark"

  const { horario, horarios, servicos, colaboradores, components, behavior, alerta } =
    useSelector((state) => state.horario);

  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(isMobile ? "day" : "week");

  useEffect(() => {
    dispatch(allHorarios());
    dispatch(allServicos());
  }, [dispatch]);

  const views = useMemo(() => {
    if (isMobile) return { day: true, agenda: true };
    if (isTablet) return { day: true, week: true };
    return { week: true, day: true, agenda: true };
  }, [isMobile, isTablet]);

  useEffect(() => {
    const allowed = Object.keys(views);
    if (!allowed.includes(currentView)) {
      setCurrentView(isMobile ? "day" : "week");
    }
  }, [views, currentView, isMobile]);

  const diasDaSemana = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];

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

  const formatEventos = useMemo(() => {
    const eventos = (horarios || [])
      .map((h) =>
        (h?.dias || []).map((dia) => {
          const inicio = moment(h?.inicio);
          const fim = moment(h?.fim);

          const startMoment = moment(currentDate)
            .startOf("week")
            .add(dia, "days")
            .hour(inicio.hour())
            .minute(inicio.minute())
            .second(0);

          const endMoment = moment(currentDate)
            .startOf("week")
            .add(dia, "days")
            .hour(fim.hour())
            .minute(fim.minute())
            .second(0);

          return {
            resource: h,
            title: `${h?.especialidades?.length || 0} espec. • ${h?.colaboradores?.length || 0} colab.`,
            start: startMoment.toDate(),
            end: endMoment.toDate(),
            dia,
            timeKey: `${dia}-${startMoment.format("HH:mm")}-${endMoment.format("HH:mm")}`,
          };
        })
      )
      .flat();

    const groupedByTime = eventos.reduce((acc, event) => {
      if (!acc[event.timeKey]) acc[event.timeKey] = [];
      acc[event.timeKey].push(event);
      return acc;
    }, {});

    return eventos.map((event) => {
      const group = groupedByTime[event.timeKey] || [];
      const overlapIndex = group.findIndex((item) => item.resource?._id === event.resource?._id);

      return {
        ...event,
        overlapIndex: overlapIndex >= 0 ? overlapIndex : 0,
        overlapTotal: group.length,
        color: eventColors[overlapIndex % eventColors.length],
      };
    });
  }, [horarios, currentDate]);

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event?.color || "#2e7d32",
      color: "#fff",
      borderRadius: "8px",
      border: "none",
      padding: "4px 6px",
      fontSize: isMobile ? "0.72rem" : "0.82rem",
      boxShadow:
        event?.overlapTotal > 1
          ? `inset 4px 0 0 rgba(255,255,255,0.45)`
          : "none",
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
    height: isMobile ? "calc(100dvh - 220px)" : "calc(100dvh - 250px)",
    minHeight: 420,
    borderRadius: 12,
    boxShadow: theme.shadows[3],
    padding: isMobile ? 4 : 8,
  };

  const handleClickSave = () => {
    setLoading(true);
    dispatch(addHorario());
    setTimeout(() => setLoading(false), 1200);
  };

  const handleRemove = () => {
    dispatch(removeHorario());
  };

  const handleNovoHorario = () => {
    dispatch(
      updateHorario({
        behavior: "create",
        horario: {
          dias: [],
          inicio: "",
          fim: "",
          especialidades: [],
          colaboradores: [],
        },
      })
    );
    setComponent("drawer", true);
  };

  const handleClose = () => {
    dispatch(setAlerta({ ...alerta, open: false }));
  };

  const capitalize = (text = "") =>
    text.charAt(0).toUpperCase() + text.slice(1);

  const mobileFormats = {
    // Apenas nomes da semana
    dateFormat: "dd",
    dayFormat: (date, culturem, localizer) =>
      localizer.format(date, "dddd", culturem),

    // Título do topo quando a view é "day"
    dayHeaderFormat: (date, culture, localizer) =>
      localizer ? capitalize(localizer.format(date, "dddd", culture)) : "Segunda-feira",

    // Título do topo quando a view é "agenda"
    agendaHeaderFormat: () => "Segunda à Sábado",

    agendaDateFormat: (date, culture, localizer) =>
      capitalize(localizer.format(date, "dddd", culture)),
  };

  const originalHorarioRef = useRef(null);
  const lastUpdateKeyRef = useRef("");

  // Normaliza dados para comparar mudanças reais
  const normalizeHorario = (h = {}) => ({
    dias: [...(h?.dias || [])].sort((a, b) => a - b),
    inicio: h?.inicio && moment(h.inicio).isValid() ? moment(h.inicio).format("HH:mm") : "",
    fim: h?.fim && moment(h.fim).isValid() ? moment(h.fim).format("HH:mm") : "",
    especialidades: [...(h?.especialidades || [])].sort(),
    colaboradores: [...(h?.colaboradores || [])].sort(),
  });

  // chave para detectar troca de registro em update
  const updateKey = useMemo(() => {
    const id = horario?._id || "sem-id";
    const ini = horario?.inicio ? moment(horario.inicio).valueOf() : "";
    const fim = horario?.fim ? moment(horario.fim).valueOf() : "";
    const dias = (horario?.dias || []).join(",");
    return `${id}|${ini}|${fim}|${dias}`;
  }, [horario?._id, horario?.inicio, horario?.fim, horario?.dias]);

  // snapshot original só quando entra/troca update
  useEffect(() => {
    if (!components?.drawer || behavior !== "update") return;
    if (lastUpdateKeyRef.current !== updateKey) {
      originalHorarioRef.current = normalizeHorario(horario);
      lastUpdateKeyRef.current = updateKey;
    }
  }, [components?.drawer, behavior, updateKey, horario]);

  const hasChanges = useMemo(() => {
    if (behavior === "create") return true;
    if (!originalHorarioRef.current) return false;

    const current = normalizeHorario(horario);
    return JSON.stringify(current) !== JSON.stringify(originalHorarioRef.current);
  }, [behavior, horario]);

  // Campos obrigatórios preenchidos
  const requiredFilled = useMemo(() => {
    const inicioValido = horario?.inicio && moment(horario.inicio).isValid();
    const fimValido = horario?.fim && moment(horario.fim).isValid();

    return (
      (horario?.dias || []).length > 0 &&
      inicioValido &&
      fimValido &&
      (horario?.especialidades || []).length > 0 &&
      (horario?.colaboradores || []).length > 0
    );
  }, [horario]);

  const isSaveDisabled =
    loading ||
    !requiredFilled ||
    (behavior === "update" && !hasChanges);

  const servicosSafe = (servicos || []).filter(Boolean);
  const colaboradoresSafe = (colaboradores || []).filter(Boolean);

  const especialidadesIds = useMemo(
    () => toIdArray(horario?.especialidades),
    [horario?.especialidades]
  );

  const especialidadesKey = useMemo(
    () => especialidadesIds.join("|"),
    [especialidadesIds]
  );

  const colaboradoresIds = useMemo(
    () => toIdArray(horario?.colaboradores),
    [horario?.colaboradores]
  );

  useEffect(() => {
    if (!especialidadesIds.length) return;
    dispatch(filterColaboradores(especialidadesIds));
  }, [dispatch, especialidadesKey, especialidadesIds]);

  //console.log("colaboradoresSafe", colaboradoresSafe)

  return (
    <Box sx={{ px: { xs: 1.5, sm: 2.5, md: 3 }, py: { xs: 1, sm: 2 }, height: "100%" }}>
      <CustomDrawer
        show={components.drawer}
        anchor={isMobile ? "bottom" : "right"}
        isOpen={components.drawer}
        onClose={() => setComponent("drawer", false)}
      >
        <Typography variant="h6" mb={1}>
          {behavior === "create" ? "Criar novo" : "Atualizar"} horário de atendimento
        </Typography>
        <Typography variant="body2" mb={2}>
          Verifique as informações antes de salvar:
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={diasDaSemana.map((label, index) => ({ label, value: index }))}
              getOptionLabel={(option) =>
                (option?.label || option?.nome || option?.value || "").toString()
              }
              sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
              MenuProps={{
                PaperProps: {
                  sx: {
                    fontSize: "0.8rem", // Aplica no dropdown
                  },
                },
              }}
              value={(horario?.dias || []).map((diaIndex) => ({
                label: diasDaSemana[diaIndex],
                value: diaIndex,
              }))}
              onChange={(event, newValue) => {
                setHorario("dias", newValue.map((item) => item.value));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Dias da semana" variant="outlined" fullWidth />
              )}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={(horario?.dias || []).length === diasDaSemana.length}
                  sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        fontSize: "0.8rem", // Aplica no dropdown
                      },
                    },
                  }}
                  onChange={(e) => {
                    if (e.target.checked) setHorario("dias", diasDaSemana.map((_, i) => i));
                    else setHorario("dias", []);
                  }}
                />
              }
              label="Selecionar Todos"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                label="Horário Inicial"
                value={horario?.inicio ? dayjs(horario.inicio) : null}
                onChange={(newValue) => setHorario("inicio", newValue)}
                minutesStep={30}
                ampm={false}
                slotProps={{ textField: { fullWidth: true } }}
                sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
                MenuProps={{
                  PaperProps: {
                    sx: {
                      fontSize: "0.8rem", // Aplica no dropdown
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                label="Horário Final"
                value={horario?.fim ? dayjs(horario.fim) : null}
                onChange={(newValue) => setHorario("fim", newValue)}
                minutesStep={30}
                ampm={false}
                slotProps={{ textField: { fullWidth: true } }}
                sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
                MenuProps={{
                  PaperProps: {
                    sx: {
                      fontSize: "0.8rem", // Aplica no dropdown
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={servicosSafe}
              getOptionLabel={(option) => option?.label || option?.nome || ""}
              sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
              MenuProps={{
                PaperProps: {
                  sx: {
                    fontSize: "0.8rem", // Aplica no dropdown
                  },
                },
              }}
              isOptionEqualToValue={(option, value) =>
                String(getId(option)) === String(getId(value))
              }
              value={servicosSafe.filter((s) =>
                especialidadesIds.includes(String(getId(s)))
              )}
              onChange={(e, newValue) => {
                const ids = newValue.map(getId).filter(Boolean);
                setHorario("especialidades", ids);
                setHorario("colaboradores", []); // evita seleção inconsistente
              }}
              renderInput={(params) => (
                <TextField {...params} label="Especialidades" fullWidth />
              )}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={(horario?.especialidades || []).length === (servicos || []).length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setHorario("especialidades", servicosSafe.map(getId).filter(Boolean));
                    } else {
                      setHorario("especialidades", []);
                    }
                  }}
                />
              }
              label="Selecionar Todas"
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={colaboradoresSafe}
              getOptionLabel={(option) => option?.label || option?.nome || ""}
              sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
              MenuProps={{
                PaperProps: {
                  sx: {
                    fontSize: "0.8rem", // Aplica no dropdown
                  },
                },
              }}
              isOptionEqualToValue={(option, value) =>
                String(getId(option)) === String(getId(value))
              }
              value={colaboradoresSafe.filter((c) =>
                colaboradoresIds.includes(String(getId(c)))
              )}
              disabled={especialidadesIds.length === 0}
              onChange={(e, newValue) =>
                setHorario("colaboradores", newValue.map(getId).filter(Boolean))
              }
              renderInput={(params) => <TextField {...params} label="Colaboradores" fullWidth />}
            />
            <FormControlLabel
              control={
                <Checkbox
                  disabled={(horario?.especialidades || []).length === 0}
                  sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        fontSize: "0.8rem", // Aplica no dropdown
                      },
                    },
                  }}
                  checked={
                    (horario?.colaboradores || []).length === (colaboradores || []).length &&
                    (colaboradores || []).length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setHorario("colaboradores", colaboradoresSafe.map(getId).filter(Boolean));
                    } else {
                      setHorario("colaboradores", []);
                    }
                  }}
                />
              }
              label="Selecionar Todos"
            />
          </Grid>
        </Grid>

        <Button
          fullWidth
          variant="contained"
          onClick={handleClickSave}
          startIcon={<SaveIcon />}
          disabled={isSaveDisabled}
          size="large"
          sx={{
            mt: 2,
            backgroundColor: behavior === "create" ? "#2e7d32" : "#1565c0",
            "&:hover": {
              backgroundColor: behavior === "create" ? "#1b5e20" : "#0d47a1",
            },
          }}
        >
          {behavior === "create" ? "Salvar" : "Salvar alterações"}
        </Button>

        {behavior === "update" && (
          <Button
            fullWidth
            variant="contained"
            startIcon={<DeleteForeverIcon />}
            size="large"
            onClick={() => setComponent("confirmDelete", true)}
            sx={{
              mt: 2,
              backgroundColor: "#d62828",
              "&:hover": { backgroundColor: "#b71c1c" },
            }}
          >
            Remover Horário de Atendimento
          </Button>
        )}
      </CustomDrawer>

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
          }}>
          Horários de Atendimento
        </Typography>

        <Button
          variant="contained"
          onClick={handleNovoHorario}
          fullWidth={isMobile}
          startIcon={<span className="mdi mdi-plus" />}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Novo Horário
        </Button>
      </Stack>

      <Calendar
        localizer={localizer}
        toolbar={isMobile ? true : false}
        events={formatEventos}
        date={currentDate}
        view={currentView}
        onNavigate={(newDate) => setCurrentDate(newDate)}
        onView={(nextView) => setCurrentView(nextView)}
        views={views}
        selectable
        popup
        formats={mobileFormats}
        length={6}
        onSelectEvent={(e) => {
          const r = e?.resource || {};

          dispatch(
            updateHorario({
              behavior: "update",
              horario: {
                ...r,
                especialidades: toIdArray(r?.especialidades),
                colaboradores: toIdArray(r?.colaboradores),
              },
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
        style={calendarStyles}
        eventPropGetter={eventStyleGetter}
      />

      <Snackbar
        open={alerta?.open}
        autoHideDuration={5000}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{
          vertical: "top",
          horizontal: isMobile ? "center" : "right",
        }}
      >
        <Alert onClose={handleClose} severity={alerta?.severity || "info"}>
          <strong>{alerta?.title}</strong>
          <br />
          {alerta?.message}
        </Alert>
      </Snackbar>

      <CustomDialog
        open={components?.confirmDelete}
        title="Confirmar exclusão"
        content="Tem certeza que deseja excluir o horário selecionado? Essa ação não poderá ser desfeita."
        onClose={() => setComponent("confirmDelete", false)}
        onConfirm={handleRemove}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </Box>
  );
};

export default Horarios;
