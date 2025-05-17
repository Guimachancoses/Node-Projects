const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const mercadopg = require("../services/mercadopg");
const Cliente = require("../models/cliente");
const SalaoCliente = require("../models/relationship/salaoCliente");

// Rota para criar um cliente
router.post("/", async (req, res) => {
  const db = mongoose.connection;
  const session = await db.startSession();
  session.startTransaction();

  try {
    const { cliente, salaoId } = req.body;
    let newCliente = null;

    //console.log("Cliente request: ", cliente)

    const existenteCliente = await Cliente.findOne({
      $or: [{ email: cliente.email }, { telefone: cliente.telefone }],
    });

    if (!existenteCliente) {
      // 1. Salva o cliente no banco sem customerId ainda
      newCliente = await new Cliente({
        ...cliente,
        customerId: null,
      }).save({ session });

      // 1.1 Verifica se existe conta no MercadoPago
      const buscaAccountMpg = await mercadopg(
        `v1/customers/search`,
        { email: cliente.email },
        "get"
      );

      if (buscaAccountMpg.data.results.length === 0) {
        // 2. Cria no Mercado Pago
        const mercadoPgAccount = await mercadopg(
          "/v1/customers",
          {
            email: cliente.email,
            nome: cliente.nome,
            sobrenome: cliente.sobrenome,
            telefone: {
              area: cliente.telefone.area,
              numbero: cliente.telefone.numero,
            },
            identificacao: {
              tipoD: cliente.identificacao.tipoD,
              numero: cliente.identificacao.numero,
            },
            enderecoPadrao: cliente.enderecoPadrao,
            endereco: {
              cep: cliente.endereco.cep,
              nomeRua: cliente.endereco.nomeRua,
              numero: cliente.endereco.numero,
              cidade: {
                nome: cliente.endereco.cidade.nome,
              },
            },
          },
          "post"
        );

        // console.log(
        //   "response mercadoPgAccount:",
        //   JSON.stringify(mercadoPgAccount, null, 2)
        // );

        if (mercadoPgAccount.error) {
          throw new Error("Erro no Mercado Pago: " + mercadoPgAccount.message);
        }

        const customerId = mercadoPgAccount.data.id;

        // 3. Atualiza o cliente com o customerId
        newCliente.customerId = customerId;
        await newCliente.save({ session });
      } else {
        // console.log(
        //   "response buscaAccountMpg:",
        //   JSON.stringify(buscaAccountMpg, null, 2)
        // );

        const customerId = buscaAccountMpg.data.results.id;

        // 3. Atualiza o cliente com o customerId
        newCliente.customerId = customerId;
        await newCliente.save({ session });
      }
    }

    const clienteId = existenteCliente ? existenteCliente._id : newCliente._id;

    console.log(clienteId)

    const existentRelationship = await SalaoCliente.findOne({
      salaoId,
      clienteId,
      status: { $ne: "E" },
    });

    if (!existentRelationship) {
      await new SalaoCliente({
        salaoId,
        clienteId,
      }).save({ session });
    }

    if (existenteCliente) {
      await SalaoCliente.findOneAndUpdate(
        { salaoId, clienteId },
        { status: "A" },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    if (existenteCliente && existentRelationship) {
      res.json({ error: true, message: "Cliente já cadastrado." });
    } else {
      res.json({ error: false, clienteId: clienteId });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.json({ error: true, message: err.message });
    console.log("Erro: ", err.message)
  }
});

// Rota para filtrar clientes
router.post("/filter", async (req, res) => {
  try {
    const clientes = await Cliente.find(req.body.filters);
    res.json({ error: false, clientes });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para retornar todos os clientes de um determinado salão
router.get("/salao/:salaoId", async (req, res) => {
  try {
    const { salaoId } = req.params;

    // Recuperar vinculos
    const clientes = await SalaoCliente.find({
      salaoId,
      status: { $ne: "E" },
    })
      .populate("clienteId")
      .select("clienteId dataCadastro");

    const clientesFormatados = clientes
      .filter((vinculo) => vinculo.clienteId) // <-- Evita clientes nulos
      .map((vinculo) => ({
        ...vinculo.clienteId._doc,
        vinculoId: vinculo._id,
        dataCadastro: vinculo.dataCadastro,
      }));

    res.json({
      error: false,
      clientes: clientesFormatados,
    });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para deletar o vínculo do cliente com o salão
router.delete("/vinculo/:id", async (req, res) => {
  try {
    console.log("Deletando vínculo do cliente:", req.params.id);

    // Corrigido nome do campo e uso de findOne
    const vinculo = await SalaoCliente.findOne({ clienteId: req.params.id });

    if (!vinculo) {
      return res.json({ error: true, message: "Vínculo não encontrado" });
    }

    const result = await SalaoCliente.findOneAndUpdate(
      { clienteId: req.params.id },
      { status: "E" },
      { new: true }
    );

    if (!result) {
      return res.json({ error: true, message: "Erro ao excluir vínculo" });
    }

    res.json({ error: false, message: "Vínculo excluído com sucesso" });

  } catch (err) {
    console.error("Erro ao excluir vínculo:", err);
    res.json({ error: true, message: err.message });
  }
});


// Rota de atualização do cliente no banco de dados MongoDB
router.put("/:clienteId", async (req, res) => {
  try {
    const { clienteId } = req.params;
    const updateData = req.body;

    await Cliente.findByIdAndUpdate(clienteId, { $set: updateData });

    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

module.exports = router;
