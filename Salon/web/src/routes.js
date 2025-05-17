import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

import Login from "./pages/Login";
import Agendamentos from "./pages/Agendamentos";
import Clientes from "./pages/Clientes";
import Colaboradores from "./pages/Colaboradores";
import Serviços from "./pages/Servicos";
import Horarios from "./pages/Horarios";
import Account from "./pages/Account";
import Layout from "./components/HeaderSide";
import "./styles.css";

const Main = ({ toggleTheme, colorMode }) => {
  return (
    <Router>
      <Routes>
        {/* Página pública */}
        <Route path="/" element={<Login />} />

        {/* Rotas privadas: só mostra se estiver logado */}
        <Route
          element={
            <SignedIn>
              <Layout toggleTheme={toggleTheme} colorMode={colorMode} />
            </SignedIn>
          }
        >
          <Route path="agendamentos" element={<Agendamentos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="colaboradores" element={<Colaboradores />} />
          <Route path="servicos" element={<Serviços />} />
          <Route path="horarios" element={<Horarios />} />
          <Route path="account" element={<Account />} />
        </Route>

        {/* Redireciona usuários não logados */}
        <Route
          path="*"
          element={
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          }
        />
      </Routes>
    </Router>
  );
};

export default Main;
