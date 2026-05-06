const express = require("express");
const router = express.Router();
const turf = require("@turf/turf");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const Salao = require("../models/salao");
const Servico = require("../models/servico");
const Horario = require("../models/horario");
const Arquivo = require("../models/arquivo");
const util = require("../util");

// ajuste o caminho conforme seu projeto
const { uploadToS3, deleteFileS3 } = require("../services/aws");

// ------------------------
// helpers
// ------------------------
function getBodyValue(body, key, fallback = "") {
  return body?.[key] ?? fallback;
}

function pickAllowedFields(body = {}) {
  return {
    nome: body.nome,
    email: body.email,
    telefone: body.telefone,
    endereco: {
      logradouro: body?.endereco?.logradouro ?? getBodyValue(body, "endereco[logradouro]", ""),
      bairro: body?.endereco?.bairro ?? getBodyValue(body, "endereco[bairro]", ""),
      cidade: body?.endereco?.cidade ?? getBodyValue(body, "endereco[cidade]", ""),
      uf: body?.endereco?.uf ?? getBodyValue(body, "endereco[uf]", ""),
      cep: body?.endereco?.cep ?? getBodyValue(body, "endereco[cep]", ""),
      numero: body?.endereco?.numero ?? getBodyValue(body, "endereco[numero]", ""),
      pais: body?.endereco?.pais ?? getBodyValue(body, "endereco[pais]", ""),
    },
    geo: {
      tipo: body?.geo?.tipo ?? getBodyValue(body, "geo[tipo]", "Point"),
      coordinates: (() => {
        if (Array.isArray(body?.geo?.coordinates)) return body.geo.coordinates;
        const c0 = getBodyValue(body, "geo[coordinates][0]", "");
        const c1 = getBodyValue(body, "geo[coordinates][1]", "");
        if (c0 !== "" && c1 !== "") return [Number(c0), Number(c1)];
        return [];
      })(),
    },
  };
}

function normalizeKeyFromUrlOrKey(value = "") {
  if (!value) return "";
  if (!value.startsWith("http")) return value;

  // se estiver salvo como URL completa
  const bucketUrl = process.env.AWS_BUCKET_URL || "";
  if (bucketUrl && value.startsWith(bucketUrl)) {
    return value.replace(`${bucketUrl}/`, "");
  }

  try {
    const url = new URL(value);
    return url.pathname.replace(/^\//, "");
  } catch {
    return value;
  }
}

function buildS3Path({ salaoId, fieldName, originalName }) {
  const ext = path.extname(originalName || "").toLowerCase() || ".jpg";
  return `saloes/${salaoId}/${fieldName}-${Date.now()}-${uuidv4()}${ext}`;
}

// Upload de 1 arquivo (foto/capa)
async function handleUploadField({ file, salaoId, fieldName }) {
  if (!file) return { error: false, caminho: null };

  const filename = buildS3Path({
    salaoId,
    fieldName,
    originalName: file.name,
  });

  const uploaded = await uploadToS3(file, filename); // usa seu helper
  if (uploaded.error) return uploaded;

  return { error: false, caminho: filename };
}

// ------------------------
// POST /salao
// ------------------------
router.post("/", async (req, res) => {
  try {
    const payload = pickAllowedFields(req.body);
    const salao = await new Salao(payload).save();

    // req.files pode vir undefined
    const fotoFile = req?.files?.foto || null;
    const capaFile = req?.files?.capa || null;

    if (fotoFile) {
      const upFoto = await handleUploadField({
        file: fotoFile,
        salaoId: salao._id,
        fieldName: "foto",
      });

      if (upFoto.error) {
        return res.status(400).json({ error: true, message: upFoto.message });
      }

      salao.foto = upFoto.caminho;

      await Arquivo.create({
        model: "Salao",
        referenciaId: salao._id,
        caminho: upFoto.caminho,
      });
    }

    if (capaFile) {
      const upCapa = await handleUploadField({
        file: capaFile,
        salaoId: salao._id,
        fieldName: "capa",
      });

      if (upCapa.error) {
        return res.status(400).json({ error: true, message: upCapa.message });
      }

      salao.capa = upCapa.caminho;

      await Arquivo.create({
        model: "Salao",
        referenciaId: salao._id,
        caminho: upCapa.caminho,
      });
    }

    await salao.save();

    return res.status(201).json({
      error: false,
      salao,
    });
  } catch (err) {
    return res.status(400).json({
      error: true,
      message: err.message,
    });
  }
});

// ------------------------
// PUT /salao/:id
// ------------------------
router.put("/:id", async (req, res) => {
  try {
    const salao = await Salao.findById(req.params.id);
    if (!salao) {
      return res.status(404).json({
        error: true,
        message: "Salão não encontrado.",
      });
    }

    const payload = pickAllowedFields(req.body);

    // campos textuais
    salao.nome = payload.nome ?? salao.nome;
    salao.email = payload.email ?? salao.email;
    salao.telefone = payload.telefone ?? salao.telefone;
    salao.endereco = payload.endereco ?? salao.endereco;
    salao.geo = payload.geo ?? salao.geo;

    const fotoFile = req?.files?.foto || null;
    const capaFile = req?.files?.capa || null;

    if (fotoFile) {
      // remove antiga do S3
      if (salao.foto) {
        await deleteFileS3(normalizeKeyFromUrlOrKey(salao.foto));
      }

      const upFoto = await handleUploadField({
        file: fotoFile,
        salaoId: salao._id,
        fieldName: "foto",
      });

      if (upFoto.error) {
        return res.status(400).json({ error: true, message: upFoto.message });
      }

      salao.foto = upFoto.caminho;

      await Arquivo.create({
        model: "Salao",
        referenciaId: salao._id,
        caminho: upFoto.caminho,
      });
    }

    if (capaFile) {
      if (salao.capa) {
        await deleteFileS3(normalizeKeyFromUrlOrKey(salao.capa));
      }

      const upCapa = await handleUploadField({
        file: capaFile,
        salaoId: salao._id,
        fieldName: "capa",
      });

      if (upCapa.error) {
        return res.status(400).json({ error: true, message: upCapa.message });
      }

      salao.capa = upCapa.caminho;

      await Arquivo.create({
        model: "Salao",
        referenciaId: salao._id,
        caminho: upCapa.caminho,
      });
    }

    await salao.save();

    return res.json({
      error: false,
      salao,
    });
  } catch (err) {
    return res.status(400).json({
      error: true,
      message: err.message,
    });
  }
});

// ------------------------
// GET /salao/servicos/:salaoId
// ------------------------
router.get("/servicos/:salaoId", async (req, res) => {
  try {
    const { salaoId } = req.params;
    const servicos = await Servico.find({
      salaoId,
      status: "A",
    }).select("_id titulo");

    return res.json({
      error: false,
      servicos: servicos.map((s) => ({ label: s.titulo, value: s._id })),
    });
  } catch (err) {
    return res.status(400).json({
      error: true,
      message: err.message,
    });
  }
});

// ------------------------
// GET /salao/:id
// ------------------------
router.get("/:id", async (req, res) => {
  try {
    const salao = await Salao.findById(req.params.id).select(
      "nome email foto capa telefone endereco geo dataCadastro"
    );

    if (!salao) {
      return res.status(404).json({
        error: true,
        message: "Salão não encontrado.",
      });
    }

    const arquivos = await Arquivo.find({
      model: "Salao",
      referenciaId: salao._id,
    });

    let distance = null;
    const hasGeo =
      Array.isArray(salao?.geo?.coordinates) &&
      salao.geo.coordinates.length === 2;

    if (hasGeo) {
      distance = turf.distance(
        turf.point(salao.geo.coordinates),
        turf.point([-22.551, -47.417])
      );
    }

    const horarios = await Horario.find({
      salaoId: req.params.id,
    }).select("dias inicio fim");

    const isOpened = util.isOpened(horarios);

    return res.json({
      error: false,
      salao: { ...salao._doc, distance, isOpened, arquivos },
    });
  } catch (err) {
    return res.status(400).json({
      error: true,
      message: err.message,
    });
  }
});

module.exports = router;