import { useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Navbar.css';

const PAGE_TITLES = {
  '/comercial': 'Productos',
  '/comercial/proyecto': 'Proyecto / Carrito',
  '/comercial/p3': 'Crear P3',
  '/comercial/solicitudes': 'Mis solicitudes',
  '/cotizador': 'Mis proyectos',
  '/disenador': 'Productos',
  '/disenador/crear': 'Crear base',
  '/disenador/proyectos': 'Proyectos efectivos',
  '/admin': 'Proyectos',
  '/admin/usuarios': 'Gestión de usuarios',
};

export default function Navbar() {
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={logo} alt="MUMA" className="navbar-logo" />
      </div>
      {pageTitle && <div className="navbar-title">{pageTitle}</div>}
    </nav>
  );
}
