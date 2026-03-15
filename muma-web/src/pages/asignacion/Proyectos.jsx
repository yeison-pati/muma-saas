import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useCatalogService } from '../../hooks/useCatalogService';
import { createIdentityService } from '../../api/identityGraphQLService';
import ProjectProductsTable from '../../components/ProjectProductsTable';
import './Proyectos.css';

export default function AsignacionProyectos() {
  const { user, getToken } = useUser();
  const { pathname } = useLocation();
  const catalog = useCatalogService();
  const identity = createIdentityService(getToken);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [quoters, setQuoters] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [developers, setDevelopers] = useState([]);

  const role = pathname.startsWith('/cotizador') ? 'cotizador' : pathname.startsWith('/disenador') ? 'disenador' : pathname.startsWith('/desarrollo') ? 'desarrollo' : null;
  const assignRoleFilter = role === 'cotizador' ? 'QUOTER' : role === 'disenador' ? 'DESIGNER' : role === 'desarrollo' ? 'DEVELOPMENT' : null;

  useEffect(() => {
    load();
  }, [role]);

  useEffect(() => {
    identity.getQuoters().then((r) => setQuoters(r || [])).catch(() => setQuoters([]));
    identity.getDesigners().then((r) => setDesigners(r || [])).catch(() => setDesigners([]));
    identity.getDevelopers().then((r) => setDevelopers(r || [])).catch(() => setDevelopers([]));
  }, []);

  const load = () => {
    catalog
      .getProjectsForAssignment(role)
      .then((data) => setProjects(data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };

  const handleAssignVariant = async (projectId, variantId, assigneeId, roleType) => {
    try {
      await catalog.assignVariantToUser(projectId, variantId, assigneeId, roleType);
      load();
    } catch (err) {
      alert(err?.message || 'Error al asignar');
    }
  };

  if (!user?.isLeader) {
    return (
      <div className="asignacion-page">
        <h1>Asignación</h1>
        <p className="asignacion-forbidden">Solo los líderes pueden acceder a esta vista.</p>
      </div>
    );
  }

  const filtered = projects.filter((p) =>
    (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
  );

  const descByRole = role === 'cotizador'
    ? 'Asigne cotizadores de su región a cada producto. Solo cotizadores de la misma región del proyecto.'
    : role === 'disenador'
      ? 'Asigne diseñadores de la región del proyecto a productos ya cotizados.'
      : role === 'desarrollo'
        ? 'Asigne desarrollo de la región del proyecto a productos ya diseñados.'
        : 'Asigne cotizador, diseñador y desarrollo a cada producto.';

  return (
    <div className="asignacion-page">
      <h1>Asignación de productos</h1>
      <p className="asignacion-desc">{descByRole}</p>

      <div className="asignacion-search">
        <input
          type="text"
          placeholder="Buscar por consecutivo"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="asignacion-loading">Cargando proyectos...</p>
      ) : filtered.length === 0 ? (
        <p className="asignacion-empty">
          {searchText.trim() ? 'No se encontraron proyectos' : 'No hay proyectos para asignar'}
        </p>
      ) : (
        <ul className="asignacion-list">
          {filtered.map((p) => {
            const variants = p.variants || [];
            const isExpanded = expandedId === p.id;
            return (
              <li key={p.id} className="asignacion-item">
                <button
                  type="button"
                  className="asignacion-item-btn"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <span className="asignacion-consecutivo">{p.consecutive || p.name}</span>
                  <span> — {p.name || 'Sin nombre'}</span>
                  <span className="asignacion-badge">{variants.length} producto{variants.length !== 1 ? 's' : ''}</span>
                </button>
                {isExpanded && (
                  <div className="asignacion-detail">
                    <p>Cliente: {p.client} | Región: {p.region}</p>
                    <ProjectProductsTable
                      variants={variants}
                      projectId={p.id}
                      assignOnly
                      assignRoleFilter={assignRoleFilter}
                      projectRegion={p.region}
                      assigneesQuoter={quoters}
                      assigneesDesigner={designers}
                      assigneesDevelopment={developers}
                      onAssignVariant={handleAssignVariant}
                      onRefresh={load}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
