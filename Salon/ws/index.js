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
const Colaborador = require("./src/models/colaboradorModel"); // ajuste o caminho se necessário

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
app.get("/oauth/google/start", (req, res) => {
  const { userId, returnTo = "/account", clientName = "cliente" } = req.query;

  console.log("[OAUTH START] query:", { userId, returnTo, clientName });

  if (!userId) {
    console.log("[OAUTH START] ERRO: faltou userId");
    return res.status(400).send("Faltou userId");
  }

  const statePayload = {
    userId: String(userId),
    returnTo: String(returnTo),
    clientName: String(clientName),
    ts: Date.now(),
    nonce: crypto.randomUUID(),
  };

  const state = signState(statePayload);

  console.log("[OAUTH START] statePayload:", statePayload);

  const scopes = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/drive.metadata.readonly"
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: scopes,
    state,
  });

  console.log("[OAUTH START] scopes:", scopes);
  console.log("[OAUTH START] redirect_uri:", process.env.GOOGLE_REDIRECT_URI);
  console.log("[OAUTH START] authUrl gerada com sucesso");

  return res.redirect(authUrl);
});

// 2) Callback OAuth
app.get("/oauth/google/callback", async (req, res) => {
  try {
    const { code, state, error, scope } = req.query;

    console.log("[OAUTH CALLBACK] query recebida:", {
      hasCode: !!code,
      hasState: !!state,
      error: error || null,
      scope: scope || null,
    });

    if (error) {
      console.log("[OAUTH CALLBACK] erro vindo do Google:", error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/account?google=error&reason=${encodeURIComponent(error)}`
      );
    }

    const stateData = verifyState(state);
    console.log("[OAUTH CALLBACK] stateData:", stateData);

    if (!stateData) {
      console.log("[OAUTH CALLBACK] ERRO: state inválido/expirado");
      return res.status(400).send("State inválido ou expirado.");
    }

    const { userId, returnTo = "/account", clientName = "cliente" } = stateData;
    console.log("[OAUTH CALLBACK] userId/returnTo/clientName:", {
      userId,
      returnTo,
      clientName,
    });

    // 1) troca code por tokens
    console.log("[OAUTH CALLBACK] trocando code por tokens...");
    const tokenResponse = await oauth2Client.getToken(String(code));
    const tokens = tokenResponse?.tokens || {};

    console.log("[OAUTH CALLBACK] tokens recebidos:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      tokenType: tokens.token_type || null,
      expiryDate: tokens.expiry_date || null,
      scope: tokens.scope || null,
      hasIdToken: !!tokens.id_token,
    });

    if (!tokens?.access_token) {
      throw new Error("Google não retornou access_token no callback.");
    }

    oauth2Client.setCredentials(tokens);
    console.log("[OAUTH CALLBACK] oauth2Client credentials setadas");

    // 2) buscar email da conta autorizada
    console.log("[OAUTH CALLBACK] buscando userinfo...");
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const me = await oauth2.userinfo.get();

    console.log("[OAUTH CALLBACK] userinfo bruto:", me?.data);

    const googleEmail = me?.data?.email;
    if (!googleEmail) {
      throw new Error("Não foi possível obter o e-mail da conta Google.");
    }

    console.log("[OAUTH CALLBACK] googleEmail:", googleEmail);

    // 3) pegar idCalendar (principal)
    const calendarApi = google.calendar({ version: "v3", auth: oauth2Client });
    const calList = await calendarApi.calendarList.list();
    const primaryCalendar = (calList.data.items || []).find((c) => c.primary) || null;
    const idCalendar = primaryCalendar?.id || "primary";

    // 4) pegar idDrive (root folder id)
    const driveApi = google.drive({ version: "v3", auth: oauth2Client });
    const about = await driveApi.about.get({
      fields: "user(emailAddress,displayName),rootFolderId",
    });
    const idDrive = about?.data?.rootFolderId || null;

    console.log("[OAUTH CALLBACK] idCalendar:", idCalendar);
    console.log("[OAUTH CALLBACK] idDrive(root):", idDrive);

    // 5) salva no tokenStore (temporário)
    const prev = tokenStore.get(userId) || {};
    tokenStore.set(userId, {
      ...prev,
      ...tokens,
      googleEmail,
      idCalendar,
      idDrive,
      updatedAt: new Date().toISOString(),
    });

    console.log("[OAUTH CALLBACK] tokenStore atualizado para userId:", userId);

    // 6) persistir no Mongo (Colaborador)
    const updated = await Colaborador.findOneAndUpdate(
      { email: googleEmail }, // ideal: no futuro usar clerkUserId
      {
        $set: {
          idCalendar,
          idDrive,
        },
      },
      { new: true }
    );

    if (!updated) {
      console.warn("[OAUTH CALLBACK] Colaborador não encontrado por email:", googleEmail);
    } else {
      console.log("[OAUTH CALLBACK] Colaborador atualizado:", updated._id?.toString());
    }

    const safeReturn = String(returnTo).startsWith("/") ? returnTo : "/account";
    const redirectUrl =
      `${process.env.FRONTEND_URL}${safeReturn}` +
      `?google=success` +
      `&email=${encodeURIComponent(googleEmail)}` +
      `&idCalendar=${encodeURIComponent(idCalendar)}` +
      `&idDrive=${encodeURIComponent(idDrive || "")}`;

    console.log("[OAUTH CALLBACK] redirect sucesso:", redirectUrl);
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("[OAUTH CALLBACK] ERRO message:", err?.message);
    console.error("[OAUTH CALLBACK] ERRO response.data:", err?.response?.data);
    console.error("[OAUTH CALLBACK] ERRO stack:", err?.stack);

    return res.redirect(`${process.env.FRONTEND_URL}/account?google=error`);
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