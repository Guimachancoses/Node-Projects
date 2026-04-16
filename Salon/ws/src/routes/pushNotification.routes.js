const expo = require('../server/expo/expo');
const mongoose = require("mongoose");
const Push_tokens = require("../models/push_tokens");

// rota para cadastrar/atualizar o token do cliente/colaborador:
async function registerPushToken(req, res) {
  const db = mongoose.connection;
  const session = await db.startSession();
  session.startTransaction();
  try {
    const { token, model, referenciaId } = req.body;

    let pushToken = await Push_tokens.findOne({ token });

    if (pushToken) {
      // Atualiza se houver mudança
      let updated = false;

      if (pushToken.model !== model) {
        pushToken.model = model;
        updated = true;
      }

      if (pushToken.referenciaId !== referenciaId) {
        pushToken.referenciaId = referenciaId;
        updated = true;
      }

      if (updated) {
        await pushToken.save({ session });
      }

      await session.commitTransaction();
      return res.json({
        error: false,
        message: updated
          ? "Token atualizado com sucesso"
          : "Token já está atualizado",
      });
    }

    // Se não existe, cria um novo
    pushToken = new Push_tokens({
      token,
      model,
      referenciaId,
    });

    await pushToken.save({ session });

    await session.commitTransaction();

    res.json({ error: false, message: "Token cadastrado com sucesso" });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: true, message: err.message });
  } finally {
    session.endSession();
  }
}

// Rota para deletar o token do cliente/colaborador:
async function deletePushToken(req, res) {
  const { token } = req.params;
  try {
    const result = await Push_tokens.deleteOne({ token });
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: true, message: "Token não encontrado" });
    }
    res.json({ error: false, message: "Token deletado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
}


// Enviar notificação
async function sendPushNotification(req, res) {
  const { title, body, data } = req.body;

  const allTokens = await PushToken.find({});
  const validTokens = allTokens
    .map((t) => t.token)
    .filter(expo.isExpoPushToken);

  let messages = validTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }

  // Processar receipts
  let receiptIds = tickets
    .filter((ticket) => ticket.status === "ok")
    .map((ticket) => ticket.id);

  let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

  for (let chunk of receiptIdChunks) {
    try {
      let receipts = await expo.getPushNotificationReceiptsAsync(chunk);

      for (let receiptId in receipts) {
        let { status, details } = receipts[receiptId];
        if (status === "error") {
          console.error(`Erro no envio: ${details?.error}`);

          if (details?.error === "DeviceNotRegistered") {
            // Deletar token inválido
            await PushToken.deleteOne({ token: receiptId });
            console.log(`Token ${receiptId} removido por ser inválido.`);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  res.json({ error: false, message: "Notificações enviadas." });
}

module.exports = { registerPushToken, deletePushToken, sendPushNotification };
