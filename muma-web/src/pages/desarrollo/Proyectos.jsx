import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useCatalogService } from '../../hooks/useCatalogService';
import ProjectProductsTable from '../../components/ProjectProductsTable';
import './Proyectos.css';

export default function DesarrolloProyectos() {
  const { user } = useUser();
  const catalog = useCatalogService();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('proceso');

  useEffect(() => {
    load();
  }, [user?.id]);

  const load = () => {
    if (!user?.id) return;
    catalog
      .getProjectsByAssignedDevelopment(user.id)
      .then((data) => setProjects(data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };

  const enProceso = projects.filter((p) => {
    const variants = p.variants || [];
    return variants.some((v) => !v.developedAt);
  });
  const desarrollados = projects.filter((p) => {
    const variants = p.variants || [];
    return variants.length > 0 && variants.every((v) => v.developedAt);
  });

  const filtered =
    activeTab === 'proceso'
      ? enProceso.filter((p) =>
          (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
        )
      : desarrollados.filter((p) =>
          (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
        );

  const selectedProject = projects.find((p) => p.id === expandedId);

  return (
    <div className={`desarrollo-page master-detail${expandedId != null ? ' master-detail--detail-open' : ''}`}>
      <div className="desarrollo-sidebar">
        <div className="desarrollo-sidebar-header">
          <p className="desarrollo-desc">Proyectos efectivos</p>
          <div className="desarrollo-search">
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="desarrollo-tabs">
            <button
              type="button"
              className={activeTab === 'proceso' ? 'active' : ''}
              onClick={() => setActiveTab('proceso')}
            >
              Proceso ({enProceso.length})
            </button>
            <button
              type="button"
              className={activeTab === 'desarrollados' ? 'active' : ''}
              onClick={() => setActiveTab('desarrollados')}
            >
              Desarrollados ({desarrollados.length})
            </button>
          </div>
        </div>

        <div className="desarrollo-sidebar-content">
          {loading ? (
            <p className="desarrollo-loading">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="desarrollo-empty">No hay proyectos</p>
          ) : (
            <div className="desarrollo-sidebar-list">
              {filtered.map((p) => {
                const isSelected = expandedId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`desarrollo-sidebar-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setExpandedId(p.id)}
                  >
                    <span className="desarrollo-consecutivo">{p.consecutive || 'S/C'}</span>
                    <span className="desarrollo-sidebar-client">
                      {(p.client || 'Sin cliente')} — {(p.name || 'Sin nombre')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="desarrollo-main">
        {selectedProject ? (
          <div className="desarrollo-detail-view">
            <div className="desarrollo-detail-header">
              <button
                type="button"
                className="desarrollo-back-btn"
                onClick={() => setExpandedId(null)}
              >
                ← Volver
              </button>
              <div className="desarrollo-header-info">
                <h2>{selectedProject.consecutive} — {selectedProject.name}</h2>
                <div className="desarrollo-meta">
                  <p><strong>Cliente:</strong> {selectedProject.client}</p>
                </div>
                <div className="desarrollo-badges">
                  <span className="badge badge-version">v{selectedProject.version ?? 1}</span>
                  <span className="badge badge-estado">Estado: {selectedProject.state ?? 0}%</span>
                </div>
              </div>
            </div>

            <ProjectProductsTable
              variants={selectedProject.variants || []}
              projectId={selectedProject.id}
              onMarkAsDeveloped={activeTab === 'proceso' && user?.id ? async (projectId, variantId) => {
                try {
                  await catalog.markVariantAsDeveloped(projectId, variantId, user.id);
                  load();
                } catch (err) {
                  alert(err?.message || 'Error al marcar desarrollado');
                }
              } : undefined}
              onRefresh={load}
            />
          </div>
        ) : (
          <div className="desarrollo-no-selection">
            <span className="selection-icon">⚙️</span>
            <p>Selecciona un proyecto para gestionar el desarrollo en SAP</p>
          </div>
        )}
      </div>
    </div>
  );
}
