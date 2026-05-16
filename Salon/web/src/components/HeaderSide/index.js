import { useCallback, useEffect, useMemo, useState } from "react";
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
  Skeleton,
  Fade,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

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
import backgroundYoda from "../../assets/capa_fundo.png"

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
  const isUiLoading = form?.loading || !assetsReady;
  const [fadeInReady, setFadeInReady] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!email) return;
    if (userStore?._id || userStore?.vinculoId) return;

    dispatch(loadMyAccountRequest(email));
  }, [dispatch, isLoaded, isSignedIn, email, userStore?._id, userStore?.vinculoId]);

  const isYoda = userStore?.funcao === "yoda";

  const navItems = [
    ...(!isYoda ? [{ text: "Agendamentos", icon: <CalendarTodayIcon />, path: "/agendamentos" }] : []),

    ...(isYoda ? [{ text: "Empresas", icon: <BusinessIcon />, path: "/empresas" }] : []),
    { text: "Clientes", icon: <GroupIcon />, path: "/clientes" },
    { text: "Colaboradores", icon: <SwitchAccountIcon />, path: "/colaboradores" },
    { text: "Serviços", icon: <AutoFixHighIcon />, path: "/servicos" },
    ...(!isYoda ? [{ text: "Horários", icon: <MoreTimeIcon />, path: "/horarios" }] : []),
  ];

  useEffect(() => {
    if (!empresa?._id) dispatch(loadMyCompanyRequest());
  }, [dispatch, empresa?._id]);

  useEffect(() => {
    let t;
    if (isUiLoading) {
      setFadeInReady(false);
    } else {
      t = setTimeout(() => setFadeInReady(true), 120); // pequeno delay para transição elegante
    }
    return () => clearTimeout(t);
  }, [isUiLoading]);

  const isHttpUrl = (value = "") => /^https?:\/\//i.test(String(value));

  const buildImageUrl = useCallback((value = "") => {
    if (!value) return "";

    const raw = String(value).trim();

    if (isHttpUrl(raw)) return raw;

    const base = (consts.bucketUrl || "").replace(/\/$/, "");
    const path = raw.replace(/^\//, "");

    return `${base}/${path}`;
  }, []);

  const avatarUrl = useMemo(() => {
    const fotoBanco = userStore?.foto || userStore?.fotoUrl || userStore?.imageUrl || "";
    const fotoClerk = user?.imageUrl || "";

    return fotoBanco ? buildImageUrl(fotoBanco) : fotoClerk;
  }, [userStore, user?.imageUrl, buildImageUrl]);

  const pickLatestByType = (arquivos = [], tipo = "") => {
    const item = (arquivos || [])
      .filter((a) => (a?.caminho || "").includes(`${tipo}-`))
      .sort((a, b) => new Date(b.dataCadastro) - new Date(a.dataCadastro))[0];
    return item?.caminho || "";
  };

  const capaUrl = useMemo(() => {
    const caminho = empresa?.capa || pickLatestByType(empresa?.arquivos, "capa");
    return buildImageUrl(caminho);
  }, [empresa, buildImageUrl]);

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
    // ✅ regra fixa para yoda
    if (isYoda) return miniLogo;

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
  }, [empresa, isYoda]);

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

  const isDark = theme.palette.mode === "dark";

  useEffect(() => {
    document.body.style.backgroundColor = isDark ? "#495057" : "#F1F5F9";
    document.body.style.backgroundImage = "none";

    const finalUrl = isYoda ? backgroundYoda : capaUrl;

    if (!finalUrl) return;

    let cancelled = false;

    const img = new Image();

    img.onload = () => {
      if (cancelled) return;

      const imageRatio = img.naturalWidth / img.naturalHeight;
      const viewportRatio = window.innerWidth / window.innerHeight;

      const ratioDiff = Math.abs(imageRatio - viewportRatio);

      const backgroundSize = ratioDiff > 0.7 ? "contain" : "cover";

      document.body.style.backgroundImage = `url('${finalUrl}')`;
      document.body.style.backgroundSize = backgroundSize;
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundAttachment = "fixed";
    };

    img.src = finalUrl;

    return () => {
      cancelled = true;
    };
  }, [capaUrl, isDark, isYoda]);

  const sidebarColors = useMemo(
    () => ({
      bg: isDark ? "var(--dark)" : "#F8FAFC",
      bgElevated: isDark ? "var(--dark-light)" : "#EEF2F7",
      text: isDark ? "#FFFFFF" : "#0F172A",
      textMuted: isDark ? "rgba(255,255,255,.72)" : "rgba(15,23,42,.72)",
      border: isDark ? "rgba(255,255,255,.16)" : "rgba(15,23,42,.10)",
      shadow: isDark
        ? "0 8px 28px rgba(0,0,0,.35)"
        : "0 8px 24px rgba(15,23,42,.08)",

      // ✅ foco em primary para ícones/estados
      primary: theme.palette.primary.main,
      hover: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.12),
      selected: alpha(theme.palette.primary.main, isDark ? 0.28 : 0.18),
      icon: theme.palette.primary.main,
    }),
    [isDark, theme]
  );

  const isVectorLogo = useMemo(() => {
    if (!logoUrl) return false;

    return (
      logoUrl.endsWith(".svg") ||
      logoUrl.includes(".svg?") ||
      logoUrl.includes(".png") ||
      logoUrl.includes(".png?") ||
      logoUrl.includes("logo-vetor")
    );
  }, [logoUrl]);

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        backgroundColor: sidebarColors.bg,
        color: sidebarColors.text,
        borderRight: `1px solid ${sidebarColors.border}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
          px: 1,
          py: 1,
        }}
      >
        <IconButton
          onClick={() => {
            if (isDesktop) setCollapsed((prev) => !prev);
            else setMobileOpen(false);
          }}
          sx={{
            color: isDark ? theme.palette.common.white : sidebarColors.icon,
            borderRadius: 2,
            px: 2,
            "&:hover": { backgroundColor: sidebarColors.hover },
          }}
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
        logoUrl && (
          <Box
            component="img"
            src={logoUrl}
            alt="Logo"
            sx={{
              display: showTextInDesktop || showTextInTemporary ? "block" : "none",
              mx: "auto",
              mb: 2,

              ...(isYoda
                ? {
                  width: {
                    xs: 88,
                    sm: 104,
                    md: collapsed ? 48 : 140,
                  },
                  height: {
                    xs: 88,
                    sm: 104,
                    md: collapsed ? 48 : 140,
                  },
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid rgba(255,255,255,0.35)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                }
                : {
                  width: "100%",
                  maxWidth: 180,
                  px: 2,

                  // aplica cor apenas se for vetor/logo monocromática
                  filter: isVectorLogo
                    ? isDark
                      ? "brightness(0) saturate(100%) invert(73%) sepia(13%) saturate(1258%) hue-rotate(131deg) brightness(103%) contrast(101%)"
                      : "brightness(0) saturate(100%) invert(40%) sepia(27%) saturate(932%) hue-rotate(131deg) brightness(96%) contrast(94%)"
                    : "none",
                }),
            }}
          />
        )
      )}

      <Box sx={{ opacity: 1, borderTop: `1px solid ${sidebarColors.border}`, mb: 0.5 }} />

      <List sx={{ px: 1 }}>
        <Fade in={isUiLoading} timeout={180} unmountOnExit>
          <Box>
            {Array.from({ length: navItems.length || 5 }).map((_, index) => (
              <ListItemButton
                key={`skeleton-nav-${index}`}
                disabled
                sx={{
                  borderRadius: "10px",
                  mb: 0.4,
                  minHeight: 44,
                  justifyContent: showTextInDesktop || showTextInTemporary ? "initial" : "center",
                  px: 1.2,
                  opacity: 0.9,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: showTextInDesktop || showTextInTemporary ? 1.5 : 0,
                    justifyContent: "center",
                  }}
                >
                  <Skeleton variant="circular" width={20} height={20} />
                </ListItemIcon>
                {(showTextInDesktop || showTextInTemporary) && (
                  <Skeleton variant="text" width={120} height={22} />
                )}
              </ListItemButton>
            ))}
          </Box>
        </Fade>

        <Fade in={!isUiLoading && fadeInReady} timeout={320} unmountOnExit>
          <Box>
            {navItems.map((item) => (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  color: sidebarColors.textMuted,
                  borderRadius: "10px",
                  mb: 0.4,
                  minHeight: 44,
                  justifyContent: showTextInDesktop || showTextInTemporary ? "initial" : "center",
                  px: 1.2,
                  transition: "all .2s ease",
                  "&:hover": { backgroundColor: sidebarColors.hover, color: sidebarColors.text },
                  "&.Mui-selected": {
                    backgroundColor: sidebarColors.selected,
                    color: sidebarColors.text,
                    fontWeight: 600,
                  },
                  "&.Mui-selected:hover": { backgroundColor: sidebarColors.selected },
                  "&:hover .MuiListItemIcon-root": { color: sidebarColors.primary },
                  "&.Mui-selected .MuiListItemIcon-root": { color: sidebarColors.primary },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isDark ? theme.palette.common.white : sidebarColors.icon,
                    minWidth: 0,
                    mr: showTextInDesktop || showTextInTemporary ? 1.5 : 0,
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {(showTextInDesktop || showTextInTemporary) && <ListItemText primary={item.text} />}
              </ListItemButton>
            ))}
          </Box>
        </Fade>
      </List>

      <Box sx={{ opacity: 1, borderTop: `1px solid ${sidebarColors.border}`, mt: 0.5 }} />
    </Box>
  );

  //console.log("userRaw", userRaw)

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
            <Fade in={!assetsReady} timeout={150} unmountOnExit>
              <Skeleton variant="text" width={180} height={28} sx={{ bgcolor: "rgba(255,255,255,.25)" }} />
            </Fade>

            <Fade in={assetsReady && fadeInReady} timeout={320} unmountOnExit>
              <Typography component="div">
                {isYoda ? "GuiMac Tech Solution" : (empresa?.nome || "Minha Empresa")}
              </Typography>
            </Fade>

            <Fade in={isUiLoading} timeout={150} unmountOnExit>
              <Skeleton variant="text" width={88} height={18} sx={{ bgcolor: "rgba(255,255,255,.25)" }} />
            </Fade>

            <Fade in={!isUiLoading && fadeInReady} timeout={320} unmountOnExit>
              <Typography
                variant="caption"
                sx={{
                  color: isYoda ? "#39FF14" : "var(--Gold)",
                  fontWeight: isYoda ? 700 : 500,
                  letterSpacing: isYoda ? 0.6 : 0.2,
                  textTransform: isYoda ? "uppercase" : "none",
                  textShadow: isYoda
                    ? "0 0 6px rgba(57,255,20,.85), 0 0 14px rgba(57,255,20,.55)"
                    : "none",
                  transition: "all .25s ease",
                }}
              >
                {isYoda ? "Modo Jedi" : "Plano Gold"}
              </Typography>
            </Fade>
          </Box>

          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
            {theme.palette.mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          <Box sx={{ flexGrow: 0, ml: 1 }}>
            <Tooltip title="Configurações">
              <IconButton data-tour="menu-config" onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  sx={{ border: "2px solid", borderColor: "var(--Gold)" }}
                  src={avatarUrl || miniLogo}
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
              backgroundColor: sidebarColors.bg,
              boxShadow: sidebarColors.shadow,
              borderRight: `1px solid ${sidebarColors.border}`,
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
              backgroundColor: sidebarColors.bg,
              borderRight: `1px solid ${sidebarColors.border}`,
              boxShadow: sidebarColors.shadow,
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