import { useState, useEffect, useMemo } from 'react';
import { useCatalogService } from '../../hooks/useCatalogService';
import { useIdentityService } from '../../hooks/useIdentityService';
import ProjectProductsTable from '../../components/ProjectProductsTable';
import AutocompleteInput from '../../components/AutocompleteInput';
import './Proyectos.css';

export default function AdminProyectos() {
  const catalog = useCatalogService();
  const identity = useIdentityService();
  const [projects, setProjects] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
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
  const selectedProject = projects.find((p) => p.id === expandedId);

  return (
    <div className={`admin-page master-detail${expandedId != null ? ' master-detail--detail-open' : ''}`}>
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h1>Proyectos (Admin)</h1>
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
        </div>

        <div className="admin-sidebar-content">
          {loading ? (
            <p className="admin-loading">Cargando...</p>
          ) : (
            <div className="admin-sidebar-list">
              {filtered.map((p) => {
                const isSelected = expandedId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`admin-sidebar-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setExpandedId(p.id)}
                  >
                    <span className="admin-consecutivo">{p.consecutive || 'S/C'}</span>
                    <span className="admin-sidebar-client">
                      {(p.client || 'Sin cliente')} — {(p.name || 'Sin nombre')}
                    </span>
                    <div className="admin-sidebar-badges">
                      <span className={`admin-badge-mini ${p.quoted ? 'quoted' : 'pending'}`}>
                        {p.quoted ? 'Q' : 'P'}
                      </span>
                      {p.effective && <span className="admin-badge-mini effective">E</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="admin-main">
        {selectedProject ? (
          <div className="admin-detail-view">
            <div className="admin-detail-header">
              <button
                type="button"
                className="admin-back-btn"
                onClick={() => setExpandedId(null)}
              >
                ← Volver
              </button>
              <div className="admin-header-info">
                <h2>{selectedProject.consecutive} — {selectedProject.name}</h2>
                <div className="admin-meta">
                  <p><strong>Cliente:</strong> {selectedProject.client}</p>
                  <p><strong>Total:</strong> ${(selectedProject.totalCost ?? 0).toLocaleString()}</p>
                </div>
                <div className="admin-badges-row">
                  <span className="badge badge-version">v{selectedProject.version ?? 1}</span>
                  <span className="badge badge-estado">Estado: {selectedProject.state ?? 0}%</span>
                </div>
              </div>
            </div>

            <div className="admin-project-table-container">
              <ProjectProductsTable variants={selectedProject.variants || []} projectId={selectedProject.id} />
            </div>
          </div>
        ) : (
          <div className="admin-no-selection">
            <span className="selection-icon">👑</span>
            <p>Selecciona un proyecto de la lista para ver el detalle administrativo</p>
          </div>
        )}
      </div>
    </div>
  );
}
