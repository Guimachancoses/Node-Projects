import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";

import ListImage from "../../components/ListImage";
import SocialButtons from "../../components/SocialButtons";
import {
  checkUser,
  updateUser,
  setAlerta,
} from "../../store/modules/colaborador/actions";

import miniLogo from "../../assets/mini_logo.jpg";
import FaleConoscoLink from "../../components/FooterLinks/FaleConoscoLink";
import TermoServicoLink from "../../components/FooterLinks/TermoServicoLink";
import PoliticaPrivacidadeLink from "../../components/FooterLinks/PoliticaPrivacidadeLink";
import FooterSection from "../../components/FooterSection"

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const Login = () => {
  const dispatch = useDispatch();
  const alerta = useSelector((state) => state.colaborador.alerta);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { isSignedIn } = useUser();
  const { user } = useClerk();

  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";
  const imageUrl = user?.imageUrl ?? "";
  const emailAddress = user?.emailAddresses?.[0]?.emailAddress ?? "";

  useEffect(() => {
    if (!isSignedIn || !emailAddress) return;

    dispatch(
      updateUser({
        email: emailAddress,
        firstName,
        lastName,
        imageUrl,
      })
    );
    dispatch(checkUser());
  }, [isSignedIn, emailAddress, firstName, lastName, imageUrl, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica de login aqui
  };

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    dispatch(setAlerta({ ...alerta, open: false }));
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        backgroundImage: 'url("/images/salon-background.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      {/* Camada escura leve para legibilidade */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 0,
        }}
      />

      {/* Lado esquerdo (decorativo) - some em telas pequenas */}
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

      {/* Linha divisória - apenas desktop */}
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

      {/* Área de login */}
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 0.5,
              }}
            >
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
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                }}
              >
                Pro Agende
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                fullWidth
                label="Senha"
                type="password"
                variant="outlined"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Link href="#" variant="body2" sx={{ display: "block", mt: 1, mb: 2 }}>
                Esqueceu sua senha?
              </Link>

              <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 1 }}>
                Entrar
              </Button>
            </form>

            <Divider sx={{ my: 1.5 }}>ou</Divider>
            <SocialButtons />
          </Paper>
        </Container>
      </Box>

      {/* Footer responsivo */}
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
          bottom: { xs: 22, md: 12 }
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
        <Alert onClose={handleClose} severity={alerta?.tipo || "info"} sx={{ width: "100%" }}>
          {alerta?.mensagem || ""}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;