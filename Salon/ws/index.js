// Responsavel pela configuração do ws
require("dotenv").config();

const path = require("path");
const express = require("express");
const app = express();
const morgan = require("morgan");
const busboy = require("connect-busboy");
const busboyBodyParser = require("busboy-body-parser");
const cors = require("cors");
const crypto = require("crypto");
const { google } = require("googleapis");

require("./database");

// ----------------------
// Helpers Base64URL (compatível com várias versões do Node)
// ----------------------
function toBase64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  return Buffer.from(padded, "base64").toString("utf8");
}

// ----------------------
// OAuth Google config
// ----------------------
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Banco temporário em memória (trocar por DB real)
const tokenStore = new Map(); // userId -> tokens

function signState(payloadObj) {
  const payload = toBase64Url(JSON.stringify(payloadObj));
  const sig = crypto
    .createHmac("sha256", process.env.STATE_SECRET || "fallback-secret")
    .update(payload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${payload}.${sig}`;
}

function verifyState(state) {
  const [payload, sig] = String(state || "").split(".");
  if (!payload || !sig) return null;

  const expected = crypto
    .createHmac("sha256", process.env.STATE_SECRET || "fallback-secret")
    .update(payload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  if (sig !== expected) return null;

  const data = JSON.parse(fromBase64Url(payload));

  // expira em 10 min
  if (!data.ts || Date.now() - data.ts > 10 * 60 * 1000) return null;

  return data;
}

// Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(busboy());
app.use(busboyBodyParser());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);

// Servir HTML do /web
app.use(express.static(path.resolve(__dirname, "../web")));

// Define a porta
app.set("port", process.env.PORT || 8000);

// Rotas atuais
app.use("/salao", require("./src/routes/salao.routes"));
app.use("/servico", require("./src/routes/servico.routes"));
app.use("/horario", require("./src/routes/horario.routes"));
app.use("/colaborador", require("./src/routes/colaborador.routes"));
app.use("/cliente", require("./src/routes/cliente.routes"));
app.use("/agendamento", require("./src/routes/agendamento.routes"));
app.use(
  "/create-checkout",
  require("./src/routes/api/mercado-pago/create-checkout/createCheckout.routes")
);
app.use(
  "/mercado-pago/pending",
  require("./src/routes/api/mercado-pago/pending/pending.routes")
);
app.use(
  "/mercado-pago/webhook",
  require("./src/routes/api/mercado-pago/webhook/webhook-mpg.routes")
);

// ----------------------
// NOVAS ROTAS OAUTH GOOGLE
// ----------------------

// 1) Início do OAuth
// Exemplo: /oauth/google/start?userId=123&returnTo=/integracoes
app.get("/oauth/google/start", (req, res) => {
  const { userId, returnTo = "/integracoes" } = req.query;

  if (!userId) {
    return res.status(400).send("Faltou userId");
  }

  const state = signState({
    userId: String(userId),
    returnTo: String(returnTo),
    ts: Date.now(),
    nonce: crypto.randomUUID(),
  });

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/drive.file",
    ],
    state,
  });

  return res.redirect(authUrl);
});

// 2) Callback OAuth
app.get("/oauth/google/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/integracoes?google=error&reason=${encodeURIComponent(
          error
        )}`
      );
    }

    const stateData = verifyState(state);
    if (!stateData) {
      return res.status(400).send("State inválido ou expirado.");
    }

    const { userId, returnTo } = stateData;

    const { tokens } = await oauth2Client.getToken(String(code));

    // Salva tokens do usuário (trocar por banco real)
    const prev = tokenStore.get(userId) || {};
    tokenStore.set(userId, {
      ...prev,
      ...tokens,
      updatedAt: new Date().toISOString(),
    });

    const safeReturn = String(returnTo).startsWith("/") ? returnTo : "/integracoes";
    return res.redirect(`${process.env.FRONTEND_URL}${safeReturn}?google=success`);
  } catch (err) {
    console.error("OAuth callback error:", err?.response?.data || err.message);
    return res.redirect(`${process.env.FRONTEND_URL}/integracoes?google=error`);
  }
});

// 3) Endpoint de teste: listar próximos eventos
app.get("/google/events", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Faltou userId" });

    const tokens = tokenStore.get(String(userId));
    if (!tokens) return res.status(404).json({ error: "Usuário não conectado ao Google" });

    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: "primary",
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
      timeMin: new Date().toISOString(),
    });

    return res.json(response.data.items || []);
  } catch (err) {
    console.error("List events error:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Erro ao buscar eventos" });
  }
});

// index.js (após app.listen)
const iniciarAgendamentoScheduler = require("./src/lib/agendamento-update-lib");

// Abre um ouvinte
app.listen(app.get("port"), "0.0.0.0", () => {
  console.log("Antes de iniciar o servidor...");
  console.log(`WS Escutando na porta ${app.get("port")}`);
  iniciarAgendamentoScheduler();
});