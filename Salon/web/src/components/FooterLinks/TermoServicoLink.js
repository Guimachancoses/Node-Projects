import React from "react";
import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const TermoServicoLink = () => (
  <Link
    component={RouterLink}
    to="/termos-de-servico"
    underline="hover"
    color="inherit"
    sx={{ fontSize: 13 }}
  >
    Termo de Serviço
  </Link>
);

export default TermoServicoLink;