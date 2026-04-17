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
const Colaborador = require("./src/models/colaborador");

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

async function ensureRagFolder(driveApi, parentId) {
  // 1) tenta encontrar
  const query = [
    "mimeType = 'application/vnd.google-apps.folder'",
    "name = 'RAG'",
    "trashed = false",
    `'${parentId}' in parents`,
  ].join(" and ");

  const existing = await driveApi.files.list({
    q: query,
    fields: "files(id,name)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    pageSize: 1,
  });

  if (existing.data.files?.length) {
    return existing.data.files[0].id;
  }

  // 2) cria se não existir
  const created = await driveApi.files.create({
    requestBody: {
      name: "RAG",
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id,name",
    supportsAllDrives: true,
  });

  return created.data.id;
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
// Exemplo: /oauth/google/start?userId=123&returnTo=/account
app.get("/oauth/google/start", (req, res) => {
  const { userId, returnTo = "/account" } = req.query;

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
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
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
        `${process.env.FRONTEND_URL}/account?google=error&reason=${encodeURIComponent(error)}`
      );
    }

    const stateData = verifyState(state);
    if (!stateData) {
      return res.status(400).send("State inválido ou expirado.");
    }

    const { userId, returnTo } = stateData;

    // 1) Troca code por tokens
    const { tokens } = await oauth2Client.getToken(String(code));
    if (!tokens?.access_token) {
      throw new Error("Google não retornou access_token no callback.");
    }

    oauth2Client.setCredentials(tokens);

    // 2) Pega e-mail da conta autorizada
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const me = await oauth2.userinfo.get();
    const googleEmail = me?.data?.email || null;

    if (!googleEmail) {
      throw new Error("Não foi possível obter o e-mail da conta Google.");
    }

    // 3) Pega ID do calendário principal com fallback
    let idCalendar = "primary";
    try {
      const calendarApi = google.calendar({ version: "v3", auth: oauth2Client });
      const calList = await calendarApi.calendarList.list();
      const primaryCalendar = (calList.data.items || []).find((c) => c.primary) || null;
      idCalendar = primaryCalendar?.id || "primary";
    } catch (e) {
      console.warn("[OAUTH CALLBACK] Não conseguiu listar calendarList, usando primary.");
    }

    // 4) Pega ID do Drive (root) com fallback
    let idDrive = "root"; // fallback seguro (alias válido no Google Drive)
    try {
      const driveApi = google.drive({ version: "v3", auth: oauth2Client });

      // método mais estável no v3
      const root = await driveApi.files.get({
        fileId: "root",
        fields: "id,name",
        supportsAllDrives: true,
      });

      idDrive = root?.data?.id || "root";
    } catch (e) {
      console.warn(
        "[OAUTH CALLBACK] Não conseguiu obter ID real do Drive. Usando 'root'. Detalhe:",
        e?.response?.data || e.message
      );
    }

    console.log("[OAUTH CALLBACK] googleEmail:", googleEmail);
    console.log("[OAUTH CALLBACK] idCalendar:", idCalendar);
    console.log("[OAUTH CALLBACK] idDrive(root):", idDrive);

    let idRagFolder = null;
    try {
      const driveApi = google.drive({ version: "v3", auth: oauth2Client });

      // se você já tem idDrive real da raiz
      idRagFolder = await ensureRagFolder(driveApi, idDrive);

      console.log("[OAUTH CALLBACK] idRagFolder:", idRagFolder);
    } catch (e) {
      console.warn("[OAUTH CALLBACK] Falha ao garantir pasta RAG:", e?.response?.data || e.message);
    }

    // 5) Mantém store temporário
    const prev = tokenStore.get(userId) || {};
    tokenStore.set(userId, {
      ...prev,
      ...tokens,
      googleEmail,
      idCalendar,
      idDrive,
      updatedAt: new Date().toISOString(),
    });

    // 6) Salva no Mongo (Colaborador)
    const updated = await Colaborador.findOneAndUpdate(
      { email: googleEmail }, // ideal futuro: usar clerkUserId
      {
        $set: {
          idCalendar,
          idDrive,       // root
          idRagFolder,   // pasta RAG
        }
      },
      { new: true }
    );

    if (!updated) {
      console.warn("[OAUTH CALLBACK] Colaborador não encontrado por email:", googleEmail);
    } else {
      console.log("[OAUTH CALLBACK] Colaborador atualizado:", updated._id?.toString());
    }

    const safeReturn = String(returnTo).startsWith("/") ? returnTo : "/account";
    return res.redirect(
      `${process.env.FRONTEND_URL}${safeReturn}` +
      `?google=success` +
      `&email=${encodeURIComponent(googleEmail)}` +
      `&idCalendar=${encodeURIComponent(idCalendar)}` +
      `&idDrive=${encodeURIComponent(idDrive || "")}`
    );
  } catch (err) {
    console.error("OAuth callback error:", err?.response?.data || err.message);
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