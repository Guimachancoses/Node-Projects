import { useEffect, useState } from "react";
import logo from "../../assets/logo_parrudus.png";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Fecha o menu ao trocar de rota (bom para mobile)
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Botão mobile/tablet */}
      <button
        className="sidebar-toggle d-lg-none"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <span className="mdi mdi-menu"></span>
      </button>

      {/* Overlay mobile/tablet */}
      {open && <div className="sidebar-overlay d-lg-none" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header">
          <img src={logo} className="img-fluid sidebar-logo" alt="Logo" />

          <button
            className="sidebar-close d-lg-none"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <span className="mdi mdi-close"></span>
          </button>
        </div>

        <ul className="sidebar-menu">
          <li>
            <Link to="/" className={location.pathname === "/" ? "active" : ""}>
              <span className="mdi mdi-calendar-check"></span>
              <span>Agendamentos</span>
            </Link>
          </li>

          <li>
            <Link to="/clientes" className={location.pathname === "/clientes" ? "active" : ""}>
              <span className="mdi mdi-account-multiple"></span>
              <span>Clientes</span>
            </Link>
          </li>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;