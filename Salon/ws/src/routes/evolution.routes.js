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

router.post("/whatsapp/connect", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId obrigatório" });

    const instanceName = `wa_${userId}`;

    // 1) tenta criar instância (se já existir, segue)
    try {
      await evo.post("/instance/create", {
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      });
    } catch (e) {
      // ignora erro de "já existe"
      const msg = e?.response?.data?.message || "";
      if (!String(msg).toLowerCase().includes("already")) {
        console.warn("[WA] create warning:", e?.response?.data || e.message);
      }
    }

    // 2) busca QR Code
    // (em algumas versões é /instance/connect/{name}, em outras /instance/qrcode/{name})
    let qrData = null;

    try {
      const qrResp = await evo.get(`/instance/connect/${instanceName}`);
      qrData = qrResp.data;
    } catch {
      const qrResp = await evo.get(`/instance/qrcode/${instanceName}`);
      qrData = qrResp.data;
    }

    // normalize (depende da versão do Evolution)
    const qrBase64 =
      qrData?.base64 ||
      qrData?.qrcode?.base64 ||
      qrData?.qr?.base64 ||
      null;

    const qrCodeText =
      qrData?.code ||
      qrData?.qrcode?.code ||
      qrData?.qr ||
      null;

    return res.json({
      instanceName,
      qrBase64,
      qrCodeText, // fallback para gerar QR no front
    });
  } catch (err) {
    console.error("[WA CONNECT] erro:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Erro ao conectar WhatsApp" });
  }
});

module.exports = router;