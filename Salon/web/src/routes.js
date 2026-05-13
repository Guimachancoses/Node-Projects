import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import SplashScreen from "./components/SplashScreen";

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
import Empresas from "./pages/Empresas";
import "./styles.css";

const SPLASH_DURATION = 7500;

const privatePaths = [
  "/agendamentos",
  "/clientes",
  "/colaboradores",
  "/servicos",
  "/horarios",
  "/account",
  "/empresa",
  "/empresas",
];

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
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const [showSplash, setShowSplash] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);

  const { user: userRaw } = useSelector((state) => state.colaborador);
  const userStore = userRaw?.user ?? userRaw;
  const isYoda = userStore?.funcao === "yoda";
  const initialPrivatePath = isYoda ? "/empresas" : "/agendamentos";


  useEffect(() => {
    const previousPath = previousPathRef.current;
    const nextPath = location.pathname;

    const isFromHome = previousPath === "/";
    const isGoingToPrivatePage = privatePaths.includes(nextPath);

    if (isFromHome && isGoingToPrivatePage) {
      setShowSplash(true);

      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setShowSplash(false);
        previousPathRef.current = nextPath;
      }, SPLASH_DURATION);

      return () => clearTimeout(timeout);
    }

    setDisplayLocation(location);
    previousPathRef.current = nextPath;
  }, [location]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Routes location={displayLocation}>
      {/* Públicas */}
      <Route
        path="/"
        element={
          <>
            <SignedOut>
              <Login />
            </SignedOut>

            <SignedIn>
              <Navigate to={initialPrivatePath} replace />
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
        <Route path="/empresas" element={<Empresas />} />
      </Route>

      {/* Fallback geral */}
      <Route
        path="*"
        element={
          <>
            <SignedIn>
              <Navigate to={initialPrivatePath} replace />
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
