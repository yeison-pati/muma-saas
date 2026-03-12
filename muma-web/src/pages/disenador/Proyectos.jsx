import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useCatalogService } from '../../hooks/useCatalogService';
import ProjectProductsTable from '../../components/ProjectProductsTable';
import './Proyectos.css';

export default function DisenadorProyectos() {
  const { user } = useUser();
  const catalog = useCatalogService();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    catalog
      .getProjectsEffective()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };

  const filtered = projects.filter((p) =>
    (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
  );

  return (
    <div className="disenador-proyectos-page">
      <p className="disenador-proyectos-desc">
        Proyectos marcados como efectivos (ventas cerradas). Vista de solo lectura.
      </p>

      <div className="disenador-proyectos-search">
        <input
          type="text"
          placeholder="Buscar por consecutivo (ej: 2025...)"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="disenador-proyectos-loading">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="disenador-proyectos-empty">
          {searchText.trim()
            ? 'No se encontraron proyectos'
            : 'No hay proyectos efectivos'}
        </p>
      ) : (
        <ul className="disenador-proyectos-list">
          {filtered.map((p) => {
            const variants = p.variants || [];
            const isExpanded = expandedId === p.id;

            return (
              <li key={p.id} className="disenador-proyectos-item">
                <button
                  type="button"
                  className="disenador-proyectos-item-btn"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <span className="disenador-consecutivo">{p.consecutive || p.name}</span>
                  <span> - {p.client || 'Sin cliente'}</span>
                  <span className="disenador-expand">{isExpanded ? '▼' : '▶'}</span>
                </button>
                {isExpanded && (
                  <div className="disenador-proyectos-detail">
                    <div className="disenador-meta">
                      <p>Cliente: {p.client}</p>
                      <p>Región: {p.region}</p>
                      <p>Total: ${(p.totalCost ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="disenador-badges">
                      <span className="badge badge-products">{variants.length} productos</span>
                      <span className="badge badge-version">v{p.version ?? 1}</span>
                      <span className="badge badge-estado">Estado: {p.state ?? 0}%</span>
                    </div>
                    <ProjectProductsTable
                      variants={variants}
                      projectId={p.id}
                      onMarkAsDesigned={user?.id ? async (projectId, variantId) => {
                        try {
                          await catalog.markVariantAsDesigned(projectId, variantId, user.id);
                          load();
                        } catch (err) {
                          alert(err?.message || 'Error al marcar diseñado');
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
