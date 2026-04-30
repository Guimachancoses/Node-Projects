const { DateTime } = require("luxon");
const Agendamento = require("../models/agendamento");
const Push_tokens = require("../models/push_tokens");
const expo = require("../server/expo/expo");

const TIMEZONE = "America/Sao_Paulo";
const INTERVALO_MINUTOS = 5;
const STATUS_VALIDOS = ["P", "A"];

let running = false;

async function enviarPushParaAgendamento(agendamento, tipo, titulo, corpo) {
  const tokensDocs = await Push_tokens.find({
    model: "Cliente",
    referenciaId: agendamento.clienteId,
  }).select("token");

  const tokensValidos = tokensDocs
    .map((t) => t.token)
    .filter((t) => expo.isExpoPushToken(t));

  if (!tokensValidos.length) return false;

  const messages = tokensValidos.map((token) => ({
    to: token,
    sound: "default",
    title: titulo,
    body: corpo,
    data: {
      tipo,
      agendamentoId: String(agendamento._id),
    },
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }

  return true;
}

async function processarLembretes() {
  if (running) return;
  running = true;

  try {
    const agora = DateTime.now().setZone(TIMEZONE);
    const limite24h = agora.plus({ hours: 24 });
    const limite3h = agora.plus({ hours: 3 });

    // Base: só futuros e status válidos
    const baseFiltro = {
      status: { $in: STATUS_VALIDOS },
      data: { $gt: agora.toJSDate() },
    };

    // 1) Lembrete 24h (envia quando entrar na janela <=24h)
    const ag24h = await Agendamento.find({
      ...baseFiltro,
      lembrete24hEnviado: { $ne: true },
      data: { $gt: agora.toJSDate(), $lte: limite24h.toJSDate() },
    }).select("_id clienteId data");

    for (const agendamento of ag24h) {
      const dataSP = DateTime.fromJSDate(agendamento.data).setZone(TIMEZONE);
      const enviado = await enviarPushParaAgendamento(
        agendamento,
        "lembrete_agendamento_24h",
        "Lembrete de agendamento",
        `Você tem um agendamento amanhã às ${dataSP.toFormat("HH:mm")}.`
      );

      if (enviado) {
        await Agendamento.updateOne(
          { _id: agendamento._id },
          {
            $set: {
              lembrete24hEnviado: true,
              lembrete24hEnviadoEm: new Date(),
            },
          }
        );
      }
    }

    // 2) Lembrete 3h (envia quando entrar na janela <=3h)
    const ag3h = await Agendamento.find({
      ...baseFiltro,
      lembrete3hEnviado: { $ne: true },
      data: { $gt: agora.toJSDate(), $lte: limite3h.toJSDate() },
    }).select("_id clienteId data");

    for (const agendamento of ag3h) {
      const dataSP = DateTime.fromJSDate(agendamento.data).setZone(TIMEZONE);
      const enviado = await enviarPushParaAgendamento(
        agendamento,
        "lembrete_agendamento_3h",
        "Lembrete de agendamento",
        `Seu agendamento é hoje às ${dataSP.toFormat("HH:mm")}.`
      );

      if (enviado) {
        await Agendamento.updateOne(
          { _id: agendamento._id },
          {
            $set: {
              lembrete3hEnviado: true,
              lembrete3hEnviadoEm: new Date(),
            },
          }
        );
      }
    }

    console.log(
      `[LEMBRETES] rodada ok | ${agora.toISO()} | 24h: ${ag24h.length} | 3h: ${ag3h.length}`
    );
  } catch (error) {
    console.error("[LEMBRETES] erro:", error);
  } finally {
    running = false;
  }
}

function iniciarLembretesScheduler() {
  processarLembretes(); // roda ao iniciar
  setInterval(processarLembretes, INTERVALO_MINUTOS * 60 * 1000); // a cada 5 min
}

module.exports = iniciarLembretesScheduler;