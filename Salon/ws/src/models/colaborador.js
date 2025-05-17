const mongoose = require("mongoose");
const Counter = require("./conterModel");
const Schema = mongoose.Schema;

const colaborador = new Schema({
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
      },
      numero: {
        type: String,
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
  contaBancaria: {
    titular: {
      type: String,
      required: false,
    },
    cpfCnpj: {
      type: String,
      required: false,
    },
    banco: {
      type: String,
      required: false,
    },
    tipo: {
      type: String,
      required: false,
    },
    agencia: {
      type: String,
      required: false,
    },
    numero: {
      type: String,
      required: false,
    },
    dv: {
      type: String,
      required: false,
    },
  },
  recipientId: {
    type: String,
  },
  dataCadastro: {
    type: Date,
    default: Date.now,
  },
});

// ⬇️ Middleware para incrementar o ID do endereço
colaborador.pre("save", async function (next) {
  const doc = this;

  if (doc.endereco?.id) return next();

  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "enderecoId" },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );

    doc.endereco.id = counter.seq.toString();
    next();
  } catch (err) {
    next(err);
  }
});


module.exports = mongoose.model("Colaborador", colaborador);
