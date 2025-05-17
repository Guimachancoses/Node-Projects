const express = require("express");
const router = express.Router();
const { Preference, MercadoPagoConfig } = require("mercadopago");
//const mpClient = require("../../../../lib/mercado-pago-lib");

// Instância do cliente Mercado Pago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: { idempotencyKey: "<SOME_UNIQUE_VALUE>" },
});

// POST /pagamento
router.post("/", async (req, res) => {
  try {
    //console.log("BODY:", req.body);

    if (!req.body) {
      return res.status(400).json({
        error: true,
        message: "O corpo da requisição está vazio ou mal formatado.",
      });
    }

    const { id, titulo, preco, userEmail } = req.body;

    //console.log("id: ", id);
    //console.log(" userEmail: ", userEmail);

    if (!id) {
      return res.status(400).json({
        error: true,
        message: "O campo 'id' é obrigatório.",
      });
    }

    const preference = new Preference(mpClient);

    const createdPreference = await preference.create({
      body: {
        external_reference: id,
        metadata: { id },
        ...(userEmail && {
          payer: {
            email: userEmail,
          },
        }),
        items: [
          {
            id: id,
            title: titulo,
            description: "Serviços barbearia Parrudus",
            quantity: 1,
            unit_price: preco,
            currency_id: "BRL",
            category_id: "basic_service",
          },
        ],
        payment_methods: {
          installments: 1,
        },
        auto_return: "approved",
        back_urls: {
          success: "parrudus-app://pagamento/agendamentos/success",
          failure: "parrudus-app://pagamento/agendamentos/failure",
          pending: "parrudus-app://pagamento/agendamentos/pending",
        },
      },
    });

    if (!createdPreference.id) {
      return res.status(500).json({
        error: true,
        message: "Falha ao gerar preferenceId",
      });
    }

    //console.log("resposta API: ", createdPreference);

    return res.json({
      error: false,
      preferenceId: createdPreference.id,
      initPoint: createdPreference.init_point,
    });
  } catch (err) {
    console.error("Erro ao criar preference:", err.message);
    return res.status(500).json({
      error: true,
      message: "Erro interno ao criar preferência de pagamento.",
    });
  }
});

module.exports = router;
