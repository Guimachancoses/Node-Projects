const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const arquivo = new Schema({
    referenciaId: {
        type: Schema.Types.ObjectId,
        refPath: 'model'
    },
    model: {
        type: String,
        riquered: true,
        enum: ['Servico','Salao']
    },
    caminho: {
        type: String,
        required: true,
    },
    dataCadastro: {
        type: Date,
        default: Date.now,
      },

});

module.exports = mongoose.model('Arquivo', arquivo);