import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import BusinessIcon from "@mui/icons-material/Business";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import capaFundo from "../../assets/capa_fundo.png";

const FaleConosco = () => {
  const phoneRaw = "5519981955602";
  const phoneFormatted = "(19) 98195-5602";
  const email = "gmachancoses@gmail.com";

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        backgroundImage: `linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,.58)), url(${capaFundo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
      }}
    >
      <Container maxWidth="md" sx={{ py: 6, position: "relative" }}>
        {/* Botão voltar */}
        <Tooltip title="Voltar para início" justify="start" >
          <IconButton
            component={RouterLink}
            to="/"
            sx={{
              position: "fixed",
              top: 8,
              left: 8,
              zIndex: 9999,
              bgcolor: "linear-gradient(135deg,hsl(185, 80.50%, 22.20%) 0%, #0a3f44 100%)",
              "&:hover": { bgcolor: "#000" },
              boxShadow: 2,
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Card
          elevation={6}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(6px)",
          }}
        >
          {/* Cabeçalho */}
          <Box
            sx={{
              p: 3,
              color: "#fff",
              background: "linear-gradient(135deg,hsl(185, 80.50%, 22.20%) 0%, #0a3f44 100%)",
            }}
          >
            <Typography variant="h4" fontWeight={700}>
              Fale Conosco
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95, mt: 1 }}>
              Precisa de ajuda? Nossa equipe está pronta para te atender.
            </Typography>
          </Box>

          <CardContent sx={{ p: 3, background: "#000"}}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <BusinessIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    GuiMac Tech Solution Ltda
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Canais de atendimento
                    </Typography>

                    <Stack spacing={1.2}>
                      <Typography variant="body2">
                        <strong>Telefone / WhatsApp:</strong> {phoneFormatted}
                      </Typography>
                      <Typography variant="body2">
                        <strong>E-mail:</strong> {email}
                      </Typography>
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<WhatsAppIcon />}
                        href={`https://wa.me/${phoneRaw}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Chamar no WhatsApp
                      </Button>

                      <Button
                        variant="outlined"
                        startIcon={<EmailIcon />}
                        href={`mailto:${email}?subject=Suporte%20-%20Sistema`}
                      >
                        Enviar e-mail
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Informações úteis
                    </Typography>

                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">Atendimento em horário comercial.</Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <SupportAgentIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Suporte técnico e operacional da plataforma.
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <InfoOutlinedIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Para agilizar, informe: nome do salão, e-mail e descrição do problema.
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
                      <Chip size="small" label="Atendimento humano" color="primary" variant="outlined" />
                      <Chip size="small" label="Resposta rápida" color="success" variant="outlined" />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} GuiMac Tech Solution Ltda — Todos os direitos reservados.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default FaleConosco;