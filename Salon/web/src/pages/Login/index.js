import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import { useUser } from "@clerk/clerk-react";
import ListImage from "../../components/ListImage";
import SocialButtons from "../../components/SocialButtons";

import miniLogo from "../../assets/mini_logo.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      navigate("/agendamentos");
    } else {
      navigate("/");
    }
  }, [isSignedIn, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica de login aqui
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        backgroundImage: 'url("/images/salon-background.jpg")', // Adicione sua imagem
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          left: "26%",
          transform: "translateX(-50%)",
          marginTop: "20vh",
        }}
      >
        <ListImage />
      </Box>
      {/* Linha branca vertical brilhante */}
      <Box
        sx={{
          position: "absolute",
          right: "calc(5% + 650px)", // 200px da margem direita do Container + largura do Container (sm = 600px - 150px de margem)
          top: 0,
          bottom: 0,
          width: "2px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)",
          boxShadow: "0 0 10px rgba(255,255,255,0.5)",
        }}
      />
      <Container maxWidth="sm" sx={{ marginLeft: "auto", marginRight: "5%" }}>
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            marginTop: "15vh",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
            }}
          >
            <Avatar
              src={miniLogo}
              alt="Parrudus Barbearia"
              sx={{
                width: "10%",
                height: "auto",
                border: "2px solid",
                borderColor: "var(--Gold)",
                marginRight: "10px",
              }}
            />
            <Typography
              variant="h5"
              component="h1"
              align="center"
              gutterBottom
              sx={{ color: "var(--primary)" }}
            >
              Parrudus Barbearia
            </Typography>
          </div>

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

            <Link
              href="#"
              variant="body2"
              sx={{ display: "block", mt: 1, mb: 2 }}
            >
              Esqueceu sua senha?
            </Link>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 2 }}
            >
              Entrar
            </Button>
          </form>

          <Divider sx={{ my: 2 }}>ou</Divider>

          <SocialButtons />

          {/* <Typography variant="body2" align="center">
            Não possui uma conta?{' '}
            <Link href="#" variant="body2">
              Cadastre-se
            </Link>
          </Typography> */}
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
