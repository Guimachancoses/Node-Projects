const crypto = require("crypto");

// Função auxiliar para verificar assinatura do Mercado Pago
function verifyMercadoPagoSignature(req) {
  const xSignature = req.headers["x-signature"];
  const xRequestId = req.headers["x-request-id"];
  const originalUrl = req.originalUrl;

  if (!xSignature || !xRequestId) {
    return false;
  }

  const signatureParts = xSignature.split(",");
  let ts = "";
  let v1 = "";

  signatureParts.forEach((part) => {
    const [key, value] = part.split("=");
    if (key.trim() === "ts") ts = value.trim();
    if (key.trim() === "v1") v1 = value.trim();
  });

  if (!ts || !v1) return false;

  const url = new URL(`https://dummy.com${originalUrl}`);
  const dataId = url.searchParams.get("data.id");

  let manifest = "";
  if (dataId) manifest += `id:${dataId};`;
  manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;

  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(manifest);
  const generatedHash = hmac.digest("hex");

  return generatedHash === v1;
}

module.exports = {
  verifyMercadoPagoSignature,
};
