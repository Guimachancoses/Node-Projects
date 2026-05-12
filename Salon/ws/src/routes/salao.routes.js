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
function pickAllowedFields(body = {}) {
  const c0 = body?.geo?.coordinates?.[0] ?? body["geo[coordinates][0]"];
  const c1 = body?.geo?.coordinates?.[1] ?? body["geo[coordinates][1]"];
  const hasGeo = c0 !== undefined && c0 !== "" && c1 !== undefined && c1 !== "";

  const payload = {
    nome: body.nome,
    email: body.email,
    status: (body.status || "A").toUpperCase(),
    telefone: {
      area: body?.telefone?.area ?? body["telefone[area]"] ?? "",
      numero: body?.telefone?.numero ?? body["telefone[numero]"] ?? "",
    },
    identificacao: {
      tipoD: body?.identificacao?.tipoD ?? body["identificacao[tipoD]"] ?? "",
      numero: body?.identificacao?.numero ?? body["identificacao[numero]"] ?? "",
    },
    endereco: {
      logradouro: body?.endereco?.logradouro ?? body["endereco[logradouro]"] ?? "",
      bairro: body?.endereco?.bairro ?? body["endereco[bairro]"] ?? "",
      cidade: body?.endereco?.cidade ?? body["endereco[cidade]"] ?? "",
      uf: body?.endereco?.uf ?? body["endereco[uf]"] ?? "",
      cep: body?.endereco?.cep ?? body["endereco[cep]"] ?? "",
      numero: body?.endereco?.numero ?? body["endereco[numero]"] ?? "",
      pais: body?.endereco?.pais ?? body["endereco[pais]"] ?? "",
    },
  };

  if (hasGeo) {
    payload.geo = {
      type: "Point",
      coordinates: [Number(c0), Number(c1)],
    };
  }

  return payload;
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
  const reqId = `POST_SALAO_${Date.now()}`;

  try {
    //console.log(`\n[${reqId}] ===== INÍCIO POST /salao =====`);
    //console.log(`[${reqId}] content-type:`, req.headers["content-type"]);

    // body bruto
    //console.log(`[${reqId}] req.body keys:`, Object.keys(req.body || {}));
    //console.log(`[${reqId}] req.body:`, req.body);

    // arquivos recebidos
    const filesInfo = Object.fromEntries(
      Object.entries(req.files || {}).map(([k, v]) => {
        const f = Array.isArray(v) ? v[0] : v;
        return [
          k,
          f
            ? { name: f.name, mimetype: f.mimetype, size: f.size }
            : null,
        ];
      })
    );
    //console.log(`[${reqId}] req.files:`, filesInfo);

    // mapeamento permitido
    const payload = pickAllowedFields(req.body);
    //console.log(`[${reqId}] payload mapeado:`, payload);

    // validação pré-save (muito útil)
    const salaoDoc = new Salao(payload);
    const validationError = salaoDoc.validateSync();
    if (validationError) {
      console.error(`[${reqId}] validateSync error:`, validationError);
      return res.status(400).json({
        error: true,
        message: "Erro de validação ao criar salão.",
        details: Object.values(validationError.errors || {}).map((e) => e.message),
      });
    }

    // save inicial
    const salao = await salaoDoc.save();
    //console.log(`[${reqId}] salão salvo inicial:`, salao._id);

    // arquivos
    const logoFile = req?.files?.logo || null;
    const capaFile = req?.files?.capa || null;
    const apresentacaoFile = req?.files?.apresentacao || null;

    if (logoFile) {
      //console.log(`[${reqId}] upload logo: início`);
      const upLogo = await handleUploadField({
        file: logoFile,
        salaoId: salao._id,
        fieldName: "logo",
      });
      //console.log(`[${reqId}] upload logo: retorno`, upLogo);

      if (upLogo.error) {
        //console.error(`[${reqId}] upload logo erro:`, upLogo.message);
        return res.status(400).json({ error: true, message: upLogo.message });
      }

      salao.logo = upLogo.caminho;
      await Arquivo.create({
        model: "Salao",
        referenciaId: salao._id,
        caminho: upLogo.caminho,
      });
      //console.log(`[${reqId}] upload logo: concluído`);
    }

    if (capaFile) {
      //console.log(`[${reqId}] upload capa: início`);
      const upCapa = await handleUploadField({
        file: capaFile,
        salaoId: salao._id,
        fieldName: "capa",
      });
      //console.log(`[${reqId}] upload capa: retorno`, upCapa);

      if (upCapa.error) {
        console.error(`[${reqId}] upload capa erro:`, upCapa.message);
        return res.status(400).json({ error: true, message: upCapa.message });
      }

      salao.capa = upCapa.caminho;
      await Arquivo.create({
        model: "Salao",
        referenciaId: salao._id,
        caminho: upCapa.caminho,
      });
      //console.log(`[${reqId}] upload capa: concluído`);
    }

    if (apresentacaoFile) {
      //console.log(`[${reqId}] upload apresentacao: início`);
      const upApresentacao = await handleUploadField({
        file: apresentacaoFile,
        salaoId: salao._id,
        fieldName: "apresentacao",
      });
      //console.log(`[${reqId}] upload apresentacao: retorno`, upApresentacao);

      if (upApresentacao.error) {
        //console.error(`[${reqId}] upload apresentacao erro:`, upApresentacao.message);
        return res.status(400).json({ error: true, message: upApresentacao.message });
      }

      salao.apresentacao = upApresentacao.caminho;
      await Arquivo.create({
        model: "Salao",
        referenciaId: salao._id,
        caminho: upApresentacao.caminho,
      });
      //console.log(`[${reqId}] upload apresentacao: concluído`);
    }

    await salao.save();
    //console.log(`[${reqId}] salão salvo final com arquivos`);
    //console.log(`[${reqId}] ===== FIM POST /salao SUCESSO =====\n`);

    return res.status(201).json({ error: false, salao });
  } catch (err) {
    // console.error(`\n[${reqId}] ===== ERRO POST /salao =====`);
    // console.error(`[${reqId}] name:`, err?.name);
    // console.error(`[${reqId}] message:`, err?.message);
    // console.error(`[${reqId}] code:`, err?.code);
    // console.error(`[${reqId}] stack:`, err?.stack);

    // if (err?.errors) {
    //   //console.error(`[${reqId}] mongoose errors detalhados:`);
    //   Object.entries(err.errors).forEach(([field, e]) => {
    //     //console.error(` - ${field}:`, e.message);
    //   });
    // }

    //console.error(`[${reqId}] ===== FIM ERRO =====\n`);

    return res.status(400).json({
      error: true,
      message: err.message || "Erro ao criar salão.",
      details: err?.errors
        ? Object.values(err.errors).map((e) => e.message)
        : undefined,
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
    salao.status = (req.body.status ?? salao.status ?? "A").toUpperCase();

    salao.telefone = {
      area:
        req.body?.telefone?.area ??
        req.body["telefone[area]"] ??
        salao.telefone?.area ??
        "",
      numero:
        req.body?.telefone?.numero ??
        req.body["telefone[numero]"] ??
        salao.telefone?.numero ??
        "",
    };

    salao.identificacao = {
      tipoD:
        req.body?.identificacao?.tipoD ??
        req.body["identificacao[tipoD]"] ??
        salao.identificacao?.tipoD ??
        "",
      numero:
        req.body?.identificacao?.numero ??
        req.body["identificacao[numero]"] ??
        salao.identificacao?.numero ??
        "",
    };

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
// GET /empresas
// ------------------------

router.get("/empresas", async (req, res) => {
  try {
    const { nome, email, cidade } = req.query;

    const query = {};

    if (nome?.trim()) {
      query.nome = { $regex: nome.trim(), $options: "i" };
    }

    if (email?.trim()) {
      query.email = { $regex: email.trim(), $options: "i" };
    }

    // cidade está dentro de endereco.cidade
    if (cidade?.trim()) {
      query["endereco.cidade"] = { $regex: cidade.trim(), $options: "i" };
    }

    const saloes = await Salao.find(query)
      .select("nome email telefone endereco logo capa apresentacao dataCadastro status identificacao")
      .sort({ dataCadastro: -1 });

    return res.json({ error: false, saloes });
  } catch (err) {
    return res.status(400).json({
      error: true,
      message: err.message || "Erro ao filtrar empresas.",
    });
  }
});

// ------------------------
// DELETE /empresas/:id
// ------------------------

router.delete("/empresas/:id", async (req, res) => {
  await Salao.findByIdAndDelete(req.params.id);
  await Arquivo.deleteMany({ referenciaId: req.params.id });
  return res.json({ error: false, message: "Removido com sucesso" });
});

// ------------------------
// GET /salao/:id
// ------------------------
router.get("/:id", async (req, res) => {
  try {
    const salao = await Salao.findById(req.params.id).select(
      "nome email logo apresentacao capa telefone endereco geo dataCadastro status identificacao"
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