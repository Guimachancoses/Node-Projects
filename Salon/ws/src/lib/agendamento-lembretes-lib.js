const { DateTime } = require("luxon");
const Agendamento = require("../models/agendamento");
const Push_tokens = require("../models/push_tokens");
const { Expo, expo } = require("../server/expo/expo");

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
    .filter((t) => Expo.isExpoPushToken(t));

  if (!tokensValidos.length) return false;

  const messages = tokensValidos.map((token) => ({
    to: token,
    sound: "default",
    title: titulo,
    body: corpo,
    data: {
      tipo,
      agendamentoId: String(agendamento._id),
      route: "/(home)/home",
      action: "confirmar_agendamento",
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

    const baseFiltro = {
      status: { $in: STATUS_VALIDOS },
      data: { $gt: agora.toJSDate() },
    };

    // 1) 24h: somente se faltar MAIS de 3h e até 24h
    const ag24h = await Agendamento.find({
      ...baseFiltro,
      lembrete24hEnviado: { $ne: true },
      data: {
        $gt: limite3h.toJSDate(),   // evita sobrepor com 3h
        $lte: limite24h.toJSDate(),
      },
    }).select("_id clienteId data");

    for (const agendamento of ag24h) {
      const dataSP = DateTime.fromJSDate(agendamento.data).setZone(TIMEZONE);
      const ehAmanha = dataSP.hasSame(agora.plus({ days: 1 }), "day");
      const corpo24h = ehAmanha
        ? `Você tem um agendamento amanhã às ${dataSP.toFormat("HH:mm")}.`
        : `Seu agendamento será às ${dataSP.toFormat("HH:mm")}.`;

      const enviado = await enviarPushParaAgendamento(
        agendamento,
        "lembrete_agendamento_24h",
        "Lembrete de agendamento",
        corpo24h
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

    // 2) 3h: de agora até 3h
    const ag3h = await Agendamento.find({
      ...baseFiltro,
      lembrete3hEnviado: { $ne: true },
      data: {
        $gt: agora.toJSDate(),
        $lte: limite3h.toJSDate(),
      },
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

    // console.log(
    //   `[LEMBRETES] rodada ok | ${agora.toISO()} | 24h: ${ag24h.length} | 3h: ${ag3h.length}`
    // );
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