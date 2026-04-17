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
} from "@mui/material";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";

export default function Account() {
  const [birthDate, setBirthDate] = useState(null);
  const { user } = useUser();
  const { userId, isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const googleStatus = query.get("google"); // success | error | null

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
          Integração Google
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.85 }}>
          Conecte sua conta para sincronizar <strong>Google Agenda</strong> e{" "}
          <strong>Google Drive</strong>.
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

        <Button
          variant="contained"
          onClick={handleConnectGoogle}
          disabled={!isLoaded || !isSignedIn || !userId}
        >
          Sincronizar Google Agenda e Drive
        </Button>
      </Paper>
    </Container>
  );
}