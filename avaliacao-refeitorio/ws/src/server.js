const express = require("express");
const cors = require("cors");
require("dotenv").config();

const avaliacaoRoutes = require("./routes/avaliacao.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Database connection
require("./database");

app.get("/", (req, res) => {
  res.json({ status: "WS Avaliacao Refeitorio online" });
});

app.use("/avaliacoes", avaliacaoRoutes);

const port = process.env.PORT || 3333;

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${port}`);
});
