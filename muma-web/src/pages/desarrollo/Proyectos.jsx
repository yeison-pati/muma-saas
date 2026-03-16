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

  return (
    <div className="desarrollo-page">
      <h1>Proyectos efectivos</h1>
      <p className="desarrollo-desc">
        Proyectos efectivos asignados a usted. Agregue los productos a SAP y márquelos como desarrollados cuando estén listos.
      </p>

      <div className="desarrollo-search">
        <input
          type="text"
          placeholder="Buscar por consecutivo (ej: 2025...)"
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
          En Proceso ({enProceso.length})
        </button>
        <button
          type="button"
          className={activeTab === 'desarrollados' ? 'active' : ''}
          onClick={() => setActiveTab('desarrollados')}
        >
          Desarrollados ({desarrollados.length})
        </button>
      </div>

      {loading ? (
        <p className="desarrollo-loading">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="desarrollo-empty">
          {searchText.trim()
            ? 'No se encontraron proyectos'
            : activeTab === 'proceso'
              ? 'No hay proyectos en proceso'
              : 'No hay proyectos desarrollados'}
        </p>
      ) : (
        <ul className="desarrollo-list">
          {filtered.map((p) => {
            const variants = p.variants || [];
            const isExpanded = expandedId === p.id;

            return (
              <li key={p.id} className="desarrollo-item">
                <button
                  type="button"
                  className="desarrollo-item-btn"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <span className="desarrollo-consecutivo">{p.consecutive || p.name}</span>
                  <span> — {p.client || 'Sin cliente'} - {p.name || p.consecutive || 'Sin nombre'}</span>
                  <span className="desarrollo-expand">{isExpanded ? '▼' : '▶'}</span>
                </button>
                {isExpanded && (
                  <div className="desarrollo-detail">
                    <div className="desarrollo-meta">
                      <p>Cliente: {p.client}</p>
                      <p>Región: {p.region}</p>
                      <p>Total: ${(p.totalCost ?? 0).toLocaleString()} COP</p>
                    </div>
                    <div className="desarrollo-badges">
                      <span className="badge badge-products">{variants.length} productos</span>
                      <span className="badge badge-version">v{p.version ?? 1}</span>
                      <span className="badge badge-estado">Estado: {p.state ?? 0}%</span>
                    </div>
                    <ProjectProductsTable
                      variants={variants}
                      projectId={p.id}
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
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
