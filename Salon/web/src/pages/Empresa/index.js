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
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ImageIcon from "@mui/icons-material/Image";
import PhotoCameraBackIcon from "@mui/icons-material/PhotoCameraBack";
import { useDispatch, useSelector } from "react-redux";

import {
  loadMyCompanyRequest,
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

const BUCKET_URL = import.meta.env.VITE_AWS_BUCKET_URL || "";

const buildImageUrl = (value = "") => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (!BUCKET_URL) return value;
  return `${BUCKET_URL.replace(/\/$/, "")}/${String(value).replace(/^\//, "")}`;
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

  const logoInputRef = useRef(null);
  const capaInputRef = useRef(null);
  const originalRef = useRef(null);

  useEffect(() => {
    dispatch(loadMyCompanyRequest());
  }, [dispatch]);

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

    setLogoPreview(buildImageUrl(empresa.foto || ""));
    setCapaPreview(buildImageUrl(empresa.capa || ""));
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
      !!capaFile
    );
  }, [normalizedCurrent, logoFile, capaFile]);

  const requiredFilled = companyForm.nome.trim() && companyForm.email.trim();
  const disableSave = form?.saving || !requiredFilled || !hasChanges;

  const handleSave = () => {
    if (!validateForm()) return;

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
      })
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={700}>
            Dados da Empresa
          </Typography>
          <Chip label="Cadastro do Salão" color="primary" variant="outlined" />
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
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
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="E-mail"
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
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
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
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Telefone"
              value={maskPhone9(phoneNumber)}
              onChange={(e) => setPhoneNumber(onlyDigits(e.target.value).slice(0, 9))}
              onBlur={() => validateField("telefone")}
              error={!!errors.telefone}
              helperText={errors.telefone}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
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
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="UF"
              value={(companyForm.endereco.uf || "").toUpperCase()}
              onChange={(e) => setEndereco("uf", e.target.value.toUpperCase().slice(0, 2))}
              onBlur={() => validateField("uf")}
              error={!!errors.uf}
              helperText={errors.uf}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Logradouro"
              value={companyForm.endereco.logradouro}
              onChange={(e) => setEndereco("logradouro", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Número"
              value={companyForm.endereco.numero}
              onChange={(e) => setEndereco("numero", e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Bairro"
              value={companyForm.endereco.bairro}
              onChange={(e) => setEndereco("bairro", e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Cidade"
              value={companyForm.endereco.cidade}
              onChange={(e) => setEndereco("cidade", e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="País"
              value={companyForm.endereco.pais}
              onChange={(e) => setEndereco("pais", e.target.value)}
            >
              <MenuItem value="Brasil">Brasil</MenuItem>
              <MenuItem value="Outro">Outro</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={logoPreview || ""}
                sx={{ width: 72, height: 72, border: "1px solid", borderColor: "divider" }}
              />
              <Box>
                <Typography fontWeight={600}>Logo da empresa</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ImageIcon />}
                  onClick={() => logoInputRef.current?.click()}
                >
                  Alterar logo
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                variant="rounded"
                src={capaPreview || ""}
                sx={{ width: 120, height: 72, border: "1px solid", borderColor: "divider" }}
              />
              <Box>
                <Typography fontWeight={600}>Capa</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PhotoCameraBackIcon />}
                  onClick={() => capaInputRef.current?.click()}
                >
                  Alterar capa
                </Button>
                <input
                  ref={capaInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleCapaChange}
                />
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Stack direction="row" justifyContent="flex-end" mt={3}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={disableSave}
            startIcon={form?.saving ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {form?.saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}