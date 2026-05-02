import React from "react";
import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const PoliticaPrivacidadeLink = () => (
  <Link
    component={RouterLink}
    to="/politica-de-privacidade"
    underline="hover"
    color="inherit"
    sx={{ fontSize: 13 }}
  >
    Política de Privacidade
  </Link>
);

export default PoliticaPrivacidadeLink;