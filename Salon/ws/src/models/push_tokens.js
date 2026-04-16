const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const push_tokens = new Schema({
  referenciaId: {
    type: Schema.Types.ObjectId,
    refPath: "model",
  },
  model: {
    type: String,
    required: true,
    enum: ["Cliente", "Colaborador"],
  },
  token: {
    type: String,
    required: true,
  },
  dataAtualizacao: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Push_tokens", push_tokens);
