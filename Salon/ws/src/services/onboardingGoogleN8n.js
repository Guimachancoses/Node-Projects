const axios = require("axios");

const n8n = axios.create({
  baseURL: `${process.env.N8N_BASE_URL}/api/v1`,
  headers: {
    "X-N8N-API-KEY": process.env.N8N_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

const TEMPLATE_WORKFLOW_ID = process.env.N8N_TEMPLATE_WORKFLOW_ID;

// -------- Helpers --------
function credentialDataVariants(tokens) {
  const baseToken = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: tokens.token_type || "Bearer",
    expiry_date: tokens.expiry_date,
    scope: tokens.scope,
  };

  return [
    // Variante A (mais comum)
    {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      oauthTokenData: baseToken,
    },
    // Variante B (n8n pedindo campos extras)
    {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      serverUrl: "https://www.googleapis.com/",
      sendAdditionalBodyProperties: false,
      additionalBodyProperties: "",
      oauthTokenData: baseToken,
    },
    // Variante C (algumas instalações exigem additionalBodyProperties em JSON)
    {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      serverUrl: "https://www.googleapis.com/",
      sendAdditionalBodyProperties: true,
      additionalBodyProperties: "{}",
      oauthTokenData: baseToken,
    },
  ];
}

async function createCredentialWithFallback({ type, name, tokens }) {
  const variants = credentialDataVariants(tokens);
  let lastErr = null;

  for (let i = 0; i < variants.length; i++) {
    try {
      const payload = { name, type, data: variants[i] };
      //console.log(`[N8N] Tentando credencial ${type} variante ${i + 1}...`);
      const { data } = await n8n.post("/credentials", payload);
      //console.log(`[N8N] Credencial criada (${type}) variante ${i + 1}:`, data?.id);
      return data;
    } catch (err) {
      lastErr = err;
      // console.log(
      //   `[N8N] Falha variante ${i + 1} (${type}):`,
      //   err?.response?.data?.message || err.message
      // );
    }
  }

  throw lastErr;
}

async function getTemplateWorkflow() {
  const { data } = await n8n.get(`/workflows/${TEMPLATE_WORKFLOW_ID}`);
  return data;
}

function sanitizeWorkflowForCreate(workflow, newName) {
  const { id, createdAt, updatedAt, versionId, active, shared, tags, ...rest } = workflow;
  return { ...rest, name: newName, active: false };
}

function injectCredentials(workflow, calendarCred, driveCred) {
  const calendarNodes = new Set(["criar_eventos", "buscar_eventos", "deletar_eventos"]);
  const driveNodes = new Set(["Arquivo Criado", "Arquivo Alterado", "Download File"]);

  const nodes = workflow.nodes.map((node) => {
    if (calendarNodes.has(node.name)) {
      return {
        ...node,
        credentials: {
          ...(node.credentials || {}),
          googleCalendarOAuth2Api: {
            id: String(calendarCred.id),
            name: calendarCred.name,
          },
        },
      };
    }

    if (driveNodes.has(node.name)) {
      return {
        ...node,
        credentials: {
          ...(node.credentials || {}),
          googleDriveOAuth2Api: {
            id: String(driveCred.id),
            name: driveCred.name,
          },
        },
      };
    }

    return node;
  });

  return { ...workflow, nodes };
}

async function createWorkflow(payload) {
  const { data } = await n8n.post("/workflows", payload);
  return data;
}

async function activateWorkflow(workflowId) {
  const { data } = await n8n.patch(`/workflows/${workflowId}`, { active: true });
  return data;
}

async function safeDeleteCredential(id) {
  if (!id) return;
  try {
    await n8n.delete(`/credentials/${id}`);
  } catch (e) {
    console.error("[ROLLBACK] Falha ao deletar credencial:", id, e?.response?.data || e.message);
  }
}

async function safeDeleteWorkflow(id) {
  if (!id) return;
  try {
    await n8n.delete(`/workflows/${id}`);
  } catch (e) {
    console.error("[ROLLBACK] Falha ao deletar workflow:", id, e?.response?.data || e.message);
  }
}

// -------- Orquestração --------
async function onboardingGoogleN8n({ appUserId, clientName, googleEmail, googleTokens }) {
  let calendarCred = null;
  let driveCred = null;
  let workflow = null;

  try {
    if (!googleTokens?.refresh_token) {
      throw new Error("refresh_token ausente (use access_type=offline + prompt=consent).");
    }

    // 1) cria credenciais
    calendarCred = await createCredentialWithFallback({
      type: "googleCalendarOAuth2Api",
      name: `google_calendar_${clientName}_${googleEmail}`.replace(/\s+/g, "_"),
      tokens: googleTokens,
    });

    driveCred = await createCredentialWithFallback({
      type: "googleDriveOAuth2Api",
      name: `google_drive_${clientName}_${googleEmail}`.replace(/\s+/g, "_"),
      tokens: googleTokens,
    });

    // 2) clona template e injeta credenciais
    const template = await getTemplateWorkflow();
    const withCreds = injectCredentials(template, calendarCred, driveCred);
    const payload = sanitizeWorkflowForCreate(
      withCreds,
      `cliente_${clientName}_${appUserId}`.replace(/\s+/g, "_")
    );

    // 3) cria workflow
    workflow = await createWorkflow(payload);

    // 4) ativa
    await activateWorkflow(workflow.id);

    return {
      ok: true,
      workflowId: workflow.id,
      workflowName: workflow.name,
      calendarCredentialId: calendarCred.id,
      driveCredentialId: driveCred.id,
    };
  } catch (err) {
    console.error("[ONBOARDING] Erro:", err?.response?.data || err.message);

    // rollback
    await safeDeleteWorkflow(workflow?.id);
    await safeDeleteCredential(calendarCred?.id);
    await safeDeleteCredential(driveCred?.id);

    throw err;
  }
}

module.exports = { onboardingGoogleN8n };