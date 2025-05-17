import React, { useState } from "react";
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
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupIcon from "@mui/icons-material/Group";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import SwitchAccountIcon from "@mui/icons-material/SwitchAccount";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import MoreTimeIcon from "@mui/icons-material/MoreTime";
import { useClerk } from "@clerk/clerk-react";

import logo from "../../assets/logo_parrudus.png";
import miniLogo from "../../assets/mini_logo.jpg";

const drawerWidth = 240;
const collapsedWidth = 60;

const navItems = [
  { text: "Agendamentos", icon: <CalendarTodayIcon />, path: "/agendamentos" },
  { text: "Clientes", icon: <GroupIcon />, path: "/clientes" },
  {
    text: "Colaboradores",
    icon: <SwitchAccountIcon />,
    path: "/colaboradores",
  },
  { text: "Serviços", icon: <AutoFixHighIcon />, path: "/servicos" },
  { text: "Horários", icon: <MoreTimeIcon />, path: "/horarios" },
];

export default function Layout({ toggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const location = useLocation();
  const theme = useTheme();
  const { signOut, user } = useClerk();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const currentDrawerWidth = collapsed ? collapsedWidth : drawerWidth;

  const drawer = (
    <div>
      {/* Linha fina acima dos itens do menu */}
      <Box
        sx={{
          opacity: 0.4, // Defina a opacidade para um valor entre 0 e 1
          backgroundColor: "#b0b0b0",
          borderTop: `1px solid ${theme.palette.divider}`,
          marginTop: 1,
        }}
      />

      <List>
        {navItems.map((item, index) => (
          <ListItemButton
            key={index}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={() => setMobileOpen(false)}
            sx={{
              color: "white",
              opacity: 0.6,
              transition: "0.5s",
              borderRadius: "5px",
              "&:hover": {
                backgroundColor: "var(--dark-light)",
                opacity: 1,
                "& .MuiListItemIcon-root": {
                  color: "var(--primary)",
                },
              },
              "&.Mui-selected": {
                backgroundColor: "var(--dark-light)",
                opacity: 1,
                "& .MuiListItemIcon-root": {
                  color: "var(--primary)",
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>{item.icon}</ListItemIcon>
            {!collapsed && <ListItemText primary={item.text} />}
          </ListItemButton>
        ))}
      </List>

      {/* Linha fina abaixo dos itens do menu */}
      <Box
        sx={{
          opacity: 0.4, // Defina a opacidade para um valor entre 0 e 1
          backgroundColor: "#b0b0b0",
          borderTop: `1px solid ${theme.palette.divider}`,
          marginTop: 0,
        }}
      />
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          backgroundColor: "var(--primary)",
          transition: "width 0.3s, margin-left 0.3s",
        }}
      >
        <Toolbar sx={{ marginRight: 3 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              flexGrow: 1,
            }}
          >
            <Typography variant="h6" noWrap sx={{ color: "var(--white)" }}>
              Parrudus Barbearia
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--Gold)" }}>
              Plano Gold
            </Typography>
          </Box>

          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
            {theme.palette.mode === "dark" ? (
              <LightModeIcon />
            ) : (
              <DarkModeIcon />
            )}
          </IconButton>

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Configurações">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, marginLeft: 1 }}>
                <Avatar
                  sx={{ border: "2px solid", borderColor: "var(--Gold)" }}
                  src={ user.imageUrl || miniLogo}
                  alt="Logo"
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={handleCloseUserMenu}>
                <Typography sx={{ textAlign: "center" }}>Perfil</Typography>
              </MenuItem>
              <MenuItem onClick={handleCloseUserMenu} component={Link} to="/account">
                <Typography sx={{ textAlign: "center" }}>
                  Minha Conta
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleCloseUserMenu}>
                <Typography sx={{ textAlign: "center" }}>Dashboard</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleCloseUserMenu();
                  signOut({ redirectUrl: "/" });
                }}
              >
                <Typography sx={{ textAlign: "center" }}>Sair</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer para mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        <IconButton
          className="d-flex justify-content-start"
          onClick={() => setCollapsed(!collapsed)}
          sx={{ ml: 2, m: 1, color: "var(--white)" }}
        >
          {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>

        {drawer}
      </Drawer>

      {/* Drawer permanente para desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          width: currentDrawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: currentDrawerWidth,
            boxSizing: "border-box",
            overflowX: "hidden",
            transition: "width 0.3s",
            backgroundColor: "var(--dark)",
          },
        }}
        open
      >
        <IconButton
          className="d-flex justify-content-start"
          onClick={() => setCollapsed(!collapsed)}
          sx={{ ml: 2, m: 1, color: "var(--white)" }}
        >
          {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>

        <Box
          className="img-fluid px-3 py-4"
          component="img"
          src={logo}
          alt="Logo"
          sx={{
            display: collapsed ? "none" : "block",
            width: "auto",
            height: "auto",
            m: 0,
            p: 0,
          }}
        />

        {drawer}
      </Drawer>

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          transition: "width 0.3s",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
