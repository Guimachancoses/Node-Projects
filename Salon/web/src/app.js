// App.js
import React, { useState, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import Main from "./routes";

export default function App() {
  // 1) estado inicial lendo do localStorage
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("themeMode");
    return saved === "dark" || saved === "light" ? saved : "light";
  });

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#02555d", // cor principal
          },
          background: {
            default: mode === "dark" ? "#121212" : "#fff",
            paper: mode === "dark" ? "#1e1e1e" : "#fff",
          },
          text: {
            primary: mode === "dark" ? "#fff" : "#000",
            secondary: mode === "dark" ? "#b0b0b0" : "#555",
          },
          success: {
            main: "#4caf50",
          },
          warning: {
            main: "#ffa000",
          },
          error: {
            main: "#f44336",
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
        },
      }),
    [mode]
  );

  // 2) função que alterna tema
  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  // 3) persiste sempre que mode mudar
  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Main toggleTheme={toggleTheme} colorMode={mode} />
    </ThemeProvider>
  );
}
