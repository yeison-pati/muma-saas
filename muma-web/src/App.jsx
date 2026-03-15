import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './context/UserContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';

// Comercial
import ComercialProductos from './pages/comercial/Productos';
import ComercialProyecto from './pages/comercial/Proyecto';
import ComercialP3 from './pages/comercial/P3';
import ComercialSolicitudes from './pages/comercial/Solicitudes';
import Hilos from './pages/shared/Hilos';

// Cotizador
import CotizadorProyectos from './pages/cotizador/Proyectos';

// Diseñador
import DisenadorProductos from './pages/disenador/Productos';
import DisenadorCrear from './pages/disenador/Crear';
import DisenadorProyectos from './pages/disenador/Proyectos';

// Desarrollo
import DesarrolloProyectos from './pages/desarrollo/Proyectos';

// Asignación (solo líderes)
import AsignacionProyectos from './pages/asignacion/Proyectos';

// Admin
import AdminProyectos from './pages/admin/Proyectos';
import AdminUsuarios from './pages/admin/Usuarios';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, isLoading } = useUser();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role}`} replace />;
  }

  return children;
}

function RoleRedirect() {
  const { user, role } = useUser();
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={`/${role}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/comercial"
        element={
          <ProtectedRoute allowedRoles={['comercial']}>
            <DashboardLayout role="comercial" />
          </ProtectedRoute>
        }
      >
        <Route index element={<ComercialProductos />} />
        <Route path="proyecto" element={<ComercialProyecto />} />
        <Route path="p3" element={<ComercialP3 />} />
        <Route path="solicitudes" element={<ComercialSolicitudes />} />
        <Route path="hilos" element={<Hilos />} />
      </Route>

      <Route
        path="/cotizador"
        element={
          <ProtectedRoute allowedRoles={['cotizador']}>
            <DashboardLayout role="cotizador" />
          </ProtectedRoute>
        }
      >
        <Route index element={<CotizadorProyectos />} />
        <Route path="hilos" element={<Hilos />} />
        <Route path="asignacion" element={<AsignacionProyectos />} />
      </Route>

      <Route
        path="/disenador"
        element={
          <ProtectedRoute allowedRoles={['disenador']}>
            <DashboardLayout role="disenador" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DisenadorProductos />} />
        <Route path="crear" element={<DisenadorCrear />} />
        <Route path="proyectos" element={<DisenadorProyectos />} />
        <Route path="hilos" element={<Hilos />} />
        <Route path="asignacion" element={<AsignacionProyectos />} />
      </Route>

      <Route
        path="/desarrollo"
        element={
          <ProtectedRoute allowedRoles={['desarrollo']}>
            <DashboardLayout role="desarrollo" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DesarrolloProyectos />} />
        <Route path="hilos" element={<Hilos />} />
        <Route path="asignacion" element={<AsignacionProyectos />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout role="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminProyectos />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
      </Route>

      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}
