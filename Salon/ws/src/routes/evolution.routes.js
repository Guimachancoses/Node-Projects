const express = require("express");
const axios = require("axios");
const router = express.Router();
const Colaborador = require("../models/colaborador");

const evo = axios.create({
  baseURL: process.env.EVOLUTION_URL,
  headers: {
    apikey: process.env.EVOLUTION_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeQrPayload(payload) {
  const qrBase64Raw =
    payload?.base64 ||
    payload?.qrcode?.base64 ||
    payload?.qr?.base64 ||
    (typeof payload?.qrcode === "string" ? payload.qrcode : null) ||
    null;

  const qrCodeText =
    payload?.code ||
    payload?.qrcode?.code ||
    (typeof payload?.qr === "string" ? payload.qr : null) ||
    null;

  const qrImage =
    qrBase64Raw && String(qrBase64Raw).startsWith("data:image")
      ? String(qrBase64Raw)
      : qrBase64Raw
        ? `data:image/png;base64,${qrBase64Raw}`
        : null;

  return { qrImage, qrCodeText };
}

async function fetchQr(instanceName) {
  const attempts = [
    () => evo.get(`/instance/connect/${instanceName}`),
    () => evo.get(`/instance/qrcode/${instanceName}`),
    () => evo.post(`/instance/connect/${instanceName}`),
    () => evo.post(`/instance/qrcode/${instanceName}`),
  ];

  let lastError = null;

  for (const call of attempts) {
    try {
      const resp = await call();
      const data = resp?.data || {};
      const normalized = normalizeQrPayload(data);
      return { raw: data, ...normalized };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

async function fetchConnectionState(instanceName) {
  const attempts = [
    () => evo.get(`/instance/connectionState/${instanceName}`),
    () => evo.get(`/instance/status/${instanceName}`),
    () => evo.get(`/instance/connection-state/${instanceName}`),
  ];

  for (const call of attempts) {
    try {
      const resp = await call();
      const data = resp?.data || {};

      const rawState =
        data?.instance?.state ||
        data?.state ||
        data?.status ||
        data?.instance?.status ||
        "";

      const state = String(rawState).toLowerCase();

      let normalizedStatus = "unknown";
      if (["open", "connected", "online"].includes(state)) normalizedStatus = "connected";
      else if (["connecting", "qrcode", "qr", "pairing"].includes(state)) normalizedStatus = "connecting";
      else if (["close", "closed", "disconnected", "offline"].includes(state)) normalizedStatus = "disconnected";

      return { status: normalizedStatus, raw: data };
    } catch (_) {
      // tenta próximo endpoint
    }
  }

  return { status: "unknown", raw: null };
}

async function saveInstanceEvo({ email, instanceName }) {
  if (!email) return null;

  try {
    const updated = await Colaborador.findOneAndUpdate(
      { email },
      { $set: { instanceEvo: instanceName } },
      { new: true }
    );

    if (!updated) {
      console.warn("[WA] Colaborador não encontrado para salvar instanceEvo:", email);
    }

    return updated;
  } catch (e) {
    console.warn("[WA] Falha ao salvar instanceEvo:", e.message);
    return null;
  }
}

router.post("/whatsapp/connect", async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId) return res.status(400).json({ error: "userId obrigatório" });

    const instanceName = `wa_${userId}`;

    // cria instância (se já existir, segue)
    try {
      await evo.post("/instance/create", {
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      });
    } catch (e) {
      const msg = e?.response?.data?.message || "";
      if (!String(msg).toLowerCase().includes("already")) {
        console.warn("[WA] create warning:", e?.response?.data || e.message);
      }
    }

    // salva nome da instância no Mongo
    await saveInstanceEvo({ email, instanceName });

    // polling QR ~10s
    const MAX_TRIES = 10;
    const DELAY_MS = 1000;

    let qrImage = null;
    let qrCodeText = null;

    for (let i = 1; i <= MAX_TRIES; i++) {
      try {
        const qr = await fetchQr(instanceName);
        qrImage = qr.qrImage;
        qrCodeText = qr.qrCodeText;

        if (qrImage || qrCodeText) {
          console.log(`[WA] QR obtido na tentativa ${i}/${MAX_TRIES}`);
          break;
        }
      } catch (e) {
        if (i === MAX_TRIES) {
          console.warn("[WA] falha ao obter QR:", e?.response?.data || e.message);
        }
      }
      await sleep(DELAY_MS);
    }

    if (!qrImage && !qrCodeText) {
      return res.status(202).json({
        instanceName,
        status: "connecting",
        message: "Instância criada, mas QR ainda não disponível. Aguarde alguns segundos.",
      });
    }

    return res.json({
      instanceName,
      status: "connecting",
      qrImage,
      qrCodeText,
    });
  } catch (err) {
    console.error("[WA CONNECT] erro:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Erro ao conectar WhatsApp" });
  }
});

router.get("/whatsapp/status", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId obrigatório" });

    const instanceName = `wa_${userId}`;

    const state = await fetchConnectionState(instanceName);

    // Se ainda não conectou, tenta devolver QR
    let qrImage = null;
    let qrCodeText = null;

    if (state.status !== "connected") {
      try {
        const qr = await fetchQr(instanceName);
        qrImage = qr.qrImage;
        qrCodeText = qr.qrCodeText;
      } catch (_) { }
    }

    return res.json({
      instanceName,
      status: state.status, // connected | connecting | disconnected | unknown
      qrImage,
      qrCodeText,
      raw: process.env.NODE_ENV !== "production" ? state.raw : undefined,
    });
  } catch (err) {
    console.error("[WA STATUS] erro:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Erro ao consultar status do WhatsApp" });
  }
});

router.post("/whatsapp/disconnect", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId obrigatório" });

    const instanceName = `wa_${userId}`;

    // tenta endpoints de logout/disconnect (varia por versão da Evolution)
    const attempts = [
      () => evo.delete(`/instance/logout/${instanceName}`),
      () => evo.post(`/instance/logout/${instanceName}`),
      () => evo.delete(`/instance/disconnect/${instanceName}`),
      () => evo.post(`/instance/disconnect/${instanceName}`),
      () => evo.post(`/instance/close/${instanceName}`),
    ];

    let disconnected = false;
    let lastError = null;

    for (const call of attempts) {
      try {
        await call();
        disconnected = true;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    // Mesmo se endpoint não confirmar claramente, checa estado final
    const state = await fetchConnectionState(instanceName);

    // Regra final:
    // - sucesso se endpoint aceitou OU estado virou disconnected
    const finalOk = disconnected || state.status === "disconnected";

    if (!finalOk) {
      console.warn("[WA DISCONNECT] não foi possível confirmar desconexão:", lastError?.response?.data || lastError?.message);
      return res.status(400).json({
        error: "Não foi possível desconectar o WhatsApp no momento.",
        instanceName,
        status: state.status,
      });
    }

    // NÃO remove instanceEvo do banco (conforme pedido)
    return res.json({
      ok: true,
      instanceName,
      status: "disconnected",
      message: "WhatsApp desconectado com sucesso.",
    });
  } catch (err) {
    console.error("[WA DISCONNECT] erro:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Erro ao desconectar WhatsApp" });
  }
});

module.exports = router;