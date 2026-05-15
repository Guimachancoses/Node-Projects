// Estrutura padrão de rota
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const mercadopg = require("../services/mercadopg");
const Colaborador = require("../models/colaborador");
const SalaoColaborador = require("../models/relationship/salaoColaborador");
const ColaboradorServico = require("../models/relationship/colaboradorServico");
const aws = require("../services/aws");
const Arquivo = require("../models/arquivo");

// Rota de atualização do colaborador no banco de dados MongoDB e no MercadoPago
router.put("/:colaboradorId", async (req, res) => {
  try {
    const { colaboradorId } = req.params;

    // 🔥 suporta JSON e FormData
    const body =
      typeof req.body.colaborador === "string"
        ? JSON.parse(req.body.colaborador)
        : req.body;

    const { vinculo, vinculoId, salaoId, especialidades = [], ...perfil } = body;

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
        ...(salaoId ? { salaoId } : {}), // <-- agora troca empresa também
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

    const fotoFile = req.files?.foto;

    if (fotoFile) {
      const nameParts = fotoFile.name.split(".");
      const ext = nameParts[nameParts.length - 1];
      const fileName = `${Date.now()}.${ext}`;
      const path = `colaboradores/${colaboradorId}/foto-${fileName}`;

      const response = await aws.uploadToS3(fotoFile, path);

      if (response.error) {
        return res.json({ error: true, message: response.message });
      }

      uploadedPath = path;

      const bucketUrl = (process.env.AWS_BUCKET_URL || process.env.BUCKET_URL || "").replace(/\/$/, "");
      const fotoUrl = bucketUrl ? `${bucketUrl}/${path}` : path;

      updatePerfil.foto = fotoUrl;

      await Arquivo.create({
        referenciaId: colaboradorId,
        model: "Colaborador",
        caminho: path,
      });
    }

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
    let vinculos = [];

    if (salaoId) {
      // comportamento atual: vínculo específico do salão informado
      vinculo = await SalaoColaborador.findOne({
        salaoId,
        colaboradorId: colaborador._id,
        status: { $ne: "E" },
      })
        .select("_id status dataCadastro salaoId")
        .sort({ dataCadastro: -1 });
    } else {
      // novo: sem salaoId na query, busca todos vínculos ativos
      vinculos = await SalaoColaborador.find({
        colaboradorId: colaborador._id,
        status: { $ne: "E" },
      })
        .select("_id status dataCadastro salaoId")
        .sort({ dataCadastro: -1 });

      vinculo = vinculos[0] || null; // principal (mais recente)
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
        salaoId: vinculo?.salaoId || "", // <-- NOVO
        especialidades: especialidadesIds,
        dataCadastro: vinculo?.dataCadastro || null,

        // opcional, mas útil para multiempresa
        vinculos: (vinculos || []).map((v) => ({
          vinculoId: v._id,
          status: v.status,
          salaoId: v.salaoId,
          dataCadastro: v.dataCadastro,
        })),
      },
    });
  } catch (err) {
    return res.json({ error: true, message: err.message });
  }
});

// GET /colaborador/all
// Retorna todos os colaboradores com todos os vínculos ativos e especialidades
router.get("/all", async (req, res) => {
  try {
    // 1) Colaboradores base
    const colaboradores = await Colaborador.find({})
      .select("-senha -recipientId")
      .lean();

    if (!colaboradores.length) {
      return res.json({ error: false, colaboradores: [] });
    }

    const colaboradorIds = colaboradores.map((c) => c._id);

    // 2) Todos os vínculos ativos desses colaboradores
    const vinculos = await SalaoColaborador.find({
      colaboradorId: { $in: colaboradorIds },
      status: { $ne: "E" },
    })
      .select("_id status dataCadastro salaoId colaboradorId")
      .sort({ dataCadastro: -1 })
      .lean();

    // 3) Especialidades
    const especialidades = await ColaboradorServico.find({
      colaboradorId: { $in: colaboradorIds },
    })
      .populate("servicoId", "_id nome titulo")
      .lean();

    // 4) Agrupar vínculos por colaboradorId
    const vinculosPorColaborador = vinculos.reduce((acc, v) => {
      const key = String(v.colaboradorId);
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        vinculoId: v._id,
        status: v.status,
        salaoId: v.salaoId,
        dataCadastro: v.dataCadastro,
      });
      return acc;
    }, {});

    // 5) Agrupar especialidades por colaboradorId
    const especialidadesPorColaborador = especialidades.reduce((acc, e) => {
      const key = String(e.colaboradorId);
      if (!acc[key]) acc[key] = [];
      if (e.servicoId?._id) acc[key].push(e.servicoId._id);
      return acc;
    }, {});

    // 6) Montar resposta final
    const resultado = colaboradores.map((c) => {
      const key = String(c._id);
      return {
        ...c,
        vinculos: vinculosPorColaborador[key] || [],
        especialidades: [...new Set((especialidadesPorColaborador[key] || []).map(String))],
      };
    });

    return res.json({ error: false, colaboradores: resultado });
  } catch (err) {
    return res.json({ error: true, message: err.message });
  }
});

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
      // 1) cria colaborador
      newColaborador = await new Colaborador({
        ...colaborador,
        recipientId: null,
      }).save({ session });

      // 2) cria no Mercado Pago
      const mercadoPgAccount = await mercadopg(
        "/v1/customers",
        {
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
            cidade: { nome: colaborador.endereco.cidade.nome },
          },
        },
        "post"
      );

      if (mercadoPgAccount.error) {
        throw new Error("Erro no Mercado Pago: " + mercadoPgAccount.message);
      }

      newColaborador.recipientId = mercadoPgAccount.data.id;
      await newColaborador.save({ session });
    }

    const colaboradorId = existenteColaborador
      ? existenteColaborador._id
      : newColaborador._id;

    // vínculo ativo existente nesse salão
    const existentRelationship = await SalaoColaborador.findOne({
      salaoId,
      colaboradorId,
      status: { $ne: "E" },
    });

    // cria vínculo se não existir
    if (!existentRelationship) {
      await new SalaoColaborador({
        salaoId,
        colaboradorId,
        status: colaborador.vinculo || "A",
      }).save({ session });
    } else {
      // se existir, apenas garante status atualizado
      await SalaoColaborador.findByIdAndUpdate(
        existentRelationship._id,
        { status: colaborador.vinculo || existentRelationship.status || "A" },
        { session }
      );
    }

    // ✅ IMPORTANTE: só insere especialidades quando colaborador for novo
    // (evita duplicação quando POST for chamado para criar vínculos em outros salões)
    if (!existenteColaborador) {
      const especialidades = Array.isArray(colaborador.especialidades)
        ? [...new Set(colaborador.especialidades.map(String).filter(Boolean))]
        : [];

      if (especialidades.length) {
        await ColaboradorServico.insertMany(
          especialidades.map((servicoId) => ({
            servicoId,
            colaboradorId,
          })),
          { session }
        );
      }
    }

    await session.commitTransaction();
    session.endSession();

    // ✅ não tratar vínculo já existente como erro
    if (existenteColaborador && existentRelationship) {
      return res.json({
        error: false,
        message: "Vínculo já existente, mantido.",
        colaboradorId,
      });
    }

    return res.json({
      error: false,
      message: existenteColaborador
        ? "Vínculo criado com sucesso para colaborador existente."
        : "Colaborador cadastrado com sucesso.",
      colaboradorId,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.json({ error: true, message: err.message });
  }
});

module.exports = router;
