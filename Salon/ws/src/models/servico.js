const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const servico = new Schema({
    salaoId: {
        type: mongoose.Types.ObjectId,
        ref: 'Salao',
        required: true,
    },
    titulo: {
        type: String,
        required: true
    },
    preco: {
        type: Number,
        required: true
    },
    comissao: {
        type: Number, // Porcentagem de comissão sobre o preço
        required: true
    },
    duracao: {
        type: Date, // Duração em minutos do serviço
        required: true
    },
    recorrencia: {
        type: Number, // Periodo de retorno do serviço em dias
        required: true
    },
    descricao: {
        type: String,
        required: true
    },
    tipoServico: {
        type: String,
        enum: ["Barbearia", "Cabeleireiro", "Manicure", "Pedicure", "Cuidados", "Crianças", "Outros"],
        required: true
    },
    status: {
      type: String,
      enum: ["A", "I", 'E'],
      default: "A",
    },
    dataCadastro: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Servico', servico)