import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadMyCompanyRequest } from "../../store/modules/salao/actions";
import consts from "../../consts";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Box,
  useTheme,
  useMediaQuery,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Skeleton
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupIcon from "@mui/icons-material/Group";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SwitchAccountIcon from "@mui/icons-material/SwitchAccount";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import MoreTimeIcon from "@mui/icons-material/MoreTime";
import BusinessIcon from "@mui/icons-material/Business";

import miniLogo from "../../assets/mini_logo.jpg";

import { loadMyAccountRequest } from "../../store/modules/colaborador/actions";
import { useAuth, useUser, useClerk } from "@clerk/clerk-react";

const DRAWER_EXPANDED = 240;
const DRAWER_COLLAPSED = 72;

export default function Layout({ toggleTheme }) {
  const dispatch = useDispatch();
  const { empresa, form } = useSelector((state) => state.salao || {});
  const { user: userRaw } = useSelector((state) => state.colaborador);
  const userStore = userRaw?.user ?? userRaw;
  const [assetsReady, setAssetsReady] = useState(false);
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!email) return;
    if (userStore?._id || userStore?.vinculoId) return;

    dispatch(loadMyAccountRequest(email));
  }, [dispatch, isLoaded, isSignedIn, email, userStore?._id, userStore?.vinculoId]);

  const isYoda = userRaw?.funcao === "yoda";

  const navItems = [
    ...(!isYoda ? [{ text: "Agendamentos", icon: <CalendarTodayIcon />, path: "/agendamentos" }] : []),
    { text: "Clientes", icon: <GroupIcon />, path: "/clientes" },
    { text: "Colaboradores", icon: <SwitchAccountIcon />, path: "/colaboradores" },
    { text: "Serviços", icon: <AutoFixHighIcon />, path: "/servicos" },
    { text: "Horários", icon: <MoreTimeIcon />, path: "/horarios" },

    ...(isYoda ? [{ text: "Empresas", icon: <BusinessIcon />, path: "/empresas" }] : []),
  ];

  useEffect(() => {
    if (!empresa?._id) dispatch(loadMyCompanyRequest());
  }, [dispatch, empresa?._id]);

  const buildImageUrl = (value = "") => {
    if (!value) return "";
    if (value.startsWith("http")) return value;
    return `${consts.bucketUrl.replace(/\/$/, "")}/${String(value).replace(/^\//, "")}`;
  };

  const pickLatestByType = (arquivos = [], tipo = "") => {
    const item = (arquivos || [])
      .filter((a) => (a?.caminho || "").includes(`${tipo}-`))
      .sort((a, b) => new Date(b.dataCadastro) - new Date(a.dataCadastro))[0];
    return item?.caminho || "";
  };

  const capaUrl = useMemo(() => {
    const caminho = empresa?.capa || pickLatestByType(empresa?.arquivos, "capa");
    return buildImageUrl(caminho);
  }, [empresa]);

  useEffect(() => {
    const fallback = "/assets/background_parrudus.jpg";
    document.body.style.backgroundImage = `url('${capaUrl || fallback}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";

    return () => {
      document.body.style.backgroundImage = "";
    };
  }, [capaUrl]);

  const theme = useTheme();
  const location = useLocation();
  const { signOut } = useClerk();

  // Desktop: drawer fixo. Mobile/tablet: drawer temporário.
  const isDesktop = useMediaQuery(theme.breakpoints.up("md")); // troque para "lg" se quiser desktop só em telas maiores

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const currentDrawerWidth = useMemo(() => {
    if (!isDesktop) return DRAWER_EXPANDED;
    return collapsed ? DRAWER_COLLAPSED : DRAWER_EXPANDED;
  }, [isDesktop, collapsed]);

  useEffect(() => {
    // Fecha menu quando trocar de rota em mobile/tablet
    if (!isDesktop) setMobileOpen(false);
  }, [location.pathname, isDesktop]);

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const showTextInDesktop = isDesktop && !collapsed;
  const showTextInTemporary = !isDesktop; // em mobile/tablet sempre mostra texto

  const logoUrl = useMemo(() => {
    const build = (value = "") => {
      if (!value) return "";
      if (value.startsWith("http")) return value;
      return `${consts.bucketUrl.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
    };

    // prioridade: campo direto
    if (empresa?.logo) return build(empresa.logo);

    // fallback: buscar em arquivos
    const arqLogo = (empresa?.arquivos || [])
      .filter((a) => (a?.caminho || "").includes("logo-"))
      .sort((a, b) => new Date(b.dataCadastro) - new Date(a.dataCadastro))[0];

    return build(arqLogo?.caminho || "");
  }, [empresa]);

  const preloadImage = (src) =>
    new Promise((resolve) => {
      if (!src) return resolve();
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // não bloqueia forever
      img.src = src;
    });

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (form?.loading) {
        if (mounted) setAssetsReady(false);
        return;
      }

      await Promise.all([preloadImage(logoUrl), preloadImage(capaUrl)]);
      if (mounted) setAssetsReady(true);
    };

    run();
    return () => {
      mounted = false;
    };
  }, [form?.loading, logoUrl, capaUrl]);

  useEffect(() => {
    // cor base imediata (antes da imagem)
    document.body.style.backgroundColor = "#495057";
    document.body.style.backgroundImage = "none";

    const fallback = "/assets/background_parrudus.jpg";
    const finalUrl = capaUrl || fallback;

    if (!finalUrl) return;

    const img = new Image();
    img.onload = () => {
      document.body.style.backgroundImage = `url('${finalUrl}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundAttachment = "fixed";
    };
    img.src = finalUrl;
  }, [capaUrl]);

  const drawerContent = (
    <Box sx={{ height: "100%", backgroundColor: "var(--dark)", color: "white" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1, py: 1 }}>
        <IconButton
          onClick={() => {
            if (isDesktop) setCollapsed((prev) => !prev);
            else setMobileOpen(false);
          }}
          sx={{ color: "var(--white)" }}
        >
          {isDesktop ? (collapsed ? <MenuIcon /> : <MenuOpenIcon />) : <MenuOpenIcon />}
        </IconButton>
      </Box>

      {!assetsReady ? (
        <Skeleton
          variant="rectangular"
          sx={{ width: "100%", maxWidth: 180, height: 56, mx: "auto", mb: 2, borderRadius: 1 }}
        />
      ) : (

        <Box
          component="img"
          src={logoUrl} // fallback para logo local
          alt="Logo"
          sx={{
            display: showTextInDesktop || showTextInTemporary ? "block" : "none",
            width: "100%",
            maxWidth: 180,
            mx: "auto",
            mb: 2,
            px: 2,
          }}
        />
      )}
      <Box
        sx={{
          opacity: 0.4,
          borderTop: `1px solid ${theme.palette.divider}`,
          mb: 0.5,
        }}
      />

      <List sx={{ px: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              color: "white",
              opacity: 0.7,
              borderRadius: "8px",
              mb: 0.3,
              minHeight: 44,
              justifyContent:
                showTextInDesktop || showTextInTemporary ? "initial" : "center",
              px: 1.2,
              "&:hover": {
                backgroundColor: "var(--dark-light)",
                opacity: 1,
              },
              "&.Mui-selected": {
                backgroundColor: "var(--dark-light)",
                opacity: 1,
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: "white",
                minWidth: 0,
                mr: showTextInDesktop || showTextInTemporary ? 1.5 : 0,
                justifyContent: "center",
              }}
            >
              {item.icon}
            </ListItemIcon>

            {(showTextInDesktop || showTextInTemporary) && (
              <ListItemText primary={item.text} />
            )}
          </ListItemButton>
        ))}
      </List>

      <Box
        sx={{
          opacity: 0.4,
          borderTop: `1px solid ${theme.palette.divider}`,
          mt: 0.5,
        }}
      />
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <CssBaseline />

      {/* Topbar */}
      <AppBar
        position="fixed"
        sx={{
          width: isDesktop ? `calc(100% - ${currentDrawerWidth}px)` : "100%",
          ml: isDesktop ? `${currentDrawerWidth}px` : 0,
          backgroundColor: "var(--primary)",
          transition: "width .25s ease, margin-left .25s ease",
        }}
      >
        <Toolbar sx={{ px: { xs: 1.5, sm: 2 } }}>
          {!isDesktop && (
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexGrow: 1 }}>
            {!assetsReady ? (
              <Skeleton variant="text" width={180} height={28} sx={{ bgcolor: "rgba(255,255,255,.25)" }} />
            ) : (
              empresa?.nome || "Minha Empresa"
            )}
            <Typography variant="caption" sx={{ color: "var(--Gold)" }}>
              Plano Gold
            </Typography>
          </Box>

          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
            {theme.palette.mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          <Box sx={{ flexGrow: 0, ml: 1 }}>
            <Tooltip title="Configurações">
              <IconButton data-tour="menu-config" onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  sx={{ border: "2px solid", borderColor: "var(--Gold)" }}
                  src={user?.imageUrl || miniLogo}
                  alt="Avatar"
                />
              </IconButton>
            </Tooltip>

            <Menu
              sx={{ mt: "45px" }}
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              keepMounted
            >
              <MenuItem data-tour="menu-minha-conta" onClick={handleCloseUserMenu} component={Link} to="/account">
                <Typography>Minha Conta</Typography>
              </MenuItem>

              <MenuItem data-tour="menu-minha-empresa" onClick={handleCloseUserMenu} component={Link} to="/empresa">
                <Typography>Minha Empresa</Typography>
              </MenuItem>

              <MenuItem
                onClick={() => {
                  handleCloseUserMenu();
                  signOut({ redirectUrl: "/" });
                }}
              >
                <Typography>Sair</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer mobile/tablet */}
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: DRAWER_EXPANDED,
              boxSizing: "border-box",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Drawer desktop */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: currentDrawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: currentDrawerWidth,
              boxSizing: "border-box",
              overflowX: "hidden",
              transition: "width .25s ease",
              backgroundColor: "var(--dark)",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Conteúdo */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,

          minWidth: 0,
          p: { xs: 2, sm: 3 },
          width: isDesktop ? `calc(100% - ${currentDrawerWidth}px)` : "100%",
          transition: "width .25s ease",
          overflowX: "auto",
        }}
      >
        <Toolbar />
        {!assetsReady ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
          </Box>
        ) : (
          <Outlet />
        )}
      </Box>
    </Box>
  );
}