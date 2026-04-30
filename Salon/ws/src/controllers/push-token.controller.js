const expo = require("../server/expo/expo");
const mongoose = require("mongoose");
const Push_tokens = require("../models/push_tokens");

// cadastrar/atualizar token
async function registerPushToken(req, res) {
  const db = mongoose.connection;
  const session = await db.startSession();
  session.startTransaction();

  try {
    const { token, model, referenciaId } = req.body;

    if (!token || !model || !referenciaId) {
      await session.abortTransaction();
      return res.status(400).json({
        error: true,
        message: "token, model e referenciaId são obrigatórios.",
      });
    }

    let pushToken = await Push_tokens.findOne({ token }).session(session);

    if (pushToken) {
      let updated = false;

      if (pushToken.model !== model) {
        pushToken.model = model;
        updated = true;
      }

      if (String(pushToken.referenciaId) !== String(referenciaId)) {
        pushToken.referenciaId = referenciaId;
        updated = true;
      }

      if (updated) {
        pushToken.dataAtualizacao = new Date();
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

    pushToken = new Push_tokens({
      token,
      model,
      referenciaId,
      dataAtualizacao: new Date(),
    });

    await pushToken.save({ session });
    await session.commitTransaction();

    return res.json({ error: false, message: "Token cadastrado com sucesso" });
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({ error: true, message: err.message });
  } finally {
    session.endSession();
  }
}

// deletar token
async function deletePushToken(req, res) {
  const { token } = req.params;
  try {
    const result = await Push_tokens.deleteOne({ token });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: true, message: "Token não encontrado" });
    }
    return res.json({ error: false, message: "Token deletado com sucesso" });
  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
}

// enviar notificação
async function sendPushNotification(req, res) {
  try {
    const { title, body, data } = req.body;

    const allTokens = await Push_tokens.find({});
    const validTokens = allTokens.map((t) => t.token).filter(expo.isExpoPushToken);

    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data,
    }));

    const chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    // Aqui você pode processar receipts, mas NÃO deletar por receiptId (não é token)
    const receiptIds = tickets
      .filter((ticket) => ticket.status === "ok")
      .map((ticket) => ticket.id);

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

    for (const chunk of receiptIdChunks) {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const receiptId in receipts) {
        const { status, details } = receipts[receiptId];
        if (status === "error") {
          console.error(`Erro no envio: ${details?.error}`);
        }
      }
    }

    return res.json({ error: false, message: "Notificações enviadas." });
  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
}

async function sendPushToCliente(req, res) {
  try {
    const { clienteId, title, body, data = {} } = req.body;

    if (!clienteId || !title || !body) {
      return res.status(400).json({
        error: true,
        message: "clienteId, title e body são obrigatórios.",
      });
    }

    // busca tokens vinculados ao cliente
    const docs = await Push_tokens.find({
      model: "Cliente",
      referenciaId: clienteId,
    });

    const tokens = docs
      .map((d) => d.token)
      .filter((t) => expo.isExpoPushToken(t));

    if (!tokens.length) {
      return res.json({
        error: false,
        message: "Cliente sem tokens válidos.",
      });
    }

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data,
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    return res.json({
      error: false,
      message: "Notificação enviada.",
      totalTokens: tokens.length,
      tickets,
    });
  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
}

module.exports = { registerPushToken, deletePushToken, sendPushNotification, sendPushToCliente };