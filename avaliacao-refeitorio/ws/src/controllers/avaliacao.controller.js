const Avaliacao = require("../models/avaliacao");

async function criarAvaliacao(req, res) {
  try {
    const { rating, reasons = [], comment = "" } = req.body;

    if (!rating) {
      return res.status(400).json({
        erro: "rating e obrigatorio",
      });
    }

    const avaliacao = await Avaliacao.create({
      rating,
      reasons,
      comment,
    });

    return res.status(201).json(avaliacao);
  } catch (error) {
    return res.status(400).json({
      erro: error.message || "Erro ao salvar avaliacao",
    });
  }
}

async function listarAvaliacoes(req, res) {
  try {
    const avaliacoes = await Avaliacao.find().sort({ createdAt: -1 });

    return res.json(avaliacoes);
  } catch (error) {
    return res.status(500).json({
      erro: error.message || "Erro ao listar avaliacoes",
    });
  }
}

module.exports = {
  criarAvaliacao,
  listarAvaliacoes,
};
