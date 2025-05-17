const express = require("express");
const router = express.Router();
const { Payment, MercadoPagoConfig } = require("mercadopago");
// Instância do cliente Mercado Pago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: { idempotencyKey: "<SOME_UNIQUE_VALUE>" },
});

// Rota para lidar com pagamentos pendentes (por exemplo, PIX)
router.get("/", async (req, res) => {
  const paymentId = req.query.payment_id;
  const testeId = req.query.external_reference;

  if (!paymentId || !testeId) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const payment = new Payment(mpClient);
    const paymentData = await payment.get({ id: paymentId });

    const isApproved =
      paymentData.status === "approved" || paymentData.date_approved !== null;

    const redirectUrl = isApproved ? "/?status=sucesso" : "/";

    return res.redirect(302, redirectUrl);
  } catch (err) {
    console.error("Erro ao verificar pagamento Mercado Pago:", err.message);
    return res
      .status(500)
      .json({ error: true, message: "Erro ao processar pagamento" });
  }
});

module.exports = router;
