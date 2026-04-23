const express = require("express");
const crypto = require("crypto");
const { google } = require("googleapis");
const Colaborador = require("../models/colaborador");

const router = express.Router();

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

// ----------------------
// Helpers Base64URL
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
// Criptografia AES-256-GCM
// ----------------------
const ENC_ALGO = "aes-256-gcm";
const ENC_PREFIX = "enc:v1:";

function getEncKey() {
  const raw = process.env.GOOGLE_TOKEN_ENC_KEY;
  if (!raw) throw new Error("GOOGLE_TOKEN_ENC_KEY não definida no .env");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("GOOGLE_TOKEN_ENC_KEY inválida: use base64 de 32 bytes");
  }
  return key;
}

function encryptText(plainText) {
  if (!plainText) return null;
  const key = getEncKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENC_ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptText(encryptedText) {
  if (!encryptedText) return null;
  if (!String(encryptedText).startsWith(ENC_PREFIX)) return String(encryptedText);

  const payload = String(encryptedText).slice(ENC_PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Token criptografado inválido (formato)");

  const key = getEncKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv(ENC_ALGO, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

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
  if (!data.ts || Date.now() - data.ts > 10 * 60 * 1000) return null;
  return data;
}

function buildHttpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function ensureRagFolder(driveApi, parentId) {
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

  if (existing.data.files?.length) return existing.data.files[0].id;

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

async function getGoogleCalendarClientByColaboradorId(colaboradorId) {
  if (!colaboradorId) throw buildHttpError(400, "colaboradorId é obrigatório");

  const colab = await Colaborador.findById(colaboradorId).select(
    "idCalendar googleAccessToken googleRefreshToken googleExpiryDate"
  );

  if (!colab) throw buildHttpError(404, "Colaborador não encontrado");
  if (!colab.googleRefreshToken && !colab.googleAccessToken) {
    throw buildHttpError(400, "Colaborador sem token Google salvo");
  }

  const refreshTokenDecrypted = colab.googleRefreshToken
    ? decryptText(colab.googleRefreshToken)
    : undefined;

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({
    access_token: colab.googleAccessToken || undefined,
    refresh_token: refreshTokenDecrypted || undefined,
    expiry_date: colab.googleExpiryDate || undefined,
  });

  const calendar = google.calendar({ version: "v3", auth });
  return { calendar, auth, colab };
}

async function persistRotatedTokens(colab, auth) {
  const cred = auth.credentials || {};
  let changed = false;

  if (cred.access_token && cred.access_token !== colab.googleAccessToken) {
    colab.googleAccessToken = cred.access_token;
    changed = true;
  }
  if (cred.expiry_date && cred.expiry_date !== colab.googleExpiryDate) {
    colab.googleExpiryDate = cred.expiry_date;
    changed = true;
  }
  if (cred.refresh_token) {
    const encrypted = encryptText(cred.refresh_token);
    if (encrypted !== colab.googleRefreshToken) {
      colab.googleRefreshToken = encrypted;
      changed = true;
    }
  }

  if (changed) await colab.save();
}

// ----------------------
// Rotas OAuth / Google
// ----------------------

// Início do OAuth
router.get("/oauth/google/start", (req, res) => {
  const { userId, returnTo = "/account" } = req.query;
  if (!userId) return res.status(400).send("Faltou userId");

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

// Callback OAuth
router.get("/oauth/google/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/account?google=error&reason=${encodeURIComponent(error)}`
      );
    }

    const stateData = verifyState(state);
    if (!stateData) return res.status(400).send("State inválido ou expirado.");

    const { userId, returnTo } = stateData;

    const { tokens } = await oauth2Client.getToken(String(code));
    if (!tokens?.access_token) throw new Error("Google não retornou access_token no callback.");

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const me = await oauth2.userinfo.get();
    const googleEmail = me?.data?.email || null;
    if (!googleEmail) throw new Error("Não foi possível obter o e-mail da conta Google.");

    let idCalendar = "primary";
    try {
      const calendarApi = google.calendar({ version: "v3", auth: oauth2Client });
      const calList = await calendarApi.calendarList.list();
      const primaryCalendar = (calList.data.items || []).find((c) => c.primary) || null;
      idCalendar = primaryCalendar?.id || "primary";
    } catch (_) {}

    let idDrive = "root";
    try {
      const driveApi = google.drive({ version: "v3", auth: oauth2Client });
      const root = await driveApi.files.get({
        fileId: "root",
        fields: "id,name",
        supportsAllDrives: true,
      });
      idDrive = root?.data?.id || "root";
    } catch (_) {}

    let idRagFolder = null;
    try {
      const driveApi = google.drive({ version: "v3", auth: oauth2Client });
      idRagFolder = await ensureRagFolder(driveApi, idDrive);
    } catch (_) {}

    const prev = tokenStore.get(userId) || {};
    tokenStore.set(userId, {
      ...prev,
      ...tokens,
      googleEmail,
      idCalendar,
      idDrive,
      updatedAt: new Date().toISOString(),
    });

    const colaborador = await Colaborador.findOne({
      $or: [{ recipientId: String(userId) }, { email: googleEmail }],
    });

    if (colaborador) {
      colaborador.idCalendar = idCalendar;
      colaborador.idDrive = idDrive;
      colaborador.idRagFolder = idRagFolder;
      colaborador.googleEmail = googleEmail;
      if (tokens.access_token) colaborador.googleAccessToken = tokens.access_token;
      if (tokens.refresh_token) colaborador.googleRefreshToken = encryptText(tokens.refresh_token);
      if (tokens.scope) colaborador.googleScope = tokens.scope;
      if (tokens.token_type) colaborador.googleTokenType = tokens.token_type;
      if (tokens.expiry_date) colaborador.googleExpiryDate = tokens.expiry_date;
      await colaborador.save();
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

// status
router.get("/oauth/google/status", async (req, res) => {
  try {
    const { userId, email } = req.query;
    if (!userId && !email) return res.status(400).json({ error: "Informe userId ou email" });

    const filters = [];
    if (userId) filters.push({ recipientId: String(userId) });
    if (email) filters.push({ email: String(email) });

    const colaborador = await Colaborador.findOne({ $or: filters }).select(
      "idCalendar idDrive idRagFolder"
    );

    if (!colaborador) {
      return res.json({ connected: false, idCalendar: null, idDrive: null, idRagFolder: null });
    }

    return res.json({
      connected: Boolean(colaborador.idCalendar && colaborador.idDrive),
      idCalendar: colaborador.idCalendar || null,
      idDrive: colaborador.idDrive || null,
      idRagFolder: colaborador.idRagFolder || null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao consultar status Google" });
  }
});

// disconnect
router.post("/oauth/google/disconnect", async (req, res) => {
  try {
    const { userId, email } = req.body || {};
    if (!userId && !email) return res.status(400).json({ error: "Informe userId ou email" });

    const filters = [];
    if (userId) filters.push({ recipientId: String(userId) });
    if (email) filters.push({ email: String(email) });

    const colaborador = await Colaborador.findOne({ $or: filters });
    if (!colaborador) return res.status(404).json({ error: "Colaborador não encontrado" });

    if (colaborador.googleAccessToken) {
      try {
        await oauth2Client.revokeToken(colaborador.googleAccessToken);
      } catch (_) {}
    }

    colaborador.idCalendar = null;
    colaborador.idDrive = null;
    colaborador.idRagFolder = null;
    colaborador.googleEmail = null;
    colaborador.googleAccessToken = null;
    colaborador.googleRefreshToken = null;
    colaborador.googleScope = null;
    colaborador.googleTokenType = null;
    colaborador.googleExpiryDate = null;
    await colaborador.save();

    if (userId) tokenStore.delete(String(userId));

    return res.json({ ok: true, connected: false });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao desconectar Google" });
  }
});

// buscar eventos por colaborador
router.get("/google/events/by-colaborador", async (req, res) => {
  try {
    const { colaboradorId, initial, final } = req.query;
    if (!colaboradorId || !initial || !final) {
      return res.status(400).json({ error: "Informe colaboradorId, initial e final" });
    }

    const { calendar, auth, colab } = await getGoogleCalendarClientByColaboradorId(colaboradorId);

    const resp = await calendar.events.list({
      calendarId: colab.idCalendar || "primary",
      timeMin: new Date(String(initial)).toISOString(),
      timeMax: new Date(String(final)).toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    await persistRotatedTokens(colab, auth);
    return res.json({ ok: true, items: resp.data.items || [] });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao consultar agenda" });
  }
});

// criar evento
router.post("/google/events/create-by-colaborador", async (req, res) => {
  try {
    const {
      colaboradorId,
      initial,
      final,
      sessionid,
      nome_cliente,
      servico_escolhido,
      profissional_escolhido,
      timezone = "America/Sao_Paulo",
    } = req.body || {};

    if (!colaboradorId || !initial || !final || !sessionid) {
      return res.status(400).json({ error: "Informe colaboradorId, initial, final e sessionid" });
    }

    const startIso = new Date(String(initial));
    const endIso = new Date(String(final));
    if (Number.isNaN(startIso.getTime()) || Number.isNaN(endIso.getTime())) {
      return res.status(400).json({ error: "initial/final inválidos" });
    }
    if (endIso <= startIso) return res.status(400).json({ error: "final deve ser maior que initial" });

    const { calendar, auth, colab } = await getGoogleCalendarClientByColaboradorId(colaboradorId);

    const summary = servico_escolhido ? `Agendamento - ${servico_escolhido}` : "Agendamento";
    const description = [
      nome_cliente ? `cliente: ${nome_cliente}` : null,
      profissional_escolhido ? `profissional: ${profissional_escolhido}` : null,
      servico_escolhido ? `servico: ${servico_escolhido}` : null,
      `sessionid: ${sessionid}`,
    ].filter(Boolean).join("\n");

    const created = await calendar.events.insert({
      calendarId: colab.idCalendar || "primary",
      requestBody: {
        summary,
        description,
        start: { dateTime: startIso.toISOString(), timeZone: timezone },
        end: { dateTime: endIso.toISOString(), timeZone: timezone },
        extendedProperties: {
          private: {
            sessionid: String(sessionid),
            colaboradorId: String(colaboradorId),
            nome_cliente: String(nome_cliente || ""),
            servico_escolhido: String(servico_escolhido || ""),
          },
        },
      },
    });

    await persistRotatedTokens(colab, auth);

    return res.json({
      ok: true,
      eventId: created?.data?.id || null,
      status: created?.data?.status || null,
      start: created?.data?.start || null,
      end: created?.data?.end || null,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao criar evento" });
  }
});

// deletar por sessionid
router.delete("/google/events/by-sessionid", async (req, res) => {
  try {
    const { colaboradorId, sessionid, initial, final } = req.body || {};
    if (!colaboradorId || !sessionid) {
      return res.status(400).json({ error: "Informe colaboradorId e sessionid" });
    }

    const { calendar, auth, colab } = await getGoogleCalendarClientByColaboradorId(colaboradorId);

    const timeMin = initial ? new Date(String(initial)).toISOString() : undefined;
    const timeMax = final ? new Date(String(final)).toISOString() : undefined;

    const listResp = await calendar.events.list({
      calendarId: colab.idCalendar || "primary",
      singleEvents: true,
      maxResults: 2500,
      timeMin,
      timeMax,
      privateExtendedProperty: [`sessionid=${String(sessionid)}`],
    });

    let items = listResp?.data?.items || [];

    if (!items.length) {
      const fallback = await calendar.events.list({
        calendarId: colab.idCalendar || "primary",
        singleEvents: true,
        maxResults: 2500,
        timeMin,
        timeMax,
        q: String(sessionid),
      });

      items = (fallback?.data?.items || []).filter((ev) =>
        String(ev?.description || "").includes(String(sessionid))
      );
    }

    if (!items.length) {
      await persistRotatedTokens(colab, auth);
      return res.json({ ok: true, deletedCount: 0, deletedEventIds: [] });
    }

    const deletedEventIds = [];
    for (const ev of items) {
      if (!ev?.id) continue;
      await calendar.events.delete({
        calendarId: colab.idCalendar || "primary",
        eventId: ev.id,
      });
      deletedEventIds.push(ev.id);
    }

    await persistRotatedTokens(colab, auth);
    return res.json({ ok: true, deletedCount: deletedEventIds.length, deletedEventIds });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao deletar evento(s)" });
  }
});

module.exports = router;