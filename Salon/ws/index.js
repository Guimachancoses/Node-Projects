// Responsavel pela configuração do ws
const path = require("path");
const express = require("express");
const app = express();
const morgan = require("morgan");
const busboy = require("connect-busboy");
const busboyBodyParser = require("busboy-body-parser");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
require("./database");

// Middlewares
app.use(morgan("dev"));
// Informa que vai trabalhar com dados de retorno JSON
app.use(express.json());
app.use(busboy());
app.use(busboyBodyParser());
app.use(cors());
require("dotenv").config();

// Servir HTML do /web
app.use(express.static(path.resolve(__dirname, "../web")));

// Define a porta
app.set("port", 8000);

// Rotas
app.use("/salao", require("./src/routes/salao.routes"));
app.use("/servico", require("./src/routes/servico.routes"));
app.use("/horario", require("./src/routes/horario.routes"));
app.use("/colaborador", require("./src/routes/colaborador.routes"));
app.use("/cliente", require("./src/routes/cliente.routes"));
app.use("/agendamento", require("./src/routes/agendamento.routes"));
app.use("/create-checkout", require("./src/routes/api/mercado-pago/create-checkout/createCheckout.routes"));
app.use("/mercado-pago/pending", require("./src/routes/api/mercado-pago/pending/pending.routes"));
app.use("/mercado-pago/webhook", require("./src/routes/api/mercado-pago/webhook/webhook-mpg.routes"));

// index.js (após app.listen)
const iniciarAgendamentoScheduler = require("./src/lib/agendamento-update-lib");

// Abre um ouvinte
app.listen(app.get("port"), () => {
  console.log("Antes de iniciar o servidor...");
  console.log(`WS Escutando na porta ${app.get("port")}`);
  
  iniciarAgendamentoScheduler();
});
