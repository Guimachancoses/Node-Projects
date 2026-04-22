import { useMemo, useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";

const API_BASE = "https://salon.fabrisportalhub.com.br";

export default function Account() {
  const [birthDate, setBirthDate] = useState(null);

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
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const googleStatus = query.get("google");

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

    const clientName = `${firstName} ${lastName}`.trim() || "cliente";
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

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Olá, {firstName} {lastName}
        </Typography>

        <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
          <Typography variant="body2">Você está logado como:</Typography>
          <Typography variant="body2" sx={{ color: "var(--primary)", ml: 1 }}>
            {email}
          </Typography>
        </Box>

        <Box component="form" noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="firstName"
            label="Nome"
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            InputProps={{ readOnly: true }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="lastName"
            label="Sobrenome"
            name="lastName"
            autoComplete="family-name"
            value={lastName}
            InputProps={{ readOnly: true }}
          />

          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              label="Data de Nascimento"
              value={birthDate}
              onChange={(newValue) => setBirthDate(newValue)}
              renderInput={(params) => (
                <TextField {...params} fullWidth margin="normal" required />
              )}
            />
          </LocalizationProvider>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 1 }}>
          Integrações
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.85 }}>
          Conecte Google Agenda/Drive e WhatsApp.
        </Typography>

        {waFriendly && (waStatus !== "connected" || showWaConnectedMsg) && (
          <Alert severity={waFriendly.severity} sx={{ mb: 2 }}>
            {waFriendly.text}
          </Alert>
        )}

        {waInfo && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {waInfo}
          </Alert>
        )}

        {waError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {waError}
          </Alert>
        )}

        {googleInfoMsg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {googleInfoMsg}
          </Alert>
        )}

        {googleErrorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {googleErrorMsg}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Button
            variant="contained"
            color={isGoogleConnected ? "error" : "primary"}
            onClick={isGoogleConnected ? handleDisconnectGoogle : handleConnectGoogle}
            disabled={!isLoaded || !isSignedIn || !userId || googleLoading}
          >
            {googleLoading ? (
              <CircularProgress size={20} />
            ) : isGoogleConnected ? (
              "Desconectar Google Agenda e Drive"
            ) : (
              "Sincronizar Google Agenda e Drive"
            )}
          </Button>

          <Button
            variant={isWaConnected ? "contained" : "outlined"}
            color={isWaConnected ? "error" : "primary"}
            onClick={isWaConnected ? handleDisconnectWhatsApp : handleConnectWhatsApp}
            disabled={!isLoaded || !isSignedIn || !userId || waLoading}
          >
            {waLoading ? (
              <CircularProgress size={20} />
            ) : isWaConnected ? (
              "Desconectar WhatsApp"
            ) : (
              "Sincronizar com WhatsApp"
            )}
          </Button>
        </Box>
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