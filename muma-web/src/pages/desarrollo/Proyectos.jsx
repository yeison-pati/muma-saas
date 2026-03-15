import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useCatalogService } from '../../hooks/useCatalogService';
import './Proyectos.css';

export default function DesarrolloProyectos() {
  const { user } = useUser();
  const catalog = useCatalogService();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [marking, setMarking] = useState(null);

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

  const handleMarkDeveloped = async (projectId, variantId) => {
    if (!user?.id) return;
    setMarking(variantId);
    try {
      await catalog.markVariantAsDeveloped(projectId, variantId, user.id);
      load();
    } catch (err) {
      alert(err?.message || 'Error al marcar desarrollado');
    } finally {
      setMarking(null);
    }
  };

  if (loading) {
    return <p className="desarrollo-loading">Cargando proyectos efectivos...</p>;
  }

  const filtered = projects.filter((p) =>
    (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
  );

  if (projects.length === 0) {
    return (
      <div className="desarrollo-page">
        <h1>Proyectos efectivos</h1>
        <p className="desarrollo-empty">No hay proyectos efectivos. Los proyectos efectivos aparecen aquí para agregar a SAP y marcar como desarrollados.</p>
      </div>
    );
  }

  return (
    <div className="desarrollo-page">
      <h1>Proyectos efectivos</h1>
      <p className="desarrollo-desc">Proyectos efectivos asignados a usted. Agregue los productos a SAP y márquelos como desarrollados cuando estén listos.</p>
      <div className="desarrollo-search">
        <input
          type="text"
          placeholder="Buscar por consecutivo"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
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
                <span> - {p.name || 'Sin nombre'}</span>
                <span className="desarrollo-badge">{variants.length} producto{variants.length !== 1 ? 's' : ''}</span>
              </button>
              {isExpanded && (
                <div className="desarrollo-detail">
                  <p>Cliente: {p.client} | Región: {p.region}</p>
                  <p>Total: ${(p.totalCost ?? 0).toLocaleString()} COP</p>
                  <ul className="desarrollo-variants">
                    {variants.map((v) => (
                      <li key={v.id} className="desarrollo-variant">
                        <span className="desarrollo-variant-info">
                          {v.sapRef || v.baseCode || v.id} - {v.baseName || 'Producto'} (x{v.quantity ?? 1})
                          {v.developedAt && <span className="desarrollo-done"> ✓ Desarrollado</span>}
                        </span>
                        {!v.developedAt && (
                          <button
                            type="button"
                            className="desarrollo-mark-btn"
                            onClick={() => handleMarkDeveloped(p.id, v.id)}
                            disabled={marking === v.id}
                          >
                            {marking === v.id ? '...' : 'Marcar desarrollado'}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
