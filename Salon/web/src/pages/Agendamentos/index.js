import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { filterAgendamentos } from "../../store/modules/agendamento/actions";
import moment from "moment";
import "moment/locale/pt-br";
import util from "../../util";
import { Modal, Button } from "react-bootstrap";
import { useTheme } from '@mui/material/styles'; // Para acessar o tema

moment.locale("pt-br");
const localizer = momentLocalizer(moment);

const Agendamentos = () => {
  const dispatch = useDispatch();
  const { agendamentos } = useSelector((state) => state.agendamento);
  const theme = useTheme(); // Obtém o tema (dark ou light)

  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const formatEventos = useMemo(() => {
    return agendamentos.map((agendamento) => ({
      ...agendamento,
      title: `${agendamento.servicoId.titulo} - ${agendamento.clienteId.nome} ${
        agendamento.clienteId.sobrenome?.charAt(0) || ""
      }. - ${agendamento.colaboradorId.nome} ${
        agendamento.colaboradorId.sobrenome?.charAt(0) || ""
      }.`,
      start: moment(agendamento.data).toDate(),
      end: moment(agendamento.data)
        .add(
          util.hourToMinutes(
            moment(agendamento.servicoId.duracao).format("HH:mm")
          ),
          "minutes"
        )
        .toDate(),
    }));
  }, [agendamentos]);

  const formatRange = (periodo) => {
    let finalRange = {};
    if (Array.isArray(periodo)) {
      finalRange = {
        start: moment(periodo[0]).format("YYYY-MM-DD"),
        end: moment(periodo[periodo.length - 1]).format("YYYY-MM-DD"),
      };
    } else {
      finalRange = {
        start: moment(periodo.start).format("YYYY-MM-DD"),
        end: moment(periodo.end).format("YYYY-MM-DD"),
      };
    }

    return finalRange;
  };

  useEffect(() => {
    dispatch(
      filterAgendamentos(
        moment().weekday(0).format("YYYY-MM-DD"),
        moment().weekday(6).format("YYYY-MM-DD")
      )
    );
  }, []);

  const handleSelectEvent = (event) => {
    setEventoSelecionado(event);
    setShowModal(true);
  };

  // Função para estilizar eventos
  const eventStyleGetter = (event) => {
    const backgroundColor = event.status === "confirmado" ? "#28a745" : "#ff5722"; // Verde para confirmados, Laranja para outros
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
    backgroundColor: theme.palette.mode === "dark"
      ? "rgba(47, 50, 67, 0.5)" // fundo levemente translúcido no modo escuro
      : "rgba(255, 255, 255, 0.8)", // fundo levemente translúcido no modo claro
    backdropFilter: "blur(4px)", // efeito de blur (vidro fosco)
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
    height: "600px",
    borderRadius: 2,
    boxShadow: theme.shadows[3],
  };
  

  return (
    <div className="col p-5 overflow-auto h-100">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4 mt-0" style={{color: "white"}}>Agendamentos</h2>
          <Calendar
            localizer={localizer}
            onRangeChange={(periodo) => {
              const { start, end } = formatRange(periodo);
              dispatch(filterAgendamentos(start, end));
            }}
            events={formatEventos}
            defaultView="week"
            selectable={true}
            popup={true}
            onSelectEvent={handleSelectEvent}
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

          {/* Modal do Evento */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Detalhes do Agendamento</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {eventoSelecionado && (
                <>
                  <p>
                    <strong>Serviço:</strong>{" "}
                    {eventoSelecionado.servicoId?.titulo}
                  </p>
                  <p>
                    <strong>Cliente:</strong>{" "}
                    {eventoSelecionado.clienteId?.nome}{" "}
                    {eventoSelecionado.clienteId?.sobrenome}
                  </p>
                  <p>
                    <strong>Colaborador:</strong>{" "}
                    {eventoSelecionado.colaboradorId?.nome}{" "}
                    {eventoSelecionado.colaboradorId?.sobrenome}
                  </p>
                  <p>
                    <strong>Início:</strong>{" "}
                    {moment(eventoSelecionado.start).format("DD/MM/YYYY HH:mm")}
                  </p>
                  <p>
                    <strong>Fim:</strong>{" "}
                    {moment(eventoSelecionado.end).format("DD/MM/YYYY HH:mm")}
                  </p>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Fechar
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default Agendamentos;
