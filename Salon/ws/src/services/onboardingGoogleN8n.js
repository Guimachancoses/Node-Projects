const axios = require("axios");

const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;
const TEMPLATE_WORKFLOW_ID = process.env.N8N_TEMPLATE_WORKFLOW_ID;

if (!N8N_BASE_URL || !N8N_API_KEY || !TEMPLATE_WORKFLOW_ID) {
  throw new Error("Faltam variáveis de ambiente do n8n");
}

const n8n = axios.create({
  baseURL: `${N8N_BASE_URL}/api/v1`,
  headers: {
    "X-N8N-API-KEY": N8N_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * googleTokens esperado:
 * {
 *   access_token,
 *   refresh_token,
 *   token_type,
 *   expiry_date,   // number (ms)
 *   scope
 * }
 */
async function createGoogleCredential({ clientName, googleEmail, googleTokens }) {
  const credentialName = `google_${clientName}_${googleEmail}`.replace(/\s+/g, "_");

  // Tipo pode variar conforme node/versão:
  // normalmente googleCalendarOAuth2Api para Google Calendar node.
  // Se seu fluxo tiver Google Drive node separado, pode precisar googleDriveOAuth2Api.
  const payload = {
    name: credentialName,
    type: "googleCalendarOAuth2Api",
    data: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // escopos que seu fluxo precisa
      scope:
        "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file",
      oauthTokenData: {
        access_token: googleTokens.access_token,
        refresh_token: googleTokens.refresh_token,
        token_type: googleTokens.token_type || "Bearer",
        expiry_date: googleTokens.expiry_date,
        scope: googleTokens.scope,
      },
    },
  };

  const { data } = await n8n.post("/credentials", payload);
  return data; // { id, name, ... }
}

async function getTemplateWorkflow() {
  const { data } = await n8n.get(`/workflows/${TEMPLATE_WORKFLOW_ID}`);
  return data;
}

function injectCredentialIntoNodes(workflow, credential) {
  const targetNodeNames = new Set(["criar_eventos", "buscar_eventos", "deletar_eventos"]);

  const updatedNodes = workflow.nodes.map((node) => {
    if (!targetNodeNames.has(node.name)) return node;

    return {
      ...node,
      credentials: {
        ...(node.credentials || {}),
        googleCalendarOAuth2Api: {
          id: String(credential.id),
          name: credential.name,
        },
      },
    };
  });

  return {
    ...workflow,
    nodes: updatedNodes,
  };
}

function sanitizeWorkflowForCreate(workflow, newName) {
  // remove campos que não devem ser enviados no create
  const {
    id,
    createdAt,
    updatedAt,
    versionId,
    active,
    shared,
    tags,
    ...rest
  } = workflow;

  return {
    ...rest,
    name: newName,
    active: false,
  };
}

async function createWorkflow(workflowPayload) {
  const { data } = await n8n.post("/workflows", workflowPayload);
  return data;
}

async function activateWorkflow(workflowId) {
  // Em versões recentes funciona PATCH com active: true
  const { data } = await n8n.patch(`/workflows/${workflowId}`, { active: true });
  return data;
}

async function deleteCredential(credentialId) {
  try {
    await n8n.delete(`/credentials/${credentialId}`);
  } catch (e) {
    console.error("Rollback: falha ao deletar credencial", e?.response?.data || e.message);
  }
}

async function deleteWorkflow(workflowId) {
  try {
    await n8n.delete(`/workflows/${workflowId}`);
  } catch (e) {
    console.error("Rollback: falha ao deletar workflow", e?.response?.data || e.message);
  }
}

/**
 * Orquestra onboarding completo:
 * 1) cria credencial
 * 2) clona template
 * 3) injeta credencial nos 3 nodes
 * 4) cria workflow
 * 5) ativa workflow
 */
async function onboardingGoogleN8n({
  appUserId,
  clientName,
  googleEmail,
  googleTokens,
}) {
  let createdCredential = null;
  let createdWorkflow = null;

  try {
    if (!googleTokens?.refresh_token) {
      throw new Error("refresh_token ausente. Garanta access_type=offline + prompt=consent.");
    }

    // 1) Credencial
    createdCredential = await createGoogleCredential({
      clientName,
      googleEmail,
      googleTokens,
    });

    // 2) Template
    const template = await getTemplateWorkflow();

    // 3) Inject cred nos nodes alvo
    const withCred = injectCredentialIntoNodes(template, createdCredential);

    // 4) Payload final
    const workflowName = `cliente_${clientName}_${appUserId}`.replace(/\s+/g, "_");
    const createPayload = sanitizeWorkflowForCreate(withCred, workflowName);

    // 5) Criar workflow
    createdWorkflow = await createWorkflow(createPayload);

    // 6) Ativar workflow
    await activateWorkflow(createdWorkflow.id);

    return {
      ok: true,
      credentialId: createdCredential.id,
      credentialName: createdCredential.name,
      workflowId: createdWorkflow.id,
      workflowName: createdWorkflow.name,
    };
  } catch (err) {
    console.error("Erro onboarding n8n:", err?.response?.data || err.message);

    // rollback
    if (createdWorkflow?.id) await deleteWorkflow(createdWorkflow.id);
    if (createdCredential?.id) await deleteCredential(createdCredential.id);

    throw err;
  }
}

module.exports = {
  onboardingGoogleN8n,
};