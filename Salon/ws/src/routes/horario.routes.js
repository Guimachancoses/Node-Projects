// Estrutura padrão de rota
const express = require("express");
const router = express.Router();
const _ = require("lodash");
const Horario = require("../models/horario");
const ColaboradorServico = require("../models/relationship/colaboradorServico");
const SalaoColaborador = require("../models/relationship/salaoColaborador")

// Rota para criar horário
router.post("/", async (req, res) => {
  try {
    const horario = await new Horario(req.body).save();
    res.json({ horario });
  } catch (err) {
    req.json({ error: true, message: err.message });
  }
});

// Rota par retornar todos os horarios de um determinado salao
router.get("/salao/:salaoId", async (req, res) => {
  try {
    const { salaoId } = req.params;
    const horarios = await Horario.find({
      salaoId,
    });
    res.json({ horarios });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para atualizar os horarios
router.put("/:horarioId", async (req, res) => {
  try {
    const { horarioId } = req.params;
    const horario = req.body;

    await Horario.findByIdAndUpdate(horarioId, horario);

    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para deletar um horario
router.delete("/:horarioId", async (req, res) => {
  try {
    const { horarioId } = req.params;

    await Horario.findByIdAndDelete(horarioId);

    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para retornar colaboradores filtrados pelos serviços e vínculo ativo no salão
router.post("/colaboradores", async (req, res) => {
  try {
    const { especialidades, salaoId } = req.body; // Agora também recebe salaoId

    if (!especialidades?.length || !salaoId) {
      return res.status(400).json({ error: true, message: "Especialidades e salão são obrigatórios." });
    }

    // Busca todos os colaboradores que oferecem os serviços desejados e estão ativos no serviço
    const colaboradoresServico = await ColaboradorServico.find({
      servicoId: { $in: especialidades },
      status: "A",
    })
      .populate("colaboradorId", "nome")
      .select("colaboradorId");

    // Pegamos só os IDs dos colaboradores
    const colaboradoresIds = colaboradoresServico.map((v) => v.colaboradorId._id);

    // Agora filtramos no SalaoColaborador para ver se eles estão ativos no salão
    const colaboradoresAtivos = await SalaoColaborador.find({
      salaoId,
      colaboradorId: { $in: colaboradoresIds },
      status: "A",
    })
      .populate("colaboradorId", "nome");

    // Remove duplicados (caso tenha algum)
    const listaColaboradores = _.uniqBy(colaboradoresAtivos, (v) => v.colaboradorId._id.toString())
      .map((v) => ({
        label: v.colaboradorId.nome,
        value: v.colaboradorId._id,
      }));

    res.json({
      error: false,
      listaColaboradores,
    });
  } catch (err) {
    res.json({
      error: true,
      message: err.message,
    });
  }
});


module.exports = router;
