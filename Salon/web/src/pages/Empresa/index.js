import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ImageIcon from "@mui/icons-material/Image";
import PhotoCameraBackIcon from "@mui/icons-material/PhotoCameraBack";
import { useDispatch, useSelector } from "react-redux";
import consts from "../../consts";

import {
  updateMyCompanyRequest,
} from "../../store/modules/salao/actions";

import {
  onlyDigits,
  maskArea,
  maskPhone9,
  maskCep,
  isValidEmail,
  isValidName,
  isValidArea,
  isValidPhone9,
  isValidCep,
} from "../../utils/formValidators";

import { buscarEndereco } from "../../services/apiCep";

const initialForm = {
  nome: "",
  email: "",
  telefone: "",
  endereco: {
    logradouro: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    numero: "",
    pais: "Brasil",
  },
  geo: {
    tipo: "Point",
    coordinates: [],
  },
};

const normalizeForm = (form) => ({
  nome: (form?.nome || "").trim(),
  email: (form?.email || "").trim().toLowerCase(),
  telefone: onlyDigits(form?.telefone || ""),
  endereco: {
    logradouro: (form?.endereco?.logradouro || "").trim(),
    bairro: (form?.endereco?.bairro || "").trim(),
    cidade: (form?.endereco?.cidade || "").trim(),
    uf: (form?.endereco?.uf || "").trim().toUpperCase(),
    cep: onlyDigits(form?.endereco?.cep || ""),
    numero: (form?.endereco?.numero || "").trim(),
    pais: (form?.endereco?.pais || "").trim(),
  },
  geo: {
    tipo: form?.geo?.tipo || "Point",
    coordinates: Array.isArray(form?.geo?.coordinates) ? form.geo.coordinates : [],
  },
});

export default function Empresa() {
  const dispatch = useDispatch();
  const { empresa, form } = useSelector((state) => state.salao || {});

  const [companyForm, setCompanyForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [cepLoading, setCepLoading] = useState(false);

  // telefone no UI separado
  const [phoneArea, setPhoneArea] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // arquivos
  const [logoFile, setLogoFile] = useState(null);
  const [capaFile, setCapaFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [capaPreview, setCapaPreview] = useState("");
  const [apresentacaoFile, setApresentacaoFile] = useState(null);
  const [apresentacaoPreview, setApresentacaoPreview] = useState("");
  const apresentacaoInputRef = useRef(null);
  const [submitLocked, setSubmitLocked] = useState(false);

  const logoInputRef = useRef(null);
  const capaInputRef = useRef(null);
  const originalRef = useRef(null);

  const buildImageUrl = (value = "") => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;

    const base = (consts.bucketUrl || "").replace(/\/$/, "");
    if (!base) return "";

    return `${base}/${String(value).replace(/^\//, "")}`;
  };

  const pickLatestByType = (arquivos = [], tipo = "") => {
    const list = (arquivos || [])
      .filter((a) => (a?.caminho || "").includes(`${tipo}-`) || (a?.caminho || "").includes(`/${tipo}-`))
      .sort((a, b) => new Date(b.dataCadastro) - new Date(a.dataCadastro));

    return list[0]?.caminho || "";
  };

  console.log("empresa", empresa);

  useEffect(() => {
    if (!empresa) return;

    const telefoneDigits = onlyDigits(empresa.telefone || "");
    const area = telefoneDigits.slice(0, 2);
    const numero = telefoneDigits.slice(2, 11);

    const payload = {
      nome: empresa.nome || "",
      email: empresa.email || "",
      telefone: telefoneDigits,
      endereco: {
        logradouro: empresa.endereco?.logradouro || "",
        bairro: empresa.endereco?.bairro || "",
        cidade: empresa.endereco?.cidade || "",
        uf: empresa.endereco?.uf || "",
        cep: empresa.endereco?.cep || "",
        numero: empresa.endereco?.numero || "",
        pais: empresa.endereco?.pais || "Brasil",
      },
      geo: {
        tipo: empresa.geo?.tipo || "Point",
        coordinates: Array.isArray(empresa.geo?.coordinates) ? empresa.geo.coordinates : [],
      },
    };

    setCompanyForm(payload);
    setPhoneArea(area);
    setPhoneNumber(numero);
    originalRef.current = normalizeForm(payload);

    const logoPath = empresa?.logo || pickLatestByType(empresa?.arquivos, "logo");
    const capaPath = empresa?.capa || pickLatestByType(empresa?.arquivos, "capa");
    const apresentacaoPath =
      empresa?.apresentacao || pickLatestByType(empresa?.arquivos, "apresentacao");

    setLogoPreview(buildImageUrl(logoPath));
    setCapaPreview(buildImageUrl(capaPath));
    setApresentacaoPreview(buildImageUrl(apresentacaoPath));
  }, [empresa]);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      if (capaPreview?.startsWith("blob:")) URL.revokeObjectURL(capaPreview);
    };
  }, [logoPreview, capaPreview]);

  const setField = (field, value) =>
    setCompanyForm((prev) => ({ ...prev, [field]: value }));

  const setEndereco = (field, value) =>
    setCompanyForm((prev) => ({
      ...prev,
      endereco: { ...prev.endereco, [field]: value },
    }));

  const validateField = (field) => {
    let message = "";

    if (field === "nome" && !isValidName(companyForm.nome)) {
      message = "Informe um nome válido.";
    }
    if (field === "email" && !isValidEmail(companyForm.email)) {
      message = "E-mail inválido.";
    }
    if (field === "area" && phoneArea && !isValidArea(phoneArea)) {
      message = "DDD inválido.";
    }
    if (field === "telefone" && phoneNumber && !isValidPhone9(phoneNumber)) {
      message = "Telefone inválido (9 dígitos).";
    }
    if (field === "cep" && companyForm.endereco.cep && !isValidCep(companyForm.endereco.cep)) {
      message = "CEP inválido.";
    }
    if (field === "uf") {
      const uf = (companyForm.endereco.uf || "").trim();
      if (uf && uf.length !== 2) message = "UF deve ter 2 letras.";
    }

    setErrors((prev) => ({ ...prev, [field]: message }));
    return !message;
  };

  const validateForm = () => {
    const next = {};

    if (!isValidName(companyForm.nome)) next.nome = "Informe um nome válido.";
    if (!isValidEmail(companyForm.email)) next.email = "E-mail inválido.";

    if (phoneArea && !isValidArea(phoneArea)) next.area = "DDD inválido.";
    if (phoneNumber && !isValidPhone9(phoneNumber))
      next.telefone = "Telefone inválido (9 dígitos).";

    if (companyForm.endereco.cep && !isValidCep(companyForm.endereco.cep))
      next.cep = "CEP inválido.";

    if (companyForm.endereco.uf && String(companyForm.endereco.uf).trim().length !== 2)
      next.uf = "UF deve ter 2 letras.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCepBlur = async () => {
    const cepDigits = onlyDigits(companyForm.endereco.cep || "");
    if (!cepDigits) return;

    if (!isValidCep(cepDigits)) {
      setErrors((prev) => ({ ...prev, cep: "CEP inválido." }));
      return;
    }

    try {
      setCepLoading(true);
      const data = await buscarEndereco(cepDigits);

      if (!data) {
        setErrors((prev) => ({ ...prev, cep: "CEP não encontrado." }));
        return;
      }

      setErrors((prev) => ({ ...prev, cep: "" }));

      setCompanyForm((prev) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          cep: cepDigits,
          logradouro: data.logradouro || prev.endereco.logradouro || "",
          bairro: data.bairro || prev.endereco.bairro || "",
          cidade: data.localidade || prev.endereco.cidade || "",
          uf: (data.uf || prev.endereco.uf || "").toUpperCase(),
          pais: prev.endereco.pais || "Brasil",
        },
      }));
    } catch {
      setErrors((prev) => ({ ...prev, cep: "Erro ao buscar CEP." }));
    } finally {
      setCepLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCapaChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (capaPreview?.startsWith("blob:")) URL.revokeObjectURL(capaPreview);
    setCapaFile(file);
    setCapaPreview(URL.createObjectURL(file));
  };

  const handleApresentacaoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (apresentacaoPreview?.startsWith("blob:")) URL.revokeObjectURL(apresentacaoPreview);
    setApresentacaoFile(file);
    setApresentacaoPreview(URL.createObjectURL(file));
  };

  const mergedTelefone = useMemo(
    () => `${onlyDigits(phoneArea)}${onlyDigits(phoneNumber)}`,
    [phoneArea, phoneNumber]
  );

  const normalizedCurrent = useMemo(
    () =>
      normalizeForm({
        ...companyForm,
        telefone: mergedTelefone,
      }),
    [companyForm, mergedTelefone]
  );

  const hasChanges = useMemo(() => {
    const original = originalRef.current || normalizeForm(initialForm);
    return (
      JSON.stringify(normalizedCurrent) !== JSON.stringify(original) ||
      !!logoFile ||
      !!capaFile ||
      !!apresentacaoFile
    );
  }, [normalizedCurrent, logoFile, capaFile, apresentacaoFile]);

  const requiredFilled = companyForm.nome.trim() && companyForm.email.trim();
  const disableSave = form?.saving || !requiredFilled || !hasChanges;

  const handleSave = () => {
    if (submitLocked) return; // evita clique duplo
    if (!validateForm()) return;

    setSubmitLocked(true);

    dispatch(
      updateMyCompanyRequest({
        data: {
          ...companyForm,
          telefone: mergedTelefone,
          endereco: {
            ...companyForm.endereco,
            cep: onlyDigits(companyForm.endereco.cep),
            uf: (companyForm.endereco.uf || "").toUpperCase(),
          },
        },
        logoFile,
        capaFile,
        apresentacaoFile,
      })
    );
  };

  useEffect(() => {
    if (!form?.saving) {
      setSubmitLocked(false);
    }
  }, [form?.saving]);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* CARD 1: DADOS DA EMPRESA */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
          mb: 3,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={700}>
            Dados da Empresa
          </Typography>
          <Chip label="Cadastro do Salão" color="primary" variant="outlined" />
        </Stack>

        <Grid container spacing={2}>
          {/* nome */}
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              label="Nome da empresa"
              value={companyForm.nome}
              onChange={(e) => setField("nome", e.target.value)}
              onBlur={() => validateField("nome")}
              error={!!errors.nome}
              helperText={errors.nome}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon />
                  </InputAdornment>
                ),
              }}
              inputProps={{
                style: {
                  fontSize: "0.8rem", // Altere esse valor conforme quiser
                },
              }}
            />
          </Grid>

          {/* email */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="E-mail"
              size="small"
              variant="outlined"
              value={companyForm.email}
              onChange={(e) => setField("email", e.target.value)}
              onBlur={() => validateField("email")}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
              inputProps={{
                style: {
                  fontSize: "0.8rem", // Altere esse valor conforme quiser
                },
              }}
            />
          </Grid>

          {/* ddd */}
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              label="DDD"
              value={maskArea(phoneArea)}
              onChange={(e) => setPhoneArea(onlyDigits(e.target.value).slice(0, 2))}
              onBlur={() => validateField("area")}
              error={!!errors.area}
              helperText={errors.area}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalPhoneIcon />
                  </InputAdornment>
                ),
              }}
              inputProps={{
                style: {
                  fontSize: "0.8rem", // Altere esse valor conforme quiser
                },
              }}
            />
          </Grid>

          {/* telefone */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Telefone"
              size="small"
              variant="outlined"
              value={maskPhone9(phoneNumber)}
              onChange={(e) => setPhoneNumber(onlyDigits(e.target.value).slice(0, 9))}
              onBlur={() => validateField("telefone")}
              error={!!errors.telefone}
              helperText={errors.telefone}
              inputProps={{
                style: {
                  fontSize: "0.8rem", // Altere esse valor conforme quiser
                },
              }}
            />
          </Grid>

          {/* cep */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              label="CEP"
              value={maskCep(companyForm.endereco.cep)}
              onChange={(e) => setEndereco("cep", e.target.value)}
              onBlur={handleCepBlur}
              error={!!errors.cep}
              helperText={errors.cep || (cepLoading ? "Buscando endereço..." : "")}
              InputProps={{
                endAdornment: cepLoading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={18} />
                  </InputAdornment>
                ) : null,
              }}
              inputProps={{
                style: {
                  fontSize: "0.8rem", // Altere esse valor conforme quiser
                },
              }}
            />
          </Grid>

          {/* uf */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="UF"
              size="small"
              variant="outlined"
              value={(companyForm.endereco.uf || "").toUpperCase()}
              onChange={(e) => setEndereco("uf", e.target.value.toUpperCase().slice(0, 2))}
              onBlur={() => validateField("uf")}
              error={!!errors.uf}
              helperText={errors.uf}
              inputProps={{
                style: {
                  fontSize: "0.8rem", // Altere esse valor conforme quiser
                },
              }}
            />
          </Grid>

          {/* logradouro */}
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Logradouro"
              size="small"
              variant="outlined"
              value={companyForm.endereco.logradouro}
              onChange={(e) => setEndereco("logradouro", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnIcon />
                  </InputAdornment>
                ),
              }}
              inputProps={{
                style: {
                  fontSize: "0.8rem", // Altere esse valor conforme quiser
                },
              }}
            />
          </Grid>

          {/* numero */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              label="Número"
              value={companyForm.endereco.numero}
              onChange={(e) => setEndereco("numero", e.target.value)}
              inputProps={{
                style: {
                  fontSize: "0.8rem", // Altere esse valor conforme quiser
                },
              }}
            />
          </Grid>

          {/* bairro */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Bairro"
              size="small"
              variant="outlined"
              value={companyForm.endereco.bairro}
              onChange={(e) => setEndereco("bairro", e.target.value)}
              inputProps={{
                style: {
                  fontSize: "0.8rem", // Altere esse valor conforme quiser
                },
              }}
            />
          </Grid>

          {/* cidade */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              label="Cidade"
              value={companyForm.endereco.cidade}
              onChange={(e) => setEndereco("cidade", e.target.value)}
              inputProps={{
                style: {
                  fontSize: "0.8rem", // Altere esse valor conforme quiser
                },
              }}
            />
          </Grid>

          {/* pais */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Pais</InputLabel>
              <Select
                label="País"
                value={companyForm.endereco.pais}
                onChange={(e) => setEndereco("pais", e.target.value)}
                inputProps={{
                  style: {
                    fontSize: "0.8rem", // Altere esse valor conforme quiser
                  },
                }}
                sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
              >
                <MenuItem value="Brasil">Brasil</MenuItem>
                <MenuItem value="Outro">Outro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* CARD 2: IMAGENS DO NEGÓCIO */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
        }}
      >
        <Typography variant="h6" fontWeight={700} mb={2}>
          Imagens do Negócio
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={logoPreview || ""}
                sx={{ width: 72, height: 72, border: "1px solid", borderColor: "divider" }}
              />
              <Box>
                <Typography fontWeight={600}>Logo da empresa</Typography>
                <Button size="small" variant="outlined" startIcon={<ImageIcon />} onClick={() => logoInputRef.current?.click()}>
                  Alterar logo
                </Button>
                <input ref={logoInputRef} type="file" hidden accept="image/*" onChange={handleLogoChange} />
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                variant="rounded"
                src={capaPreview || ""}
                sx={{ width: 120, height: 72, border: "1px solid", borderColor: "divider" }}
              />
              <Box>
                <Typography fontWeight={600}>Capa</Typography>
                <Button size="small" variant="outlined" startIcon={<PhotoCameraBackIcon />} onClick={() => capaInputRef.current?.click()}>
                  Alterar capa
                </Button>
                <input ref={capaInputRef} type="file" hidden accept="image/*" onChange={handleCapaChange} />
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                variant="rounded"
                src={apresentacaoPreview || ""}
                sx={{ width: 120, height: 72, border: "1px solid", borderColor: "divider" }}
              />
              <Box>
                <Typography fontWeight={600}>Apresentação Mobile</Typography>
                <Button size="small" variant="outlined" onClick={() => apresentacaoInputRef.current?.click()}>
                  Alterar apresentação
                </Button>
                <input ref={apresentacaoInputRef} type="file" hidden accept="image/*" onChange={handleApresentacaoChange} />
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Stack direction="row" justifyContent="flex-end" mt={3}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={disableSave || submitLocked || form?.saving}
            startIcon={form?.saving ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {form?.saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}