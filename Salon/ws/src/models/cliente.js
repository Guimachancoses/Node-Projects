const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cliente = new Schema({
  email: {
    type: String,
    required: [true, "E-mail é obrigatório"],
  },
  nome: {
    type: String,
    required: [true, "Nome é obrigatório"],
  },
  sobrenome: {
    type: String,
    required: [true, "Sobreome é obrigatório"],
  },
  telefone: {
    area: {
      type: String,
      required: [true, "Área é obrigatório"],
    },
    numero: {
      type: String,
      required: [true, "Número de telefone é obrigatório"],
    },
  },
  senha: {
    type: String,
    default: null,
  },
  identificacao: {
    tipoD: String,
    numero: String,
  },
  enderecoPadrao: {
    type: String,
  },
  endereco: {
    id: String,
    cep: String,
    logradouro: String,
    bairro: String,
    numero: Number,
    cidade: {
      nome: String,
    },
  },
  foto: {
    type: String,
    required: false,
  },
  dataNascimento: {
    type: String, // YYYY-MM-dd
    required: false,
  },
  sexo: {
    type: String,
    enum: ["M", "F"],
    required: false,
  },
  status: {
    type: String,
    enum: ["A", "I"],
    default: "A",
  },
  customerId: {
    type: String,
  },
  prefProficional: {
    type: String,
    required: false
  },
  prefPagamento: {
    type: String,
    enum: ["M", "L"],
    default: "L",
  },
  dataCadastro: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Cliente", cliente);
