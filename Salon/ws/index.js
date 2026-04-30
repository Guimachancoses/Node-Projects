// Responsavel pela configuração do ws
require("dotenv").config();

const path = require("path");
const express = require("express");
const app = express();
const morgan = require("morgan");
const busboy = require("connect-busboy");
const busboyBodyParser = require("busboy-body-parser");
const cors = require("cors");

require("./database");

// Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(busboy());
app.use(busboyBodyParser());

// 🔽 CORS novo (coloque aqui)
const allowedOrigins = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, "")) // remove barra final
  .filter(Boolean);

console.log("CORS allowedOrigins:", allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // postman/curl/health checks

    const normalizedOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn("CORS bloqueado para origem:", origin);
    return callback(null, false); // não lança erro 500
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Define a porta
app.set("port", process.env.PORT || 8000);

// Rotas atuais
app.use("/salao", require("./src/routes/salao.routes"));
app.use("/servico", require("./src/routes/servico.routes"));
app.use("/horario", require("./src/routes/horario.routes"));
app.use("/colaborador", require("./src/routes/colaborador.routes"));
app.use("/cliente", require("./src/routes/cliente.routes"));
app.use("/push-token", require("./src/routes/push-token.routes"));
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
app.use("/evolution", require("./src/routes/evolution.routes"));

// Rotas Google/OAuth (separadas)
app.use("/", require("./src/routes/google.routes"));

// index.js (após app.listen)
const iniciarAgendamentoScheduler = require("./src/lib/agendamento-update-lib");
const iniciarLembretesScheduler = require("./src/lib/agendamento-lembretes-lib");

// Abre um ouvinte
app.listen(app.get("port"), "0.0.0.0", () => {
  console.log("Antes de iniciar o servidor...");
  console.log(`WS Escutando na porta ${app.get("port")}`);
  iniciarAgendamentoScheduler();
  iniciarLembretesScheduler();
});