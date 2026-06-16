const mongoose = require("mongoose");

const ratingOptions = ["excelente", "boa", "regular", "ruim"];

const avaliacaoSchema = new mongoose.Schema(
    {
        rating: {
            type: String,
            required: true,
            enum: ratingOptions,
        },
        reasons: {
            type: [
                {
                    type: String,
                    trim: true,
                    maxlength: 100,
                },
            ],
            default: [],
        },
        comment: {
            type: String,
            trim: true,
            default: "",
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Avaliacao", avaliacaoSchema);
