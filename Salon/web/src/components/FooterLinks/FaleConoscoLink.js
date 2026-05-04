import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const FaleConoscoLink = () => (
  <Link
    component={RouterLink}
    to="/fale-conosco"
    underline="hover"
    color="inherit"
    sx={{ fontSize: 13 }}
  >
    Fale Conosco
  </Link>
);

export default FaleConoscoLink;