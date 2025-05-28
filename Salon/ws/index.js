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
require("dotenv").config();
require("./database");

const iniciarAgendamentoReminderScheduler = require("./src/lib/agendamentoReminderLib");
const { registerPushToken, deletePushToken, sendPushNotification } = require("./src/routes/pushNotification.routes");

// Middlewares
app.use(morgan("dev"));
// Informa que vai trabalhar com dados de retorno JSON
app.use(express.json());
app.use(busboy());
app.use(busboyBodyParser());
app.use(cors());


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

// ✅ Rotas de push notifications
app.post("/push-token", async (req, res) => {
  try {
    await registerPushToken(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Erro ao registrar token." });
  }
});

// Rota para deletar o token do cliente/colaborador:
app.delete("/push-token/:token", async (req, res) => {
  try {
    await deletePushToken(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Erro ao deletar token." });
  }
});

// Rota para enviar notificação:
app.post("/send-notification", async (req, res) => {
  try {
    await sendPushNotification(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Erro ao enviar notificação." });
  }
});

// Criar servidor HTTP e Socket.io
const server = http.createServer(app);
const io = socketIo(server);

app.set("io", io);  // Se quiser usar io em outros lugares via req.app.get('io')


// index.js (após app.listen)
const iniciarAgendamentoScheduler = require("./src/lib/agendamento-update-lib");

// Abre um ouvinte
app.listen(app.get("port"), () => {
  console.log("Antes de iniciar o servidor...");
  console.log(`WS Escutando na porta ${app.get("port")}`);
  iniciarAgendamentoReminderScheduler();
  iniciarAgendamentoScheduler();
});
