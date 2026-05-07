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

function buildS3Path({ salaoId, fieldName, originalName }) {
  const ext = path.extname(originalName || "").toLowerCase() || ".jpg";
  return `saloes/${salaoId}/${fieldName}-${Date.now()}-${uuidv4()}${ext}`;
}

// ajuda a lidar com req.files campo único/array
function getFile(req, field) {
  const f = req?.files?.[field];
  if (!f) return null;
  return Array.isArray(f) ? f[0] : f;
}

function keyFromUrlOrKey(value = "") {
  if (!value) return "";
  if (!value.startsWith("http")) return value;

  const bucketUrl = (process.env.AWS_BUCKET_URL || "").replace(/\/$/, "");
  if (bucketUrl && value.startsWith(bucketUrl)) {
    return value.replace(`${bucketUrl}/`, "");
  }

  try {
    const u = new URL(value);
    return u.pathname.replace(/^\//, "");
  } catch {
    return value;
  }
}

function buildFilename({ salaoId, tipo, originalName }) {
  const ext = path.extname(originalName || "").toLowerCase() || ".jpg";
  return `saloes/${salaoId}/${tipo}-${Date.now()}-${uuidv4()}${ext}`;
}

async function replaceSingleImage({ salao, tipo, file }) {
  if (!file) return;

  // 1) descobrir caminho antigo
  const oldKeyDirect = keyFromUrlOrKey(salao[tipo] || "");

  // fallback: se não estiver no campo direto, tenta achar no Arquivo
  let oldKey = oldKeyDirect;
  if (!oldKey) {
    const oldDoc = await Arquivo.findOne({
      model: "Salao",
      referenciaId: salao._id,
      caminho: { $regex: `${tipo}-` }, // logo-, capa-, apresentacao-
    }).sort({ dataCadastro: -1 });

    oldKey = oldDoc?.caminho || "";
  }

  // 2) remover antigo do S3 + referência(s)
  if (oldKey) {
    await deleteFileS3(oldKey);
    await Arquivo.deleteMany({
      model: "Salao",
      referenciaId: salao._id,
      caminho: oldKey,
    });
  }

  // remove possíveis registros antigos do mesmo tipo
  await Arquivo.deleteMany({
    model: "Salao",
    referenciaId: salao._id,
    caminho: { $regex: `${tipo}-` },
  });

  // 3) subir novo
  const filename = buildFilename({
    salaoId: salao._id,
    tipo,
    originalName: file.name,
  });

  const up = await uploadToS3(file, filename);
  if (up.error) throw new Error(up.message || `Erro ao subir ${tipo}`);

  // 4) salvar no model + Arquivo
  salao[tipo] = filename;

  await Arquivo.create({
    referenciaId: salao._id,
    model: "Salao",
    caminho: filename,
  });
}

// Upload de 1 arquivo (logo/capa/apresentacao)
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
    const logoFile = req?.files?.logo || null;
    const capaFile = req?.files?.capa || null;
    const apresentacaoFile = req?.files?.apresentacao || null;

    if (logoFile) {
      const upLogo = await handleUploadField({
        file: logoFile,
        salaoId: salao._id,
        fieldName: "logo",
      });

      if (upLogo.error) {
        return res.status(400).json({ error: true, message: upLogo.message });
      }

      salao.logo = upLogo.caminho;

      await Arquivo.create({
        model: "Salao",
        referenciaId: salao._id,
        caminho: upLogo.caminho,
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

    if (apresentacaoFile) {
      const upApresentacao = await handleUploadField({
        file: apresentacaoFile,
        salaoId: salao._id,
        fieldName: "apresentacao",
      });

      if (upApresentacao.error) {
        return res.status(400).json({ error: true, message: upApresentacao.message });
      }

      salao.apresentacao = upApresentacao.caminho;

      await Arquivo.create({
        model: "Salao",
        referenciaId: salao._id,
        caminho: upApresentacao.caminho,
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
      return res.status(404).json({ error: true, message: "Salão não encontrado." });
    }

    // campos textuais
    salao.nome = req.body.nome ?? salao.nome;
    salao.email = req.body.email ?? salao.email;
    salao.telefone = req.body.telefone ?? salao.telefone;

    salao.endereco = {
      logradouro: req.body?.endereco?.logradouro ?? req.body["endereco[logradouro]"] ?? salao.endereco?.logradouro,
      bairro: req.body?.endereco?.bairro ?? req.body["endereco[bairro]"] ?? salao.endereco?.bairro,
      cidade: req.body?.endereco?.cidade ?? req.body["endereco[cidade]"] ?? salao.endereco?.cidade,
      uf: req.body?.endereco?.uf ?? req.body["endereco[uf]"] ?? salao.endereco?.uf,
      cep: req.body?.endereco?.cep ?? req.body["endereco[cep]"] ?? salao.endereco?.cep,
      numero: req.body?.endereco?.numero ?? req.body["endereco[numero]"] ?? salao.endereco?.numero,
      pais: req.body?.endereco?.pais ?? req.body["endereco[pais]"] ?? salao.endereco?.pais,
    };

    // arquivos recebidos
    const logoFile = getFile(req, "logo");
    const capaFile = getFile(req, "capa");
    const apresentacaoFile = getFile(req, "apresentacao");

    if (logoFile) {
      await replaceSingleImage({ salao, tipo: "logo", file: logoFile });
    }
    if (capaFile) {
      await replaceSingleImage({ salao, tipo: "capa", file: capaFile });
    }
    if (apresentacaoFile) {
      await replaceSingleImage({ salao, tipo: "apresentacao", file: apresentacaoFile });
    }

    await salao.save();

    return res.json({ error: false, salao });
  } catch (err) {
    return res.status(400).json({ error: true, message: err.message });
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
      "nome email logo apresentacao capa telefone endereco geo dataCadastro"
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