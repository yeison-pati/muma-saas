import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useCatalogService } from '../../hooks/useCatalogService';
import { createIdentityService } from '../../api/identityGraphQLService';
import ProjectProductsTable from '../../components/ProjectProductsTable';
import { formatErrorMessage } from '../../utils/formatError';
import './Proyectos.css';

/** Cuenta productos asignados por userId desde los proyectos. Identity no actualiza en asignación. */
function countAssignedFromProjects(projects, field) {
  const counts = {};
  for (const p of projects || []) {
    for (const v of p.variants || []) {
      const uid = v[field];
      if (uid) {
        counts[uid] = (counts[uid] || 0) + 1;
      }
    }
  }
  return counts;
}

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
      alert(formatErrorMessage(err, 'Error al asignar'));
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

  const quoterCounts = useMemo(() => countAssignedFromProjects(projects, 'assignedQuoterId'), [projects]);
  const designerCounts = useMemo(() => countAssignedFromProjects(projects, 'assignedDesignerId'), [projects]);
  const developerCounts = useMemo(() => countAssignedFromProjects(projects, 'assignedDevelopmentUserId'), [projects]);

  const getUserId = (item) => item?.user?.id || item?.id;

  const quotersWithCount = useMemo(
    () => quoters.map((q) => ({ ...q, projects: quoterCounts[getUserId(q)] ?? 0 })),
    [quoters, quoterCounts]
  );
  const designersWithCount = useMemo(
    () => designers.map((d) => ({ ...d, created: designerCounts[getUserId(d)] ?? 0, edited: 0 })),
    [designers, designerCounts]
  );
  const developersWithCount = useMemo(
    () => developers.map((d) => ({ ...d, projects: developerCounts[getUserId(d)] ?? 0 })),
    [developers, developerCounts]
  );

  const selectedProject = projects.find((p) => p.id === expandedId);

  return (
    <div className={`asignacion-page master-detail${expandedId != null ? ' master-detail--detail-open' : ''}`}>
      <div className="asignacion-sidebar">
        <div className="asignacion-sidebar-header">
          <h1>Asignación</h1>
          <div className="asignacion-search">
            <input
              type="text"
              placeholder="Buscar por consecutivo..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="asignacion-sidebar-content">
          {loading ? (
            <p className="asignacion-loading">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="asignacion-empty">No hay proyectos</p>
          ) : (
            <div className="asignacion-sidebar-list">
              {filtered.map((p) => {
                const isSelected = expandedId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`asignacion-sidebar-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setExpandedId(p.id)}
                  >
                    <span className="asignacion-consecutivo">{p.consecutive || 'S/C'}</span>
                    <span className="asignacion-sidebar-client">
                      {(p.client || 'Sin cliente')} — {(p.name || 'Sin nombre')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="asignacion-main">
        {selectedProject ? (
          <div className="asignacion-detail-view">
            <div className="asignacion-detail-header">
              <button
                type="button"
                className="asignacion-back-btn"
                onClick={() => setExpandedId(null)}
              >
                ← Volver
              </button>
              <div className="asignacion-header-info">
                <h2>{selectedProject.consecutive} — {selectedProject.name}</h2>
                <p><strong>Cliente:</strong> {selectedProject.client}</p>
              </div>
            </div>

            <ProjectProductsTable
              variants={selectedProject.variants || []}
              projectId={selectedProject.id}
              assignOnly
              assignRoleFilter={assignRoleFilter}
              assigneesQuoter={quotersWithCount}
              assigneesDesigner={designersWithCount}
              assigneesDevelopment={developersWithCount}
              onAssignVariant={handleAssignVariant}
              onRefresh={load}
            />
          </div>
        ) : (
          <div className="asignacion-no-selection">
            <span className="selection-icon">📋</span>
            <p>Selecciona un proyecto de la lista para gestionar asignaciones</p>
          </div>
        )}
      </div>
    </div>
  );
}
