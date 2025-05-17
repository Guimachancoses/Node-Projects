const express = require("express");
const router = express.Router();
const aws = require("../services/aws");
const Arquivo = require("../models/arquivo");
const Servico = require("../models/servico");
const Horario = require("../models/horario");

// Rota de envio de servico e arquivos
router.post("/", async (req, res) => {
  let arquivos = [];
  try {
    const { salaoId, servico } = req.body;
    let errors = [];

    console.log("peguei: ", salaoId);

    // Processando os arquivos
    if (req.files && Object.keys(req.files).length > 0) {
      for (let key of Object.keys(req.files)) {
        const file = req.files[key];

        const nameParts = file.name.split(".");
        const fileName = `${new Date().getTime()}.${
          nameParts[nameParts.length - 1]
        }`;
        console.log("ainda estou com ele: ", salaoId);

        const path = `servicos/${salaoId}${fileName}`;

        const response = await aws.uploadToS3(file, path);
        if (response.error) {
          errors.push({ error: true, message: response.message });
        } else {
          arquivos.push(path);
        }
      }
    }

    // Se houver erros com os arquivos, remova os arquivos do S3
    if (errors.length > 0) {
      // Remover arquivos já enviados para o S3
      for (let path of arquivos) {
        await aws.deleteFileS3(path); // Certifique-se de que o método deleteFromS3 está implementado corretamente
      }
      return res.json(errors[0]);
    }

    let jsonServico = {};
    try {
      jsonServico = JSON.parse(servico);
      if (!jsonServico) {
        return res
          .status(400)
          .json({ error: true, message: "Campo 'servico' não foi enviado." });
      }
    } catch (e) {
      // Remover arquivos do S3 se houver erro no parsing
      for (let path of arquivos) {
        await aws.deleteFileS3(path);
      }
      return res.status(400).json({
        error: true,
        message: "Campo 'servico' inválido ou malformado.",
      });
    }

    // Adicionar o salaoId ao jsonServico antes de salvar
    jsonServico.salaoId = salaoId;

    // Salvar o serviço no banco
    const servicoCadastrado = await Servico(jsonServico).save();

    // Mapear arquivos para salvar no banco
    arquivos = arquivos.map((arquivo) => ({
      referenciaId: servicoCadastrado._id,
      model: "Servico",
      caminho: arquivo,
    }));

    // Inserir os arquivos no banco de dados
    await Arquivo.insertMany(arquivos);

    res.json({ servico: servicoCadastrado, arquivos });
  } catch (err) {
    // Em caso de erro, remover qualquer arquivo enviado ao S3
    for (let path of arquivos) {
      await aws.deleteFileS3(path); // Certifique-se de que o método deleteFromS3 está implementado corretamente
    }
    res.json({ error: true, message: err.message });
  }
});

// Rota para atualização
router.put("/:id", async (req, res) => {
  try {
    const { salaoId, servico } = req.body;
    let errors = [];
    let arquivos = [];

    if (req.files && Object.keys(req.files).length > 0) {
      for (let key of Object.keys(req.files)) {
        const file = req.files[key];

        const nameParts = file.name.split(".");
        const fileName = `${new Date().getTime()}.${
          nameParts[nameParts.length - 1]
        }`;
        const path = `servicos/${salaoId}${fileName}`;

        const response = await aws.uploadToS3(file, path);

        if (response.error) {
          errors.push({ error: true, message: response.message });
        } else {
          arquivos.push(path);
        }
      }
    }

    if (errors.length > 0) {
      return res.json(errors[0]);
    }

    // Criar serviço
    const jsonServico = JSON.parse(servico);
    await Servico.findByIdAndUpdate(req.params.id, jsonServico);

    // Criar arquivo
    arquivos = arquivos.map((arquivo) => ({
      referenciaId: req.params.id,
      model: "Servico",
      caminho: arquivo,
    }));

    await Arquivo.insertMany(arquivos);

    res.json({ error: false, arquivos });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para exibir todos os serviços e arquivos de um determinado salão
router.get("/salao/:salaoId", async (req, res) => {
  try {
    const { salaoId } = req.params;

    // 1. Buscar horários do salão que possuem colaboradores
    const horarios = await Horario.find({
      salaoId,
      colaboradores: { $exists: true, $not: { $size: 0 } },
    });

    // 2. Coletar todos os serviços (especialidades) usados nesses horários
    // const servicoIds = new Set();
    // horarios.forEach((horario) => {
    //   horario.especialidades.forEach((id) => servicoIds.add(id.toString()));
    // });

    // 3. Buscar os serviços válidos com esses IDs
    const servicos = await Servico.find({
      salaoId,
      status: { $ne: "E" },
      //_id: { $in: Array.from(servicoIds) },
    });

    // 4. Buscar os arquivos de cada serviço
    const servicosSalao = await Promise.all(
      servicos.map(async (servico) => {
        const arquivos = await Arquivo.find({
          model: "Servico",
          referenciaId: servico._id,
        });
        return { ...servico._doc, arquivos };
      })
    );

    res.json({ servicos: servicosSalao });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para exclusão dos arquivos
router.post("/delete-arquivo", async (req, res) => {
  try {
    const { key } = req.body;

    // Excluir aws
    await aws.deleteFileS3(key);

    // Excluir do MongoDB
    await Arquivo.findOneAndDelete({
      caminho: key,
    });

    res.json({ error: false });
  } catch (er) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para desvincular o serviço do salao
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Atualiza a flag do serviço no salão para 'E' (Excluido)
    await Servico.findByIdAndUpdate(id, { status: "E" });
    res.json({ error: false });
  } catch (er) {
    res.json({ error: true, message: err.message });
  }
});

module.exports = router;
