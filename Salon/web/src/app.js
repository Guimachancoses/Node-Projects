// App.js
import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import Main from "./routes";

export default function App() {
  const [mode, setMode] = React.useState("light");

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

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Main toggleTheme={toggleTheme} colorMode={mode} />
    </ThemeProvider>
  );
}
