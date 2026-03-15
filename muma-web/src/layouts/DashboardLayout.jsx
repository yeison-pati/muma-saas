import { Outlet } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useUser } from '../context/UserContext';
import { ProductsProvider } from '../context/ProductsContext';
import { FiltersProvider } from '../context/FiltersContext';
import { CartProvider } from '../context/CartContext';
import { ProjectProvider } from '../context/ProjectContext';
import { SidebarProvider } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const RUTAS = {
  comercial: [
    { name: 'PRODUCTOS', path: '/comercial' },
    { name: 'CREAR P3', path: '/comercial/p3' },
    { name: 'PROYECTO', path: '/comercial/proyecto' },
    { name: 'SOLICITUDES', path: '/comercial/solicitudes' },
    { name: 'HILOS', path: '/comercial/hilos' },
  ],
  cotizador: [
    { name: 'PROYECTOS', path: '/cotizador' },
    { name: 'HILOS', path: '/cotizador/hilos' },
  ],
  disenador: [
    { name: 'PRODUCTOS', path: '/disenador' },
    { name: 'CREAR', path: '/disenador/crear' },
    { name: 'EFECTIVOS', path: '/disenador/proyectos' },
    { name: 'HILOS', path: '/disenador/hilos' },
  ],
  admin: [
    { name: 'PROYECTOS', path: '/admin' },
    { name: 'USUARIOS', path: '/admin/usuarios' },
  ],
  desarrollo: [
    { name: 'PROYECTOS EFECTIVOS', path: '/desarrollo' },
    { name: 'HILOS', path: '/desarrollo/hilos' },
  ],
};

const getRutaAsignacion = (role) => ({ name: 'ASIGNACIÓN', path: `/${role}/asignacion` });

function LayoutContent({ role }) {
  const { user } = useUser();
  const baseRoutes = RUTAS[role] || [];
  const isLeader = user?.isLeader === true;
  const showAsignacion = isLeader && ['cotizador', 'disenador', 'desarrollo'].includes(role);
  const routes = showAsignacion ? [...baseRoutes, getRutaAsignacion(role)] : baseRoutes;
  const { isOpen } = useSidebar();
  const sidebarWidth = isOpen ? 220 : 72;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'stretch',
        paddingRight: sidebarWidth,
        transition: 'padding-right 0.2s ease',
      }}
    >
      <main style={{ flex: 1, paddingTop: 56, overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
      <Sidebar routes={routes} />
    </div>
  );
}

export default function DashboardLayout({ role }) {
  const content = (
    <SidebarProvider initialOpen>
      <LayoutContent role={role} />
    </SidebarProvider>
  );

  const withProviders =
    role === 'comercial' || role === 'disenador' ? (
      <ProductsProvider>
        <FiltersProvider>
          <CartProvider>
            <ProjectProvider>{content}</ProjectProvider>
          </CartProvider>
        </FiltersProvider>
      </ProductsProvider>
    ) : (
      <ProductsProvider>{content}</ProductsProvider>
    );

  return (
    <>
      <Navbar />
      {withProviders}
    </>
  );
}
