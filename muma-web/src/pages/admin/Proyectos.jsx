import { useState, useEffect, useMemo } from 'react';
import { useCatalogService } from '../../hooks/useCatalogService';
import ProjectProductsTable from '../../components/ProjectProductsTable';
import AutocompleteInput from '../../components/AutocompleteInput';
import { COLOMBIA_REGIONS } from '../../components/ColombiaRegionesMap';
import './Proyectos.css';

export default function AdminProyectos() {
  const catalog = useCatalogService();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterConsecutivo, setFilterConsecutivo] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    catalog
      .getProjects()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const clientOptions = useMemo(
    () => [...new Set(projects.map((p) => p.client).filter(Boolean))].sort(),
    [projects]
  );

  const filtered = projects.filter((p) => {
    if (filterConsecutivo && !(p.consecutive || '').toLowerCase().includes(filterConsecutivo.toLowerCase()))
      return false;
    if (filterCliente && !(p.client || '').toLowerCase().includes(filterCliente.toLowerCase()))
      return false;
    if (filterRegion && p.region !== filterRegion) return false;
    if (filterEstado === 'cotizacion' && (p.quoted || p.effective)) return false;
    if (filterEstado === 'cotizado' && !p.quoted) return false;
    if (filterEstado === 'efectivo' && !p.effective) return false;
    return true;
  });

  return (
    <div className="admin-proyectos-page">
      <div className="admin-filters">
        <input
          type="text"
          placeholder="Consecutivo"
          value={filterConsecutivo}
          onChange={(e) => setFilterConsecutivo(e.target.value)}
        />
        <AutocompleteInput
          value={filterCliente}
          onChange={(e) => setFilterCliente(e.target.value)}
          options={clientOptions}
          placeholder="Cliente"
          name="filterCliente"
        />
        <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
          <option value="">Todas las regiones</option>
          {COLOMBIA_REGIONS.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
        <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
          <option value="">Todos</option>
          <option value="cotizacion">En cotización</option>
          <option value="cotizado">Cotizados</option>
          <option value="efectivo">Efectivos</option>
        </select>
      </div>
      {loading ? (
        <p className="admin-loading">Cargando...</p>
      ) : (
        <div className="admin-projects-list">
          {filtered.map((p) => {
            const variants = p.variants || [];
            const isExpanded = expandedId === p.id;

            return (
              <div key={p.id} className="admin-project-card">
                <button
                  type="button"
                  className="admin-project-header"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <span className="admin-consecutivo">{p.consecutive || p.name}</span>
                  <span>{p.client || '-'}</span>
                  <span>{p.region || '-'}</span>
                  <span className="admin-badge admin-badge-quoted">
                    {p.quoted ? 'Cotizado' : 'Pendiente'}
                  </span>
                  <span className="admin-badge admin-badge-effective">
                    {p.effective ? 'Efectivo' : '-'}
                  </span>
                  <span className="admin-expand">{isExpanded ? '▼' : '▶'}</span>
                </button>
                {isExpanded && (
                  <div className="admin-project-detail">
                    <div className="admin-meta">
                      <p>Cliente: {p.client}</p>
                      <p>Región: {p.region}</p>
                      <p>Total: ${(p.totalCost ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="admin-badges-row">
                      <span className="badge badge-products">{variants.length} productos</span>
                      <span className="badge badge-version">v{p.version ?? 1}</span>
                      <span className="badge badge-estado">Estado: {p.state ?? 0}%</span>
                    </div>
                    <ProjectProductsTable variants={variants} projectId={p.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
