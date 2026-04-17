import { useMemo, useState } from "react";
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

export default function Account() {
  const [birthDate, setBirthDate] = useState(null);

  // WhatsApp states
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState("");
  const [waInfo, setWaInfo] = useState("");
  const [waQrImage, setWaQrImage] = useState(null);
  const [waQrCodeText, setWaQrCodeText] = useState(null);
  const [waDialogOpen, setWaDialogOpen] = useState(false);

  const { user } = useUser();
  const { userId, isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const googleStatus = query.get("google");

  const handleConnectGoogle = () => {
    if (!isLoaded || !isSignedIn || !userId) return;

    const clientName = `${firstName} ${lastName}`.trim() || "cliente";
    const url =
      `https://salon.fabrisportalhub.com.br/oauth/google/start` +
      `?userId=${encodeURIComponent(userId)}` +
      `&clientName=${encodeURIComponent(clientName)}` +
      `&returnTo=${encodeURIComponent("/account")}`;

    window.location.href = url;
  };

  const handleConnectWhatsApp = async () => {
    if (!isLoaded || !isSignedIn || !userId) return;

    setWaLoading(true);
    setWaError("");
    setWaInfo("");
    setWaQrImage(null);
    setWaQrCodeText(null);

    try {
      const resp = await fetch("https://salon.fabrisportalhub.com.br/evolution/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await resp.json();

      // 202 = instância criada, QR ainda não pronto
      if (resp.status === 202) {
        setWaInfo(data?.message || "Instância em conexão. Tente novamente em alguns segundos.");
        return;
      }

      if (!resp.ok) {
        throw new Error(data?.error || "Erro ao conectar WhatsApp");
      }

      // Compatível com retorno novo e antigo
      const qrImage =
        data?.qrImage ||
        (data?.qrBase64
          ? data.qrBase64.startsWith("data:image")
            ? data.qrBase64
            : `data:image/png;base64,${data.qrBase64}`
          : null);

      setWaQrImage(qrImage);
      setWaQrCodeText(data?.qrCodeText || null);
      setWaDialogOpen(true);
    } catch (err) {
      setWaError(err.message || "Não foi possível gerar o QR Code do WhatsApp.");
    } finally {
      setWaLoading(false);
    }
  };

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
              renderInput={(params) => <TextField {...params} fullWidth margin="normal" required />}
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

        {googleStatus === "success" && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Conta Google conectada com sucesso.
          </Alert>
        )}
        {googleStatus === "error" && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Não foi possível conectar sua conta Google.
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

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={handleConnectGoogle}
            disabled={!isLoaded || !isSignedIn || !userId}
          >
            Sincronizar Google Agenda e Drive
          </Button>

          <Button
            variant="outlined"
            onClick={handleConnectWhatsApp}
            disabled={!isLoaded || !isSignedIn || !userId || waLoading}
          >
            {waLoading ? <CircularProgress size={20} /> : "Sincronizar com WhatsApp"}
          </Button>
        </Box>
      </Paper>

      <Dialog open={waDialogOpen} onClose={() => setWaDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Conectar WhatsApp</DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          {waQrImage ? (
            <img
              src={waQrImage}
              alt="QR Code WhatsApp"
              style={{ width: 280, maxWidth: "100%", marginTop: 8 }}
            />
          ) : waQrCodeText ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              QR textual recebido (sem imagem). Posso te passar fallback com gerador visual.
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