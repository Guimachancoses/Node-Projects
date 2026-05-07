import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Divider,
  Link,
  Avatar,
  Snackbar,
  Slide,
  CircularProgress,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import ListImage from "../../components/ListImage";
import miniLogo from "../../assets/mini_logo.jpg";
import FaleConoscoLink from "../../components/FooterLinks/FaleConoscoLink";
import TermoServicoLink from "../../components/FooterLinks/TermoServicoLink";
import PoliticaPrivacidadeLink from "../../components/FooterLinks/PoliticaPrivacidadeLink";
import FooterSection from "../../components/FooterSection";
import { setAlerta } from "../../store/modules/colaborador/actions";
import { isValidEmail } from "../../utils/formValidators";
import capaFundo from "../../assets/capa_fundo.jpg";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const alerta = useSelector((state) => state.colaborador.alerta);
  const navigate = useNavigate();
  const { isLoaded, signIn } = useSignIn();
  const { setActive } = useClerk();

  const [step, setStep] = useState("email"); // email | reset
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const emailTrim = email.trim();
  const emailInvalid = emailTrim.length > 0 && !isValidEmail(emailTrim);

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    dispatch(setAlerta({ ...alerta, open: false }));
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    if (!emailTrim || !isValidEmail(emailTrim)) {
      dispatch(
        setAlerta({
          open: true,
          tipo: "warning",
          mensagem: "Digite um e-mail válido.",
        })
      );
      return;
    }

    try {
      setLoading(true);
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: emailTrim,
      });

      dispatch(
        setAlerta({
          open: true,
          tipo: "success",
          mensagem: "Código enviado para seu e-mail.",
        })
      );
      setStep("reset");
    } catch (err) {
      dispatch(
        setAlerta({
          open: true,
          tipo: "error",
          mensagem: err?.errors?.[0]?.longMessage || "Erro ao enviar código.",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    if (!code.trim() || newPassword.trim().length < 8) {
      dispatch(
        setAlerta({
          open: true,
          tipo: "warning",
          mensagem: "Informe o código e uma senha com no mínimo 8 caracteres.",
        })
      );
      return;
    }

    try {
      setLoading(true);
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: newPassword.trim(),
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        dispatch(
          setAlerta({
            open: true,
            tipo: "success",
            mensagem: "Senha alterada com sucesso!",
          })
        );
        navigate("/agendamentos", { replace: true });
      }
    } catch (err) {
      dispatch(
        setAlerta({
          open: true,
          tipo: "error",
          mensagem: err?.errors?.[0]?.longMessage  || "Código inválido ou expirado.",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        backgroundImage: `url(${capaFundo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          width: "45%",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <ListImage />
      </Box>

      <Box
        sx={{
          display: { xs: "none", lg: "block" },
          width: "2px",
          my: 6,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%)",
          boxShadow: "0 0 10px rgba(255,255,255,0.5)",
          zIndex: 1,
        }}
      />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 6, sm: 7, md: 8 },
          zIndex: 1,
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <Paper
            elevation={6}
            sx={{
              p: { xs: 2.5, sm: 3.5, md: 4 },
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "100%",
              borderRadius: { xs: 2, sm: 3 },
              backgroundColor: "rgba(255, 255, 255, 0.94)",
              backdropFilter: "blur(2px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              <Avatar
                src={miniLogo}
                alt="Pro Agende"
                sx={{
                  width: { xs: 36, sm: 42 },
                  height: { xs: 36, sm: 42 },
                  border: "2px solid",
                  borderColor: "var(--Gold)",
                  mr: 1.2,
                }}
              />
              <Typography
                component="h1"
                sx={{
                  color: "var(--primary)",
                  fontWeight: 700,
                  fontSize: { xs: "1.1rem", sm: "1.4rem" },
                }}
              >
                Recuperar senha
              </Typography>
            </Box>

            {step === "email" ? (
              <form onSubmit={handleSendCode}>
                <TextField
                  fullWidth
                  label="Email"
                  variant="outlined"
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={emailInvalid}
                  helperText={emailInvalid ? "Digite um email válido." : ""}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !emailTrim || emailInvalid}
                  sx={{ mt: 1 }}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {loading ? "Enviando..." : "Enviar código"}
                </Button>
                <p className="text-muted-foreground text-sm justify-center">Nós enviaremos um link em seu e-mail.</p>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <TextField
                  fullWidth
                  label="Código recebido por e-mail"
                  variant="outlined"
                  margin="normal"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />

                <TextField
                  fullWidth
                  label="Nova senha"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  helperText="Mínimo de 8 caracteres."
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !code.trim() || newPassword.trim().length < 8}
                  sx={{ mt: 1 }}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                 >
                  {loading ? "Alterando..." : "Alterar senha"}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  sx={{ mt: 1 }}
                  onClick={() => setStep("email")}
                >
                  Reenviar código
                </Button>
              </form>
            )}

            <Divider sx={{ my: 1.5 }} />

            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/login")}
              sx={{ alignSelf: "center" }}
            >
              Lembrou a senha? Entrar
            </Link>
          </Paper>
        </Container>
      </Box>

      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          px: 2,
          color: "#fff",
          zIndex: 2,
          textAlign: "center",
          bottom: { xs: 22, md: 12 },
        }}
      >
        <FaleConoscoLink />
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          |
        </Typography>
        <TermoServicoLink />
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          |
        </Typography>
        <PoliticaPrivacidadeLink />
        <FooterSection />
      </Box>

      <Snackbar
        open={!!alerta?.open}
        autoHideDuration={4000}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleClose} severity={alerta?.tipo} sx={{ width: "100%" }}>
          {alerta?.mensagem || ""}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ForgotPassword;