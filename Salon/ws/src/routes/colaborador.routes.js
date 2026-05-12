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

      // console.log(
      //   "response mercadoPago:",
      //   JSON.stringify(mercadoPgAccount, null, 2)
      // );

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
    const { colaboradorId } = req.params;

    // 🔥 suporta JSON e FormData
    const body =
      typeof req.body.colaborador === "string"
        ? JSON.parse(req.body.colaborador)
        : req.body;

    const {
      vinculo,
      vinculoId,
      especialidades = [],
      ...perfil
    } = body;

    // =============================
    // 1. Atualiza dados do colaborador
    // =============================
    await Colaborador.findByIdAndUpdate(
      colaboradorId,
      {
        ...perfil,
      },
      { new: true }
    );

    // =============================
    // 2. Atualiza vínculo
    // =============================
    if (vinculoId) {
      await SalaoColaborador.findByIdAndUpdate(vinculoId, {
        status: vinculo,
      });
    }

    // =============================
    // 3. Atualiza especialidades
    // =============================
    await ColaboradorServico.deleteMany({ colaboradorId });

    if (especialidades.length) {
      await ColaboradorServico.insertMany(
        especialidades.map((servicoId) => ({
          servicoId,
          colaboradorId,
        }))
      );
    }

    // =============================
    // 4. (Opcional) atualizar foto
    // =============================
    if (req.file) {
      await Colaborador.findByIdAndUpdate(colaboradorId, {
        foto: req.file.filename,
      });
    }

    // =============================
    // 5. Retorna atualizado
    // =============================
    const colaboradorAtualizado = await Colaborador.findById(colaboradorId);

    return res.json({
      error: false,
      colaborador: colaboradorAtualizado,
    });

  } catch (err) {
    return res.json({ error: true, message: err.message });
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
    const { filters = {} } = req.body;
    const { email, salaoId } = filters;

    if (!email) {
      return res.json({
        error: true,
        message: "Informe o e-mail para filtrar.",
      });
    }

    // busca colaborador por email (case insensitive)
    const colaborador = await Colaborador.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    }).select("-senha -recipientId");

    if (!colaborador) {
      return res.json({ error: false, colaboradores: [] });
    }

    // vínculos do colaborador (pode ter vários)
    const queryVinculos = { colaboradorId: colaborador._id, status: { $ne: "E" } };
    if (salaoId) queryVinculos.salaoId = salaoId;

    const vinculos = await SalaoColaborador.find(queryVinculos)
      .select("_id status dataCadastro salaoId colaboradorId")
      .sort({ dataCadastro: -1 });

    if (!vinculos.length) {
      return res.json({ error: false, colaboradores: [] });
    }

    const especialidades = await ColaboradorServico.find({
      colaboradorId: colaborador._id,
    }).populate({
      path: "servicoId",
      select: "_id nome titulo",
    });

    const especialidadesIds = especialidades
      .filter((item) => item.servicoId)
      .map((item) => item.servicoId._id);

    return res.json({
      error: false,
      colaboradores: [
        {
          ...colaborador._doc,

          // NOVO: array de vínculos
          vinculos: vinculos.map((v) => ({
            vinculoId: v._id,
            status: v.status,
            salaoId: v.salaoId,
            dataCadastro: v.dataCadastro,
          })),

          especialidades: especialidadesIds,
        },
      ],
    });
  } catch (err) {
    return res.json({ error: true, message: err.message });
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
      .select("colaboradorId dataCadastro status salaoId"); // apenas os campos de vinculo que quero no retorno

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

        // NOVO padrão
        vinculos: [
          {
            vinculoId: vinculo._id,
            status: vinculo.status,
            salaoId: vinculo.salaoId,
            dataCadastro: vinculo.dataCadastro,
          },
        ],

        especialidades: vinculo.especialidades,
      })),
    });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para retornar o colaborador checar se colaborador existe
router.get("/check/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { salaoId } = req.query;

    const colaborador = await Colaborador.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    }).select("-senha -recipientId");

    if (!colaborador) {
      return res.json({ error: false, colaborador: null });
    }

    let vinculo = null;
    if (salaoId) {
      vinculo = await SalaoColaborador.findOne({
        salaoId,
        colaboradorId: colaborador._id,
        status: { $ne: "E" },
      }).select("_id status dataCadastro");
    }

    const especialidades = await ColaboradorServico.find({
      colaboradorId: colaborador._id,
    }).populate("servicoId", "_id nome");

    const especialidadesIds = especialidades
      .filter((e) => e.servicoId)
      .map((e) => e.servicoId._id);

    return res.json({
      error: false,
      colaborador: {
        ...colaborador._doc,
        vinculoId: vinculo?._id || "",
        vinculo: vinculo?.status || "A",
        especialidades: especialidadesIds,
        dataCadastro: vinculo?.dataCadastro || null,
      },
    });
  } catch (err) {
    return res.json({ error: true, message: err.message });
  }
});

module.exports = router;
