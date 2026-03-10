import { useState, useEffect } from 'react';
import { createIdentityService } from '../../api/identityGraphQLService';
import { useUser } from '../../context/UserContext';
import UsuariosHeader from './UsuariosHeader';
import UsuariosTabs from './UsuariosTabs';
import UsuarioCard from './UsuarioCard';
import UsuariosModal from './UsuariosModal';
import './Usuarios.css';

export default function AdminUsuarios() {
  const { getToken, user } = useUser();
  const identity = createIdentityService(getToken);
  const [quoters, setQuoters] = useState([]);
  const [sales, setSales] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState('quoters');
  const [modal, setModal] = useState({ open: false, mode: 'create', user: null });
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'SALES',
    region: '',
    jobTitle: '',
  });

  const loadUsers = () => {
    setLoadError(null);
    Promise.all([
      identity.getQuoters(),
      identity.getSales(),
      identity.getDesigners(),
    ])
      .then(([q, s, d]) => {
        setQuoters(q || []);
        setSales(s || []);
        setDesigners(d || []);
      })
      .catch((err) => {
        setLoadError(err?.message || 'Error al cargar usuarios');
        console.error('loadUsers error:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const users = tab === 'quoters' ? quoters : tab === 'sales' ? sales : designers;
  const userList = users.map((u) => u.user || u);

  const canEditOrDelete = (u) => {
    const createdBy = u.createdBy ?? u.user?.createdBy;
    return createdBy === user?.id;
  };

  const openCreate = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: tab === 'quoters' ? 'QUOTER' : tab === 'sales' ? 'SALES' : 'DESIGNER',
      region: '',
      jobTitle: '',
    });
    setModal({ open: true, mode: 'create', user: null });
  };

  const openEdit = (u) => {
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      password: '',
      region: u.region || '',
      jobTitle: u.jobTitle || '',
    });
    setModal({ open: true, mode: 'edit', user: u });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await identity.createUser({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        password: form.password,
        role: form.role,
        region: form.region || null,
        jobTitle: form.jobTitle || null,
        creator: user?.id || null,
      });
      setModal({ open: false });
      loadUsers();
    } catch (err) {
      alert(err?.message || 'Error al crear');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await identity.editUser(modal.user.id, {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        region: form.region || null,
        jobTitle: form.jobTitle || null,
        ...(form.password && { password: form.password }),
      });
      setModal({ open: false });
      loadUsers();
    } catch (err) {
      alert(err?.message || 'Error al editar');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await identity.deleteUser(userId);
      loadUsers();
    } catch (err) {
      alert(err?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="usuarios-page">
      <UsuariosHeader onCreate={openCreate} />

      <UsuariosTabs tab={tab} setTab={setTab} />

      {loadError && (
        <div className="usuarios-error">
          <p>{loadError}</p>
          <p className="usuarios-error-hint">
            Verifica que estés logueado como admin y que el servicio identity esté activo.
          </p>
          <button type="button" className="usuarios-retry-btn" onClick={loadUsers}>
            Reintentar
          </button>
        </div>
      )}

      {!loadError && loading && (
        <div className="usuarios-loading">Cargando usuarios...</div>
      )}

      {!loadError && !loading && userList.length === 0 && (
        <div className="usuarios-empty">
          No hay usuarios en esta categoría. Crea uno con el botón de arriba.
        </div>
      )}

      {!loadError && !loading && userList.length > 0 && (
        <div className="usuarios-grid">
          {userList.map((u) => (
            <UsuarioCard
              key={u.id}
              user={u}
              canModify={canEditOrDelete(u)}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal.open && (
        <UsuariosModal
          mode={modal.mode}
          form={form}
          setForm={setForm}
          onClose={() => setModal({ open: false })}
          onSubmit={modal.mode === 'create' ? handleCreate : handleEdit}
        />
      )}
    </div>
  );
}
