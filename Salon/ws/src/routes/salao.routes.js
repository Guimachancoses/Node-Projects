const express = require("express");
const router = express.Router();
const turf = require("turf");

const Salao = require("../models/salao");
const Servico = require("../models/servico");
const Horario = require("../models/horario");
const Arquivo = require("../models/arquivo");
const util = require("../util");

// rota para cadastro de salao
router.post("/", async (req, res) => {
  try {
    const salao = await new Salao(req.body).save();
    res.json({ salao });
  } catch (err) {
    res.json({
      error: true,
      message: err.message,
    });
  }
});

// rota para pegar informações dos saloes
router.get("/servicos/:salaoId", async (req, res) => {
  try {
    const { salaoId } = req.params;
    const servicos = await Servico.find({
      salaoId,
      status: "A",
    }).select("_id titulo");

    /* [{ label: ''Serviço, value: '1212323' }] */
    res.json({
      error: false,
      servicos: servicos.map((s) => ({ label: s.titulo, value: s._id })),
    });
  } catch (err) {
    res.json({
      error: true,
      message: err.message,
    });
  }
});

// Pegar os dados de um salao pelo ID
router.get("/:id", async (req, res) => {
  try {
    const salao = await Salao.findById(req.params.id).select(
      "capa nome endereco.cidade endereco.logradouro endereco.numero endereco.bairro endereco.uf geo.coordinates telefone apresentacao logo"
    );

    const arquivos = await Arquivo.find({
      model: "Salao",
      referenciaId: salao._id,
    });

    // Calcular a distancia
    const distance = turf.distance(
      turf.point(salao.geo.coordinates), // ponto A (salão)
      turf.point([-22.551, -47.417])
    );

    // Está aberto?
    const horarios = await Horario.find({
      salaoId: req.params.id,
    }).select("dias inicio fim");

    const isOpened = util.isOpened(horarios);

    res.json({ error: false, salao: { ...salao._doc, distance, isOpened, arquivos } });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

module.exports = router;
