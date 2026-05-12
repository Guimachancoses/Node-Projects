const mongoose = require("mongoose");
const { Schema } = mongoose;

const TelefoneSchema = new Schema(
  {
    area: { type: String, default: "" },   // ex: "19"
    numero: { type: String, default: "" }, // ex: "992721056"
  },
  { _id: false }
);

const IdentificacaoSchema = new Schema(
  {
    tipoD: {
      type: String,
      enum: ["CPF", "CNPJ", ""],
      default: "",
    },
    numero: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const EnderecoSchema = new Schema(
  {
    logradouro: { type: String, default: "" },
    bairro: { type: String, default: "" },
    cidade: { type: String, default: "" },
    uf: { type: String, default: "" },
    cep: { type: String, default: "" },
    numero: { type: String, default: "" },
    pais: { type: String, default: "" },
  },
  { _id: false }
);

const GeoSchema = new Schema(
  {
    tipo: { type: String, default: "Point" },
    coordinates: {
      type: [Number],
      default: [],
    },
  },
  { _id: false }
);

const salaoSchema = new Schema({
  nome: {
    type: String,
    required: [true, "Nome é obrigatório"],
    trim: true,
  },
  logo: String,
  capa: String,
  apresentacao: String,

  email: {
    type: String,
    required: [true, "E-mail é obrigatório"],
    trim: true,
    lowercase: true,
  },

  senha: {
    type: String,
    default: null,
  },

  // novo formato (área + número)
  telefone: {
    type: TelefoneSchema,
    default: () => ({}),
  },

  // novo campo de status
  status: {
    type: String,
    enum: ["A", "I", "E"], // Ativo, Inativo, Desativado
    default: "A",
    uppercase: true,
  },

  // novo campo de documento
  identificacao: {
    type: IdentificacaoSchema,
    default: () => ({}),
  },

  endereco: {
    type: EnderecoSchema,
    default: () => ({}),
  },

  geo: {
    type: GeoSchema,
    default: () => ({ tipo: "Point", coordinates: [] }),
  },

  dataCadastro: {
    type: Date,
    default: Date.now,
  },
});

salaoSchema.index({ geo: "2dsphere" }, { sparse: true });

module.exports = mongoose.model("Salao", salaoSchema);