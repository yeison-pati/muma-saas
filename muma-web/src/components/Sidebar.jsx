import { NavLink, useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useUser } from '../context/UserContext';
import { SIDEBAR_ICONS } from '../constants/icons';
import './Sidebar.css';

const EMPTY_ROUTES = [];

export default function Sidebar({ routes = EMPTY_ROUTES }) {
  const { isOpen, toggle } = useSidebar();
  const { user, signOut } = useUser();
  const navigate = useNavigate();

  return (
    <>
      <button
        type="button"
        className="sidebar-backdrop"
        aria-hidden={!isOpen}
        onClick={toggle}
      />
      <aside
        className={`sidebar ${isOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
      >
      <button
        type="button"
        className="sidebar-toggle-btn"
        onClick={toggle}
        title={isOpen ? 'Ocultar menú' : 'Mostrar menú'}
      >
        <img src={SIDEBAR_ICONS.toggle} alt="menu" className="sidebar-toggle-icon" />
        {isOpen && user && (
          <span className="sidebar-toggle-name">
            {user.name || user.email || 'Usuario'}
          </span>
        )}
      </button>

      <nav className="sidebar-nav">
        {routes.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <img
              src={SIDEBAR_ICONS[item.name] || SIDEBAR_ICONS.PROYECTOS}
              alt=""
              className="sidebar-item-icon"
            />
            {isOpen && <span className="sidebar-item-label">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-item sidebar-logout"
          onClick={signOut}
        >
          <img src={SIDEBAR_ICONS.logout} alt="" className="sidebar-item-icon" />
          {isOpen && <span className="sidebar-item-label">LOGOUT</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
