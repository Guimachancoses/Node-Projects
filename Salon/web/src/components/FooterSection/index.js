import React from "react";
import { Box, Link, Typography } from "@mui/material";

const FooterSection = () => {
  return (
    <Box
      component="footer"
      sx={{
        position: "fixed",
        right: 16,
        bottom: 12,
        zIndex: 9999, // sobrepõe tudo
        pointerEvents: "auto",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "rgba(255,255,255,0.85)",
          fontSize: { xs: 11, md: 13 },
          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
          whiteSpace: "nowrap",
        }}
      >
        © {new Date().getFullYear()} — Criado por{" "}
        <Link
          href="#"
          underline="hover"
          sx={{ color: "#fff", fontWeight: 600 }}
        >
          GuiMac
        </Link>{" "}
        🪓
      </Typography>
    </Box>
  );
};

export default FooterSection;