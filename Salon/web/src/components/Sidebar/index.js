import logo from "../../assets/logo_parrudus.png";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar col-2 h-100">
      <img src={logo} className="img-fluid px-3 py-4" alt="Logo" />
      <ul>
        <li>
          <Link
            to="/"
            className={`${location.pathname === '/' ? 'active' : ''}`}
          >
            <span className="mdi mdi-calendar-check"></span>
            <span>Agendamentos</span>
          </Link>
        </li>
        <li>
          <Link
            to="/clientes"
            className={`${location.pathname === '/clientes' ? 'active' : ''}`}
          >
            <span className="mdi mdi-account-multiple"></span>
            <span>Clientes</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
