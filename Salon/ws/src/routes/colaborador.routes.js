// Estrutura padrão de rota
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const mercadopg = require("../services/mercadopg");
const Colaborador = require("../models/colaborador");
const SalaoColaborador = require("../models/relationship/salaoColaborador");
const ColaboradorServico = require("../models/relationship/colaboradorServico");

// Rota para criar o colaborador no banco de dados MongoDB e no MercadoPago
router.post("/", async (req, res) => {
  const db = mongoose.connection;
  const session = await db.startSession();
  session.startTransaction();

  try {
    const { colaborador, salaoId } = req.body;
    let newColaborador = null;

    const existenteColaborador = await Colaborador.findOne({
      $or: [{ email: colaborador.email }, { telefone: colaborador.telefone }],
    });

    if (!existenteColaborador) {
      // 1. Salva no MongoDB (sem recipientId por enquanto)
      newColaborador = await new Colaborador({
        ...colaborador,
        recipientId: null,
      }).save({ session });

      // 2. Tenta criar no Mercado Pago
      const mercadoPgAccount = await mercadopg("/v1/customers", {
        email: colaborador.email,
        nome: colaborador.nome,
        sobrenome: colaborador.sobrenome,
        telefone: {
          area: colaborador.telefone.area,
          numbero: colaborador.telefone.numero,
        },
        identificacao: {
          tipoD: colaborador.identificacao.tipoD,
          numero: colaborador.identificacao.numero,
        },
        enderecoPadrao: colaborador.enderecoPadrao,
        endereco: {
          cep: colaborador.endereco.cep,
          nomeRua: colaborador.endereco.nomeRua,
          numero: colaborador.endereco.numero,
          cidade: {
            nome: colaborador.endereco.cidade.nome,
          },
        },
      }, "post");

      console.log(
        "response mercadoPago:",
        JSON.stringify(mercadoPgAccount, null, 2)
      );

      if (mercadoPgAccount.error) {
        throw new Error("Erro no Mercado Pago: " + mercadoPgAccount.message);
      }

      const customerId = mercadoPgAccount.data.id;

      // 3. Atualiza o recipientId no colaborador
      newColaborador.recipientId = customerId;
      await newColaborador.save({ session });
    }

    const colaboradorId = existenteColaborador
      ? existenteColaborador._id
      : newColaborador._id;

    const existentRelationship = await SalaoColaborador.findOne({
      salaoId,
      colaboradorId,
      status: { $ne: "E" },
    });

    if (!existentRelationship) {
      await new SalaoColaborador({
        salaoId,
        colaboradorId,
        status: colaborador.vinculo,
      }).save({ session });
    }

    if (existenteColaborador) {
      await SalaoColaborador.findOneAndUpdate(
        { salaoId, colaboradorId },
        { status: colaborador.vinculo },
        { session }
      );
    }

    await ColaboradorServico.insertMany(
      colaborador.especialidades.map((servicoId) => ({
        servicoId,
        colaboradorId,
      })),
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    if (existenteColaborador && existentRelationship) {
      res.json({ error: true, message: "Colaborador já cadastrado." });
    } else {
      res.json({ error: false });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.json({ error: true, message: err.message });
  }
});


// Rota de atualização do colaborador no banco de dados MongoDB e no MercadoPago
router.put("/:colaboradorId", async (req, res) => {
  try {
    const { vinculo, vinculoId, especialidades } = req.body;
    const { colaboradorId } = req.params;

    // 1º Atualizar vinculo pelo ID do vinculo
    await SalaoColaborador.findByIdAndUpdate(vinculoId, { status: vinculo });

    // 2º Atualizar especialidades pelo ID de especialidades
    // Primeiro deleta todos os serviços do colaborador que serão atualizados
    await ColaboradorServico.deleteMany({
      colaboradorId,
    });

    // Agora atualiza os serviços desse colaborador
    await ColaboradorServico.insertMany(
      especialidades.map((servicoId) => ({
        servicoId,
        colaboradorId,
      }))
    );

    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para deletar o vinculo do colaborador com o salão
router.delete("/vinculo/:id", async (req, res) => {
  try {
    await SalaoColaborador.findByIdAndUpdate(req.params.id, { status: "E" });
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para retornar todos os colaboradores cadastrados
router.post("/filter", async (req, res) => {
  try {
    const colaboradores = await Colaborador.find(req.body.filters);
    res.json({ error: false, colaboradores });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para retornar todos os colaboradores de um determinado salão
router.get("/salao/:salaoId", async (req, res) => {
  try {
    const { salaoId } = req.params;
    let listaColaboradores = [];

    // Recuperar vinculos
    const salaoColaboradores = await SalaoColaborador.find({
      salaoId,
      status: { $ne: "E" },
    })
      .populate({ path: "colaboradorId", select: "-senha -recipientId" }) // faz um join com a colaboradorId
      .select("colaboradorId dataCadastro status"); // apenas os campos de vinculo que quero no retorno

    // Encontrar o vinculo dos colaboradores com as especialidades
    for (let vinculo of salaoColaboradores) {
      if (!vinculo.colaboradorId) continue;
      const especialidades = await ColaboradorServico.find({
        colaboradorId: vinculo.colaboradorId._id,
      }).populate("servicoId");

      listaColaboradores.push({
        ...vinculo._doc,
        especialidades: especialidades
          .filter((especialidade) => especialidade.servicoId) // só mantém se o serviço existir
          .map((especialidade) => especialidade.servicoId._id),
      });
    }

    res.json({
      error: false,
      colaboradores: listaColaboradores.map((vinculo) => ({
        ...vinculo.colaboradorId._doc,
        vinculoId: vinculo._id,
        vinculo: vinculo.status,
        especialidades: vinculo.especialidades,
        dataCadastro: vinculo.dataCadastro,
      })),
    });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

module.exports = router;
