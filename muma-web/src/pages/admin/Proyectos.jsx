import { useState, useEffect, useMemo } from 'react';
import { useCatalogService } from '../../hooks/useCatalogService';
import { useIdentityService } from '../../hooks/useIdentityService';
import ProjectProductsTable from '../../components/ProjectProductsTable';
import AutocompleteInput from '../../components/AutocompleteInput';
import { COLOMBIA_REGIONS } from '../../components/ColombiaRegionesMap';
import './Proyectos.css';

export default function AdminProyectos() {
  const catalog = useCatalogService();
  const identity = useIdentityService();
  const [projects, setProjects] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterConsecutivo, setFilterConsecutivo] = useState('');
  const [filterAño, setFilterAño] = useState('');
  const [filterComercial, setFilterComercial] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    catalog
      .getProjects()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    identity.getSales(500, 0).then((data) => setSales(data || [])).catch(() => setSales([]));
  }, [identity]);

  const clientOptions = useMemo(
    () => [...new Set(projects.map((p) => p.client).filter(Boolean))].sort(),
    [projects]
  );

  const yearOptions = useMemo(() => {
    const years = projects
      .map((p) => {
        try {
          if (p.createdAt) return new Date(p.createdAt).getFullYear();
        } catch {}
        return null;
      })
      .filter(Boolean);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [projects]);

  const filtered = projects.filter((p) => {
    if (filterConsecutivo && !(p.consecutive || '').toLowerCase().includes(filterConsecutivo.toLowerCase()))
      return false;
    if (filterCliente && !(p.client || '').toLowerCase().includes(filterCliente.toLowerCase()))
      return false;
    if (filterRegion && p.region !== filterRegion) return false;
    if (filterAño) {
      try {
        const y = p.createdAt ? new Date(p.createdAt).getFullYear() : null;
        if (String(y) !== filterAño) return false;
      } catch {
        return false;
      }
    }
    if (filterComercial && p.salesId !== filterComercial) return false;
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
          <option value="">Todos los estados</option>
          <option value="cotizacion">En cotización</option>
          <option value="cotizado">Cotizados</option>
          <option value="efectivo">Efectivos</option>
        </select>
        <select value={filterAño} onChange={(e) => setFilterAño(e.target.value)}>
          <option value="">Todos los años</option>
          {yearOptions.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
        <select value={filterComercial} onChange={(e) => setFilterComercial(e.target.value)}>
          <option value="">Todos los comerciales</option>
          {sales.map((s) => (
            <option key={s.user?.id} value={s.user?.id}>{s.user?.name || s.user?.email || s.user?.id}</option>
          ))}
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
                  <span className="admin-item-label">
                    <span className="admin-consecutivo">{p.consecutive || p.name}</span>
                    <span> - {p.client || 'Sin cliente'} - {p.name || p.consecutive || 'Sin nombre'}</span>
                  </span>
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
