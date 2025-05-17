const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const agendamento = new Schema({
  salaoId: {
    type: mongoose.Types.ObjectId,
    ref: "Salao",
    required: true,
  },
  clienteId: {
    type: mongoose.Types.ObjectId,
    ref: "Cliente",
    required: true,
  },
  colaboradorId: {
    type: mongoose.Types.ObjectId,
    ref: "Colaborador",
    required: true,
  },
  servicoId: {
    type: mongoose.Types.ObjectId,
    ref: "Servico",
    required: true,
  },
  data: {
    type: Date,
    required: true,
  },
  comissao: {
    type: Number,
    required: true,
  },
  valor: {
    type: Number,
    required: true,
  },
  transactionId: {
    type: String,
  },
  statusPagamento: {
    type: String,
    enum: ["P","S","E","C"],
    default: "P"
  },
  status: {
    type: String,
    enum: ["P","C","A","F"],
    default: "P"
  },
  dataCadastro: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Agendamento", agendamento);
