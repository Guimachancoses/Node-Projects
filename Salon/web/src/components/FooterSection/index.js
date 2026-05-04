import { Box, Link, Typography } from "@mui/material";

const FooterSection = () => {
  return (
    <Box
      component="footer"
      sx={{
        position: "fixed",
        zIndex: 9999,
        pointerEvents: "auto",

        // Mobile: centralizado embaixo
        left: { xs: "50%", md: "auto" },
        right: { xs: "auto", md: 16 },
        transform: { xs: "translateX(-50%)", md: "none" },
        bottom: { xs: 4, md: 12 },
        width: { xs: "100%", md: "auto" },
        textAlign: { xs: "center", md: "right" },
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
        <Link href="#" underline="hover" sx={{ color: "#fff", fontWeight: 600 }}>
          GuiMac
        </Link>{" "}
        🪓
      </Typography>
    </Box>
  );
};

export default FooterSection;