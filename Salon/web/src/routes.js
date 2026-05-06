import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

import Login from "./pages/Login";
import Agendamentos from "./pages/Agendamentos";
import Clientes from "./pages/Clientes";
import Colaboradores from "./pages/Colaboradores";
import Serviços from "./pages/Servicos";
import Horarios from "./pages/Horarios";
import Account from "./pages/Account";
import Layout from "./components/HeaderSide";
import FaleConosco from "./pages/FaleConosco";
import TermosDeServico from "./pages/TermosDeServico";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";
import ForgotPassword from "./pages/ForgotPassword";
import Empresa from "./pages/Empresa";
import "./styles.css";

// Guard de rota privada
const PrivateRoute = ({ toggleTheme, colorMode }) => (
  <>
    <SignedIn>
      <Layout toggleTheme={toggleTheme} colorMode={colorMode}>
        <Outlet />
      </Layout>
    </SignedIn>

    <SignedOut>
      <Navigate to="/" replace />
    </SignedOut>
  </>
);

const Main = ({ toggleTheme, colorMode }) => {
  return (
    <Routes>
      {/* Públicas */}
      <Route
        path="/"
        element={
          <>
            <SignedOut>
              <Login />
            </SignedOut>
            <SignedIn>
              <Navigate to="/agendamentos" replace />
            </SignedIn>
          </>
        }
      />
      <Route path="/fale-conosco" element={<FaleConosco />} />
      <Route path="/termos-de-servico" element={<TermosDeServico />} />
      <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Privadas */}
      <Route element={<PrivateRoute toggleTheme={toggleTheme} colorMode={colorMode} />}>
        <Route path="/agendamentos" element={<Agendamentos />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/colaboradores" element={<Colaboradores />} />
        <Route path="/servicos" element={<Serviços />} />
        <Route path="/horarios" element={<Horarios />} />
        <Route path="/account" element={<Account />} />
        <Route path="/empresa" element={<Empresa />} />
      </Route>

      {/* Fallback geral */}
      <Route
        path="*"
        element={
          <>
            <SignedIn>
              <Navigate to="/agendamentos" replace />
            </SignedIn>
            <SignedOut>
              <Navigate to="/" replace />
            </SignedOut>
          </>
        }
      />
    </Routes>
  );
};

export default Main;