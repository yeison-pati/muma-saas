import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useCatalogService } from '../../hooks/useCatalogService';
import './Hilos.css';

const THREAD_TYPE_DESIGN = 'COMMERCIAL_DESIGN';
const THREAD_TYPE_DEVELOPMENT = 'COMMERCIAL_DEVELOPMENT';

export default function Hilos() {
  const { user, role } = useUser();
  const catalog = useCatalogService();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [threads, setThreads] = useState({});
  const [loadingThreads, setLoadingThreads] = useState({});
  const [opening, setOpening] = useState(null);
  const [closing, setClosing] = useState(null);

  const isComercial = role === 'comercial';
  const isDisenador = role === 'disenador';
  const isDesarrollo = role === 'desarrollo';

  useEffect(() => {
    loadProjects();
  }, [user?.id, role]);

  const loadProjects = () => {
    if (!user?.id) return;
    setLoading(true);
    let loader;
    if (isComercial) {
      loader = catalog.getProjectsBySales(user.id);
    } else if (isDisenador) {
      loader = catalog.getProjectsByAssignedDesigner(user.id);
    } else if (isDesarrollo) {
      loader = catalog.getProjectsByAssignedDevelopment(user.id);
    } else {
      loader = Promise.resolve([]);
    }
    loader
      .then((data) => setProjects(data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };

  const loadThreads = (projectId) => {
    setLoadingThreads((p) => ({ ...p, [projectId]: true }));
    catalog
      .getThreadsByProject(projectId)
      .then((data) => setThreads((t) => ({ ...t, [projectId]: data || [] })))
      .catch(() => setThreads((t) => ({ ...t, [projectId]: [] })))
      .finally(() => setLoadingThreads((p) => ({ ...p, [projectId]: false })));
  };

  const handleExpand = (projectId) => {
    const next = expandedId === projectId ? null : projectId;
    setExpandedId(next);
    if (next && !threads[next]) loadThreads(next);
  };

  const getThreadTypeForRole = () => {
    if (isDisenador) return THREAD_TYPE_DESIGN;
    if (isDesarrollo) return THREAD_TYPE_DEVELOPMENT;
    return null;
  };

  const handleOpenThread = async (projectId, variantId) => {
    if (!user?.id) return;
    const type = getThreadTypeForRole();
    if (!type && !isComercial) return;
    const key = `${projectId}-${variantId}`;
    setOpening(key);
    try {
      await catalog.openThread(projectId, variantId, type || THREAD_TYPE_DESIGN, user.id);
      loadThreads(projectId);
    } catch (err) {
      alert(err?.message || 'Error al abrir hilo');
    } finally {
      setOpening(null);
    }
  };

  const handleCloseThread = async (projectId, threadId) => {
    if (!user?.id) return;
    setClosing(threadId);
    try {
      await catalog.closeThread(threadId, user.id);
      loadThreads(projectId);
    } catch (err) {
      alert(err?.message || 'Error al cerrar hilo');
    } finally {
      setClosing(null);
    }
  };

  const filtered = projects.filter((p) =>
    (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
  );

  const getOpenThreadForVariant = (projectThreads, variantId, type) =>
    projectThreads.find((t) => String(t.variantId) === String(variantId) && t.type === type && !t.closedAt);

  const getThreadsForVariant = (projectThreads, variantId) =>
    projectThreads.filter((t) => String(t.variantId) === String(variantId));

  if (loading) {
    return <p className="hilos-loading">Cargando proyectos...</p>;
  }

  return (
    <div className="hilos-page">
      <h1>Hilos</h1>
      <p className="hilos-desc">
        Abra un hilo por producto para comunicarse con comercial. La creación se usa para métricas de tiempo.
      </p>

      <div className="hilos-search">
        <input
          type="text"
          placeholder="Buscar por consecutivo"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="hilos-empty">
          {searchText.trim() ? 'No se encontraron proyectos' : 'No hay proyectos asignados'}
        </p>
      ) : (
        <ul className="hilos-list">
          {filtered.map((p) => {
            const isExpanded = expandedId === p.id;
            const variants = p.variants || [];
            const projectThreads = threads[p.id] || [];
            const loadingT = loadingThreads[p.id];

            return (
              <li key={p.id} className="hilos-item">
                <button
                  type="button"
                  className="hilos-item-btn"
                  onClick={() => handleExpand(p.id)}
                >
                  <span className="hilos-consecutivo">{p.consecutive || p.name}</span>
                  <span> — {p.client || p.name || 'Sin cliente'}</span>
                  <span className="hilos-badge">{variants.length} producto{variants.length !== 1 ? 's' : ''}</span>
                  <span className="hilos-expand">{isExpanded ? '▼' : '▶'}</span>
                </button>
                {isExpanded && (
                  <div className="hilos-detail">
                    {loadingT ? (
                      <p className="hilos-loading-threads">Cargando...</p>
                    ) : (
                      <div className="hilos-products">
                        {variants.map((v) => {
                          const myType = getThreadTypeForRole();
                          const openThread = myType ? getOpenThreadForVariant(projectThreads, v.id, myType) : null;
                          const variantThreads = getThreadsForVariant(projectThreads, v.id);
                          const openThreads = variantThreads.filter((t) => !t.closedAt);
                          const key = `${p.id}-${v.id}`;

                          return (
                            <div key={v.id} className="hilos-product-row">
                              <div className="hilos-product-info">
                                <span className="hilos-product-code">{v.sapRef || v.baseCode || v.id}</span>
                                <span className="hilos-product-name">{v.baseName || 'Producto'}</span>
                              </div>
                              <div className="hilos-product-actions">
                                {isComercial ? (
                                  openThreads.map((t) => (
                                    <span key={t.id} className="hilos-thread-badge">
                                      {t.type === THREAD_TYPE_DESIGN ? 'Diseño' : 'Desarrollo'}
                                      <button
                                        type="button"
                                        className="hilos-close-btn"
                                        onClick={() => handleCloseThread(p.id, t.id)}
                                        disabled={closing === t.id}
                                      >
                                        {closing === t.id ? '...' : 'Cerrar'}
                                      </button>
                                    </span>
                                  ))
                                ) : openThread ? (
                                  <span className="hilos-open-badge">
                                    Hilo abierto
                                    <button
                                      type="button"
                                      className="hilos-close-btn"
                                      onClick={() => handleCloseThread(p.id, openThread.id)}
                                      disabled={closing === openThread.id}
                                    >
                                      {closing === openThread.id ? '...' : 'Cerrar'}
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="hilos-open-btn"
                                    onClick={() => handleOpenThread(p.id, v.id)}
                                    disabled={opening === key}
                                  >
                                    {opening === key ? '...' : 'Abrir hilo'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
