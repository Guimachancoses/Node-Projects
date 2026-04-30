const { DateTime } = require("luxon");
const Agendamento = require("../models/agendamento");
const Push_tokens = require("../models/push_tokens");
const expo = require("../server/expo/expo");

const TIMEZONE = "America/Sao_Paulo";
const INTERVALO_MINUTOS = 5; // roda a cada 5 min
const STATUS_VALIDOS = ["P", "A"]; // ajuste conforme sua regra

async function enviarLembretes3hAntes() {
  try {
    const agora = DateTime.now().setZone(TIMEZONE);

    // Janela de busca: agendamentos que ocorrerão daqui a 3h dentro do intervalo da rotina
    const inicioJanela = agora.plus({ hours: 3 });
    const fimJanela = inicioJanela.plus({ minutes: INTERVALO_MINUTOS });

    // Somente agendamentos do dia atual (SP)
    const inicioDia = agora.startOf("day");
    const fimDia = agora.endOf("day");

    // Interseção da janela com o dia atual
    const inicioBusca = inicioJanela < inicioDia ? inicioDia : inicioJanela;
    const fimBusca = fimJanela > fimDia ? fimDia : fimJanela;

    if (inicioBusca >= fimBusca) return;

    const agendamentos = await Agendamento.find({
      status: { $in: STATUS_VALIDOS },
      lembrete3hEnviado: { $ne: true },
      data: {
        $gte: inicioBusca.toJSDate(),
        $lt: fimBusca.toJSDate(),
      },
    }).select("_id clienteId data");

    for (const agendamento of agendamentos) {
      const tokensDocs = await Push_tokens.find({
        model: "Cliente",
        referenciaId: agendamento.clienteId,
      }).select("token");

      const tokensValidos = tokensDocs
        .map((t) => t.token)
        .filter((t) => expo.isExpoPushToken(t));

      if (!tokensValidos.length) {
        console.log(
          `[PUSH 3H] Sem token válido para cliente ${agendamento.clienteId}`
        );
        continue;
      }

      const dataSP = DateTime.fromJSDate(agendamento.data).setZone(TIMEZONE);
      const horaFormatada = dataSP.toFormat("HH:mm");

      const messages = tokensValidos.map((token) => ({
        to: token,
        sound: "default",
        title: "Lembrete de agendamento",
        body: `Seu agendamento é hoje às ${horaFormatada}.`,
        data: {
          tipo: "lembrete_agendamento_3h",
          agendamentoId: String(agendamento._id),
        },
      }));

      const chunks = expo.chunkPushNotifications(messages);

      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }

      // Marca como enviado para não duplicar
      await Agendamento.updateOne(
        { _id: agendamento._id },
        {
          $set: {
            lembrete3hEnviado: true,
            lembrete3hEnviadoEm: new Date(),
          },
        }
      );

      console.log(`[PUSH 3H] Enviado para agendamento ${agendamento._id}`);
    }
  } catch (error) {
    console.error("[PUSH 3H] Erro ao enviar lembretes:", error);
  }
}

function iniciarLembreteAgendamento3hScheduler() {
  enviarLembretes3hAntes(); // executa ao iniciar
  setInterval(enviarLembretes3hAntes, INTERVALO_MINUTOS * 60 * 1000);
}

module.exports = iniciarLembreteAgendamento3hScheduler;