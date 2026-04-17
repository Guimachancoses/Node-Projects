const express = require("express");
const axios = require("axios");
const router = express.Router();

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
  // Algumas versões usam GET, outras POST e caminhos diferentes
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

router.post("/whatsapp/connect", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId obrigatório" });

    const instanceName = `wa_${userId}`;

    // 1) cria instância (se já existir, segue)
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

    // 2) polling de QR por até ~10s
    const MAX_TRIES = 10;
    const DELAY_MS = 1000;

    let qrImage = null;
    let qrCodeText = null;
    let lastRaw = null;

    for (let i = 1; i <= MAX_TRIES; i++) {
      try {
        const qr = await fetchQr(instanceName);
        qrImage = qr.qrImage;
        qrCodeText = qr.qrCodeText;
        lastRaw = qr.raw;

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
        status: "pending",
        message: "Instância criada, mas QR ainda não disponível. Tente novamente em instantes.",
      });
    }

    return res.json({
      instanceName,
      status: "ok",
      qrImage,     // já pronto para <img src="...">
      qrCodeText,  // fallback
      debug: process.env.NODE_ENV !== "production" ? lastRaw : undefined,
    });
  } catch (err) {
    console.error("[WA CONNECT] erro:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Erro ao conectar WhatsApp" });
  }
});

module.exports = router;