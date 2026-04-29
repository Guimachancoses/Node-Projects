import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  TextField,
  Typography,
  Container,
  Paper,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Checkbox,
  ListItemText
} from "@mui/material";
// icons
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import RecentActorsIcon from "@mui/icons-material/RecentActors";
import SignpostIcon from "@mui/icons-material/Signpost";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ContentCutIcon from '@mui/icons-material/ContentCut';


import { updateMyAccountRequest, loadMyAccountRequest, allServicos } from "../../store/modules/colaborador/actions";

import {
  isValidName,
  isValidSobreName,
  isValidPhone9,
  isValidCep,
  isValidCpf,
  isValidCnpj,
  maskArea,
  maskPhone9,
  maskCep,
  maskCpf,
  maskCnpj,
  onlyDigits,
} from "../../utils/formValidators";
import { buscarEndereco } from "../../services/apiCep";

const API_BASE = "https://salon.fabrisportalhub.com.br";

export default function Account() {
  const dispatch = useDispatch();
  const { user: userRaw, form, servicos } = useSelector((state) => state.colaborador);
  const userStore = userRaw?.user ?? userRaw;

  const [errors, setErrors] = useState({});
  const [cepLoading, setCepLoading] = useState(false);
  const originalRef = useRef(null);
  const cepRequestIdRef = useRef(0);
  const ultimoCepBuscadoRef = useRef("");

  useEffect(() => {
    dispatch(allServicos());
  }, [dispatch]);

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");

  // WhatsApp states
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState("");
  const [waInfo, setWaInfo] = useState("");
  const [waQrImage, setWaQrImage] = useState(null);
  const [waQrCodeText, setWaQrCodeText] = useState(null);
  const [waDialogOpen, setWaDialogOpen] = useState(false);
  const [waStatus, setWaStatus] = useState("idle"); // idle | connecting | connected | disconnected | unknown
  const [showWaConnectedMsg, setShowWaConnectedMsg] = useState(true);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleErrorMsg, setGoogleErrorMsg] = useState("");
  const [googleInfoMsg, setGoogleInfoMsg] = useState("");

  const { user } = useUser();
  const { userId, isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const googleStatus = query.get("google");

  const fotoDefault = user?.imageUrl || userStore?.foto || userStore?.fotoUrl || "";
  const fotoExibicao = fotoFile ? fotoPreview : fotoDefault;

  const [accountForm, setAccountForm] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    sexo: "",
    telefone: { area: "", numero: "" },
    identificacao: { tipoD: "", numero: "" },
    endereco: { cep: "", logradouro: "", numero: "", bairro: "", cidade: { nome: "" } },
    especialidades: [],
  });

  // hidratar
  useEffect(() => {
    if (!userStore || (!userStore._id && !userStore.vinculoId)) return;

    const hydrated = {
      nome: userStore?.nome ?? "",
      sobrenome: userStore?.sobrenome ?? "",
      email: userStore?.email ?? (user?.emailAddresses?.[0]?.emailAddress ?? ""),
      sexo: userStore?.sexo ?? "",
      telefone: {
        area: userStore?.telefone?.area ?? "",
        numero: userStore?.telefone?.numero ?? "",
      },
      identificacao: {
        tipoD: userStore?.identificacao?.tipoD ?? "",
        numero: userStore?.identificacao?.numero ?? "",
      },
      endereco: {
        cep: userStore?.endereco?.cep ?? "",
        logradouro: userStore?.endereco?.logradouro ?? "",
        numero: userStore?.endereco?.numero ?? "",
        bairro: userStore?.endereco?.bairro ?? "",
        cidade: { nome: userStore?.endereco?.cidade?.nome ?? "" },
      },
      especialidades: (userStore?.especialidades || []).map(String),
    };

    setAccountForm(hydrated);
    originalRef.current = hydrated;
  }, [userStore, user]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!email) return;
    if (userStore?._id || userStore?.vinculoId) return;

    dispatch(loadMyAccountRequest(email));
  }, [dispatch, isLoaded, isSignedIn, email, userStore?._id, userStore?.vinculoId]);

  const handleAreaChange = (e) => {
    setTelefone("area", onlyDigits(e.target.value).slice(0, 2));
    setErrors((p) => ({ ...p, area: "" }));
  };

  const handlePhoneChange = (e) => {
    setTelefone("numero", onlyDigits(e.target.value).slice(0, 9));
    setErrors((p) => ({ ...p, telefone: "" }));
  };

  const handleDocChange = (e) => {
    setIdentificacao("numero", onlyDigits(e.target.value));
    setErrors((p) => ({ ...p, documento: "" }));
  };

  const handleCepChange = (e) => {
    const cep = onlyDigits(e.target.value).slice(0, 8);
    setEndereco("cep", cep);
    setErrors((p) => ({ ...p, cep: "" }));
    if (cep.length < 8) ultimoCepBuscadoRef.current = "";
  };

  const handleCepBlur = async () => {
    const cep = onlyDigits(accountForm?.endereco?.cep || "");
    if (!cep) return;

    if (!isValidCep(cep)) {
      setErrors((p) => ({ ...p, cep: "CEP deve conter 8 dígitos" }));
      return;
    }

    if (ultimoCepBuscadoRef.current === cep) return;
    ultimoCepBuscadoRef.current = cep;

    const reqId = ++cepRequestIdRef.current;
    setCepLoading(true);

    const endereco = await buscarEndereco(cep);

    if (reqId !== cepRequestIdRef.current) return;
    setCepLoading(false);

    if (!endereco) {
      setErrors((p) => ({ ...p, cep: "CEP não encontrado" }));
      return;
    }

    setErrors((p) => ({ ...p, cep: "" }));
    setAccountForm((prev) => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        cep,
        logradouro: endereco.logradouro || "",
        bairro: endereco.bairro || "",
        cidade: { ...prev.endereco.cidade, nome: endereco.localidade || "" },
      },
    }));
  };

  const checkGoogleStatus = useCallback(async () => {
    if (!userId && !email) return;

    try {
      const resp = await fetch(
        `${API_BASE}/oauth/google/status?userId=${encodeURIComponent(userId || "")}&email=${encodeURIComponent(email || "")}`
      );
      const data = await resp.json();
      if (!resp.ok) return;

      setIsGoogleConnected(Boolean(data?.connected));
    } catch (_) {
      // silencioso
    }
  }, [userId, email]);

  const handleConnectGoogle = () => {
    if (!isLoaded || !isSignedIn || !userId) return;

    setGoogleErrorMsg("");
    setGoogleInfoMsg("");

    const clientName = `${accountForm.nome} ${accountForm.sobrenome}`.trim() || "cliente";
    const url =
      `${API_BASE}/oauth/google/start` +
      `?userId=${encodeURIComponent(userId)}` +
      `&clientName=${encodeURIComponent(clientName)}` +
      `&returnTo=${encodeURIComponent("/account")}`;

    window.location.href = url;
  };

  const getWaFriendly = (status) => {
    switch (status) {
      case "connected":
        return { severity: "success", text: "WhatsApp conectado com sucesso." };
      case "connecting":
        return { severity: "info", text: "Aguardando leitura do QR Code no WhatsApp..." };
      case "disconnected":
        return { severity: "warning", text: "WhatsApp desconectado." };
      case "unknown":
        return { severity: "info", text: "Verificando status do WhatsApp..." };
      default:
        return null;
    }
  };

  const checkWhatsAppStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const resp = await fetch(
        `${API_BASE}/evolution/whatsapp/status?userId=${encodeURIComponent(userId)}`
      );
      const data = await resp.json();
      if (!resp.ok) return;

      const status = data?.status || "unknown";
      setWaStatus(status);

      if (data?.qrImage) setWaQrImage(data.qrImage);
      if (data?.qrCodeText) setWaQrCodeText(data.qrCodeText);
    } catch (_) {
      // silencioso
    }
  }, [userId]);

  const handleConnectWhatsApp = async () => {
    if (!isLoaded || !isSignedIn || !userId) return;

    setWaLoading(true);
    setWaError("");
    setWaInfo("");
    setWaQrImage(null);
    setWaQrCodeText(null);

    try {
      const resp = await fetch(`${API_BASE}/evolution/whatsapp/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      });

      const data = await resp.json();

      if (resp.status === 202) {
        setWaStatus("connecting");
        setWaInfo(data?.message || "Instância criada. Aguarde alguns segundos e escaneie o QR.");
        setWaDialogOpen(true);
        return;
      }

      if (!resp.ok) {
        throw new Error(data?.error || "Erro ao conectar WhatsApp");
      }

      const qrImage =
        data?.qrImage ||
        (data?.qrBase64
          ? data.qrBase64.startsWith("data:image")
            ? data.qrBase64
            : `data:image/png;base64,${data.qrBase64}`
          : null);

      setWaStatus(data?.status || "connecting");
      setWaQrImage(qrImage);
      setWaQrCodeText(data?.qrCodeText || null);
      setWaDialogOpen(true);
    } catch (err) {
      setWaError(err.message || "Não foi possível gerar o QR Code do WhatsApp.");
    } finally {
      setWaLoading(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!userId) return;

    setWaLoading(true);
    setWaError("");
    setWaInfo("");

    try {
      const resp = await fetch(`${API_BASE}/evolution/whatsapp/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || "Erro ao desconectar WhatsApp");
      }

      setWaStatus("disconnected");
      setWaQrImage(null);
      setWaQrCodeText(null);
      setWaDialogOpen(false);
      setWaInfo("WhatsApp desconectado com sucesso.");
    } catch (err) {
      setWaError(err.message || "Não foi possível desconectar o WhatsApp.");
    } finally {
      setWaLoading(false);
    }
  };

  // Status inicial ao entrar na página
  useEffect(() => {
    if (!userId) return;
    checkWhatsAppStatus();
  }, [userId, checkWhatsAppStatus]);

  // Polling enquanto modal aberto e ainda não conectado
  useEffect(() => {
    if (!waDialogOpen || !userId || waStatus === "connected") return;

    const id = setInterval(() => {
      checkWhatsAppStatus();
    }, 4000);

    checkWhatsAppStatus();
    return () => clearInterval(id);
  }, [waDialogOpen, userId, waStatus, checkWhatsAppStatus]);

  // Fechar o modal após conectar o whatsapp e limpar o qrcode
  useEffect(() => {
    // só fecha automaticamente quando estiver conectado
    if (!waDialogOpen || waStatus !== "connected") return;

    const timeoutId = setTimeout(() => {
      setWaDialogOpen(false);
      setWaQrImage(null);
      setWaQrCodeText(null);
      setWaInfo("");
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [waDialogOpen, waStatus]);

  const waFriendly = getWaFriendly(waStatus);
  const isWaConnected = waStatus === "connected";

  useEffect(() => {
    checkGoogleStatus();
  }, [checkGoogleStatus]);

  const handleDisconnectGoogle = async () => {
    if (!userId && !email) return;

    setGoogleLoading(true);
    setGoogleErrorMsg("");
    setGoogleInfoMsg("");

    try {
      const resp = await fetch(`${API_BASE}/oauth/google/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || "Erro ao desconectar Google");
      }

      setIsGoogleConnected(false);
      setGoogleInfoMsg("Google Agenda e Drive desconectados com sucesso.");
    } catch (err) {
      setGoogleErrorMsg(err.message || "Não foi possível desconectar Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (googleStatus === "success") {
      setGoogleInfoMsg("Conta Google conectada com sucesso.");
      checkGoogleStatus();
    }
    if (googleStatus === "error") {
      setGoogleErrorMsg("Não foi possível conectar sua conta Google.");
    }
  }, [googleStatus, checkGoogleStatus]);

  // Oculta mensagem "WhatsApp conectado com sucesso." após 5s
  useEffect(() => {
    if (waStatus !== "connected") {
      setShowWaConnectedMsg(true); // reseta para próximas conexões
      return;
    }

    const timeoutId = setTimeout(() => {
      setShowWaConnectedMsg(false);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [waStatus]);


  useEffect(() => {
    // só hidrata quando houver dados reais do colaborador
    if (!userStore || (!userStore._id && !userStore.vinculoId)) return;

    setAccountForm({
      nome: userStore?.nome ?? "",
      sobrenome: userStore?.sobrenome ?? "",
      email: userStore?.email ?? (user?.emailAddresses?.[0]?.emailAddress ?? ""),
      sexo: userStore?.sexo ?? "",
      telefone: {
        area: userStore?.telefone?.area ?? "",
        numero: userStore?.telefone?.numero ?? "",
      },
      identificacao: {
        tipoD: userStore?.identificacao?.tipoD ?? "",
        numero: userStore?.identificacao?.numero ?? "",
      },
      endereco: {
        cep: userStore?.endereco?.cep ?? "",
        logradouro: userStore?.endereco?.logradouro ?? "",
        numero: userStore?.endereco?.numero ?? "",
        bairro: userStore?.endereco?.bairro ?? "",
        cidade: {
          nome: userStore?.endereco?.cidade?.nome ?? "",
        },
      },
      especialidades: (userStore?.especialidades || []).map((x) => String(x)),
    });

  }, [userStore, user]);

  const setCampo = (key, value) => {
    setAccountForm((prev) => ({ ...prev, [key]: value }));
  };

  const setTelefone = (key, value) => {
    setAccountForm((prev) => ({
      ...prev,
      telefone: { ...prev.telefone, [key]: value },
    }));
  };

  const setIdentificacao = (key, value) => {
    setAccountForm((prev) => ({
      ...prev,
      identificacao: { ...prev.identificacao, [key]: value },
    }));
  };

  const setEndereco = (key, value) => {
    setAccountForm((prev) => ({
      ...prev,
      endereco: { ...prev.endereco, [key]: value },
    }));
  };

  const setCidade = (value) => {
    setAccountForm((prev) => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        cidade: { ...prev.endereco.cidade, nome: value },
      },
    }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSalvarConta = () => {
    dispatch(updateMyAccountRequest(accountForm, fotoFile));
  };

  useEffect(() => {
    return () => {
      if (fotoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

  const especialidadesValue = (accountForm?.especialidades || [])
    .map((e) => {
      if (typeof e === "string") return String(e);
      return String(e?.value || e?._id || e?.id || e?.servicoId || e?.servicoId?._id || "");
    })
    .filter(Boolean);

  const hasErrors = useMemo(
    () => Object.values(errors || {}).some(Boolean),
    [errors]
  );

  const requiredFilled = useMemo(() => Boolean(
    accountForm?.nome?.trim() &&
    accountForm?.sobrenome?.trim() &&
    onlyDigits(accountForm?.telefone?.area || "").length === 2 &&
    onlyDigits(accountForm?.telefone?.numero || "").length === 9 &&
    onlyDigits(accountForm?.endereco?.cep || "").length === 8 &&
    accountForm?.endereco?.logradouro?.trim() &&
    String(accountForm?.endereco?.numero ?? "").trim() &&
    accountForm?.endereco?.bairro?.trim() &&
    accountForm?.endereco?.cidade?.nome?.trim() &&
    accountForm?.identificacao?.tipoD?.trim() &&
    accountForm?.identificacao?.numero?.trim()
  ), [accountForm]);

  const normalize = (f = {}) => ({
    ...f,
    nome: (f.nome || "").trim(),
    sobrenome: (f.sobrenome || "").trim(),
    telefone: {
      area: onlyDigits(f?.telefone?.area || ""),
      numero: onlyDigits(f?.telefone?.numero || ""),
    },
    identificacao: {
      tipoD: f?.identificacao?.tipoD || "",
      numero: onlyDigits(f?.identificacao?.numero || ""),
    },
    endereco: {
      cep: onlyDigits(f?.endereco?.cep || ""),
      logradouro: (f?.endereco?.logradouro || "").trim(),
      numero: String(f?.endereco?.numero ?? "").trim(),
      bairro: (f?.endereco?.bairro || "").trim(),
      cidade: { nome: (f?.endereco?.cidade?.nome || "").trim() },
    },
    especialidades: (f?.especialidades || []).map(String).sort(),
  });

  const hasChanges = useMemo(() => {
    if (!originalRef.current) return false;
    return JSON.stringify(normalize(accountForm)) !== JSON.stringify(normalize(originalRef.current));
  }, [accountForm]);

  const disableSave = form?.saving || hasErrors || !requiredFilled || !hasChanges;

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
      {/* CARD PRINCIPAL - CONTA */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 1,
            mb: 2,
          }}
        >
          <Box>
            <Typography component="h1" variant="h5" fontWeight={700}>
              Olá, {accountForm.nome} {accountForm.sobrenome}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie seus dados de perfil e contato.
            </Typography>
          </Box>

          <Chip
            label={accountForm.email || email}
            color="primary"
            variant="outlined"
            sx={{ maxWidth: "100%" }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ position: "relative" }}>
          {/* Avatar no canto superior direito */}
          <Box
            sx={{
              position: { xs: "static", md: "absolute" },
              top: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              mb: { xs: 2, md: 0 },
            }}
          >
            <Avatar
              src={fotoExibicao}
              sx={{
                width: 110,
                height: 110,
                border: "3px solid",
                borderColor: "divider",
              }}
            />
            <Button
              size="small"
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
            >
              Editar foto
              <input hidden type="file" accept="image/*" onChange={handleFotoChange} />
            </Button>
          </Box>

          {/* Espaço à direita no desktop para não colidir com avatar */}
          <Box sx={{ pr: { xs: 0, md: 34 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Minha Conta
            </Typography>

            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome"
                  size="small"
                  placeholder="Digite seu nome"
                  variant="outlined"
                  value={accountForm?.nome}
                  onChange={(e) => setCampo("nome", e.target.value)}
                  onBlur={() =>
                    setErrors((p) => ({ ...p, nome: isValidName(accountForm.nome) ? "" : "Nome inválido" }))
                  }
                  error={!!errors.nome}
                  helperText={errors.nome}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon />
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

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sobrenome"
                  size="small"
                  value={accountForm.sobrenome}
                  onChange={(e) => setCampo("sobrenome", e.target.value)}
                  onBlur={() =>
                    setErrors((p) => ({ ...p, sobrenome: isValidSobreName(accountForm.sobrenome) ? "" : "Sobrenome inválido" }))
                  }
                  error={!!errors.sobrenome}
                  helperText={errors.sobrenome}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon />
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

              <Grid item xs={12} md={4}>
                <TextField
                  label="Área"
                  size="small"
                  value={maskArea(accountForm.telefone.area || "")}
                  onChange={handleAreaChange}
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

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Telefone"
                  size="small"
                  value={maskPhone9(accountForm.telefone.numero || "")}
                  onChange={handlePhoneChange}
                  onBlur={() =>
                    setErrors((p) => ({ ...p, telefone: isValidPhone9(accountForm.telefone.numero) ? "" : "Telefone deve ter 9 dígitos" }))
                  }
                  error={!!errors.telefone}
                  helperText={errors.telefone}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneAndroidIcon />
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

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sexo</InputLabel>
                  <Select
                    value={accountForm.sexo || ""}
                    label="Sexo"
                    onChange={(e) => setCampo("sexo", e.target.value)}
                    sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
                  >
                    <MenuItem value="M">Masculino</MenuItem>
                    <MenuItem value="F">Feminino</MenuItem>
                    <MenuItem value="O">Outro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo doc</InputLabel>
                  <Select
                    value={accountForm.identificacao.tipoD || ""}
                    label="Tipo doc"
                    onChange={(e) => setIdentificacao("tipoD", e.target.value)}
                    sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          fontSize: "0.8rem", // Aplica no dropdown
                        },
                      },
                    }}
                  >
                    <MenuItem value="CPF">CPF</MenuItem>
                    <MenuItem value="CNPJ">CNPJ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Documento"
                  size="small"
                  value={
                    accountForm.identificacao.tipoD === "CNPJ"
                      ? maskCnpj(accountForm.identificacao.numero || "")
                      : maskCpf(accountForm.identificacao.numero || "")
                  }
                  onChange={handleDocChange}
                  onBlur={() => {
                    const tipo = accountForm.identificacao.tipoD;
                    const numero = accountForm.identificacao.numero || "";
                    const ok = tipo === "CNPJ" ? isValidCnpj(numero) : isValidCpf(numero);
                    setErrors((p) => ({ ...p, documento: ok ? "" : `${tipo || "Documento"} inválido` }));
                  }}
                  error={!!errors.documento}
                  helperText={errors.documento}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <RecentActorsIcon />
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

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="CEP"
                  size="small"
                  value={maskCep(accountForm.endereco.cep || "")}
                  onChange={handleCepChange}
                  onBlur={handleCepBlur}
                  error={!!errors.cep}
                  helperText={errors.cep || (cepLoading ? "Consultando CEP..." : "")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SignpostIcon />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                    maxLength: 9, // Adicionando o maxLength para limitar a entrada
                  }}
                />
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  size="small"
                  label="Rua"
                  value={accountForm.endereco.logradouro}
                  onChange={(e) => setEndereco("logradouro", e.target.value)}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Número"
                  value={accountForm.endereco.numero}
                  onChange={(e) => setEndereco("numero", e.target.value)}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Bairro"
                  size="small"
                  value={accountForm.endereco.bairro}
                  onChange={(e) => setEndereco("bairro", e.target.value)}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Cidade"
                  value={accountForm.endereco.cidade.nome}
                  onChange={(e) => setCidade(e.target.value)}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{
                width: "100%",
                "@media (min-width:600px)": {
                  width: "calc(80% + 60px)", // aumenta só esse campo
                  mr: "-60px",
                },
              }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="especialidades-account-label">Especialidades</InputLabel>
                  <Select
                    labelId="especialidades-account-label"
                    multiple
                    label="Especialidades"
                    startAdornment={
                      <InputAdornment position="start">
                        <ContentCutIcon />
                      </InputAdornment>
                    }
                    value={especialidadesValue}
                    onChange={(e) =>
                      setAccountForm((prev) => ({
                        ...prev,
                        especialidades: (e.target.value || []).map((v) => String(v)),
                      }))
                    }
                    renderValue={(selected) =>
                      (servicos || [])
                        .filter((s) => selected.includes(String(s.value || s._id || s.id)))
                        .map((s) => s.label || s.nome)
                        .join(", ")
                    }
                    sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          fontSize: "0.8rem", // Aplica no dropdown
                        },
                      },
                    }}
                  >
                    {(servicos || []).map((s) => {
                      const optionValue = String(s.value || s._id || s.id);
                      return (
                        <MenuItem key={optionValue} value={optionValue}>
                          <Checkbox checked={especialidadesValue.includes(optionValue)} />
                          <ListItemText primary={s.label || s.nome} />
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-start" }}>
              <Button
                variant="contained"
                onClick={handleSalvarConta}
                disabled={disableSave}
              >
                {form?.saving ? <CircularProgress size={20} /> : "Salvar dados da conta"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* CARD INTEGRAÇÕES */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Integrações
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.85 }}>
          Conecte sua agenda e drive do Google para acompanhar os agendamentos, e o WhatsApp para usar o chatbot.
        </Typography>

        {waFriendly && (waStatus !== "connected" || showWaConnectedMsg) && (
          <Alert severity={waFriendly.severity} sx={{ mb: 2 }}>
            {waFriendly.text}
          </Alert>
        )}
        {waInfo && <Alert severity="info" sx={{ mb: 2 }}>{waInfo}</Alert>}
        {waError && <Alert severity="error" sx={{ mb: 2 }}>{waError}</Alert>}
        {googleInfoMsg && <Alert severity="success" sx={{ mb: 2 }}>{googleInfoMsg}</Alert>}
        {googleErrorMsg && <Alert severity="error" sx={{ mb: 2 }}>{googleErrorMsg}</Alert>}

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="contained"
              color={isGoogleConnected ? "error" : "primary"}
              onClick={isGoogleConnected ? handleDisconnectGoogle : handleConnectGoogle}
              disabled={!isLoaded || !isSignedIn || !userId || googleLoading}
            >
              {googleLoading ? <CircularProgress size={20} /> : isGoogleConnected
                ? "Desconectar Google Agenda e Drive"
                : "Sincronizar Google Agenda e Drive"}
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant={isWaConnected ? "contained" : "outlined"}
              color={isWaConnected ? "error" : "primary"}
              onClick={isWaConnected ? handleDisconnectWhatsApp : handleConnectWhatsApp}
              disabled={!isLoaded || !isSignedIn || !userId || waLoading}
            >
              {waLoading ? <CircularProgress size={20} /> : isWaConnected
                ? "Desconectar WhatsApp"
                : "Sincronizar com WhatsApp"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Dialog open={waDialogOpen} onClose={() => setWaDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Conectar WhatsApp</DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          {waFriendly && (
            <Alert severity={waFriendly.severity} sx={{ mb: 2, mt: 1, textAlign: "left" }}>
              {waFriendly.text}
            </Alert>
          )}

          {waQrImage ? (
            <img
              src={waQrImage}
              alt="QR Code WhatsApp"
              style={{ width: 280, maxWidth: "100%", marginTop: 8 }}
            />
          ) : waQrCodeText ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              QR textual recebido (sem imagem).
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ mt: 1 }}>
              QR Code indisponível no momento.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWaDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}