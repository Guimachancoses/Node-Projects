const express = require("express");
const router = express.Router();
const { Payment, MercadoPagoConfig } = require("mercadopago");
const {
  verifyMercadoPagoSignature,
} = require("../../../../lib/mercado-pago-lib");
const {
  handleMercadoPagoPayment,
} = require("../../../../server/mercado-pago/handle-payment");

// Instância do cliente Mercado Pago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: { idempotencyKey: "<SOME_UNIQUE_VALUE>" },
});

// Rota de Webhook do Mercado Pago
router.post("/", express.json(), async (req, res) => {
  try {
    const isValid = verifyMercadoPagoSignature(req);
    if (!isValid) {
      return res
        .status(401)
        .json({ error: true, message: "Invalid signature" });
    }

    const { type, data } = req.body;

    //console.log("type: ", type )

    switch (type) {
      case "payment":
        const payment = new Payment(mpClient);
        const paymentData = await payment.get({ id: data.id });

        //console.log(paymentData)

        if (
          paymentData.status === "approved" || // Pagamento por cartão
          paymentData.date_approved !== null // Pagamento por Pix
        ) {
          await handleMercadoPagoPayment(paymentData);
        }
        break;

      // Outros tipos de evento podem ser tratados aqui
      default:
        console.log("Unhandled event type:", type);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
});

module.exports = router;
