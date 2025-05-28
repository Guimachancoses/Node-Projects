const { DateTime } = require("luxon");
const Agendamento = require("../models/agendamento");
const PushToken = require("../models/push_tokens");
const expo = require("../server/expo/expo");

async function enviarNotificacaoParaCliente(clienteId, title, body, data = {}) {
  try {
    const tokens = await PushToken.find({
      model: "Cliente",
      referenciaId: clienteId,
    });

    let messages = tokens.map((token) => ({
      to: token.token,
      sound: "default",
      title,
      body,
      data,
    }));

    let chunks = expo.chunkPushNotifications(messages);

    for (let chunk of chunks) {
      try {
        let tickets = await expo.sendPushNotificationsAsync(chunk);
        console.log(`Notificação enviada para cliente ${clienteId}:`, tickets);
      } catch (error) {
        console.error(
          `Erro ao enviar notificação para cliente ${clienteId}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error(
      `Erro ao processar notificação para cliente ${clienteId}:`,
      error
    );
  }
}

async function verificarAgendamentos() {
  try {
    const agoraSP = DateTime.now().setZone("America/Sao_Paulo");
    const dataAlvoInicio = agoraSP
      .plus({ days: 1 })
      .startOf("day")
      .toUTC()
      .toJSDate();
    const dataAlvoFim = agoraSP
      .plus({ days: 1 })
      .endOf("day")
      .toUTC()
      .toJSDate();

    //console.log("dataAlvoInicio: ", dataAlvoInicio);
    //console.log("dataAlvoFim: ", dataAlvoFim);

    const agendamentos = await Agendamento.find({
      status: "P",
      data: { $gte: dataAlvoInicio, $lte: dataAlvoFim },
    });

    //console.log(`Agendamentos encontrados: ${agendamentos.length}`);

    for (let agendamento of agendamentos) {
      try {
        if (agendamento.clienteId) {
          await enviarNotificacaoParaCliente(
            agendamento.clienteId,
            "Confirmação de agendamento",
            "Seu agendamento será amanhã! Por favor, confirme sua presença.",
            { agendamentoId: agendamento._id }
          );
        }
      } catch (error) {
        console.error(
          `Erro ao enviar notificação para agendamento ${agendamento._id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Erro ao verificar agendamentos:", error);
  }
}

function iniciarAgendamentoReminderScheduler() {
  try {
    console.log("Agendamento Reminder Scheduler iniciado.");

    verificarAgendamentos();

    // A cada 10 minutos
    setInterval(verificarAgendamentos, 10 * 60 * 1000);
    //setInterval(verificarAgendamentos, 1000);
  } catch (error) {
    console.error("Erro ao iniciar Agendamento Reminder Scheduler:", error);
  }
}

module.exports = iniciarAgendamentoReminderScheduler;
