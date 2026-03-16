import { useReducer, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useCatalogService } from '../../hooks/useCatalogService';
import ProjectProductsTable from '../../components/ProjectProductsTable';
import './Proyectos.css';

const initialState = {
  projects: [],
  loading: true,
  activeTab: 'proceso',
  searchText: '',
  expandedId: null,
  editingVariant: null,
};

function cotizadorReducer(state, action) {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SEARCH_TEXT':
      return { ...state, searchText: action.payload };
    case 'SET_EXPANDED_ID':
      return { ...state, expandedId: action.payload };
    case 'SET_EDITING_VARIANT':
      return { ...state, editingVariant: action.payload };
    default:
      return state;
  }
}

function CotizadorList({
  filtered,
  searchText,
  activeTab,
  expandedId,
  setExpandedId,
  setEditingVariant,
  editingVariant,
  refreshProjects,
  onToggleP3P5,
}) {
  if (filtered.length === 0) {
    return (
      <p className="cotizador-empty">
        {searchText.trim()
          ? 'No se encontraron proyectos'
          : activeTab === 'proceso'
            ? 'No hay proyectos en proceso'
            : 'No hay proyectos cotizados'}
      </p>
    );
  }
  return (
    <ul className="cotizador-list">
      {filtered.map((p) => {
        const variants = p.variants || [];
        const isExpanded = expandedId === p.id;
        const isCotizados = activeTab === 'cotizados';

        return (
          <li key={p.id} className="cotizador-item">
            <button
              type="button"
              className="cotizador-item-btn"
              onClick={() => setExpandedId(isExpanded ? null : p.id)}
            >
              <span className="cotizador-consecutivo">{p.consecutive || p.name}</span>
              <span> - {p.client || 'Sin cliente'} - {p.name || p.consecutive || 'Sin nombre'}</span>
              {p.quoted && !p.reopen && <span className="cotizador-tag"> ✓ Cotizado</span>}
              {p.effective && <span className="cotizador-effective-tag"> (Efectivo)</span>}
            </button>
            {isExpanded && (
              <div className="cotizador-detail">
                <div className="cotizador-meta">
                  <p>Cliente: {p.client} | Región: {p.region}</p>
                  <p>Total: ${(p.totalCost ?? 0).toLocaleString()}</p>
                </div>
                <div className="cotizador-badges">
                  <span className="badge badge-products">{variants.length} producto{variants.length !== 1 ? 's' : ''}</span>
                  <span className="badge badge-version">v{p.version ?? 1}</span>
                  <span className="badge badge-estado">Estado: {p.state ?? 0}%</span>
                </div>
                {activeTab === 'proceso' && (
                  <ProjectProductsTable
                    variants={variants}
                    projectId={p.id}
                    proceso
                    reopen={p.reopen}
                    onQuoteClick={(v) =>
                      setEditingVariant(
                        editingVariant?.id === v.id ? null : { ...v, projectId: p.id }
                      )
                    }
                    onToggleP3P5={onToggleP3P5}
                    onRefresh={refreshProjects}
                  />
                )}
                {isCotizados && (
                  <ProjectProductsTable
                    variants={variants}
                    projectId={p.id}
                    cotizadas
                    onRefresh={refreshProjects}
                    onToggleP3P5={onToggleP3P5}
                  />
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function CotizadorProyectos() {
  const { user } = useUser();
  const catalog = useCatalogService();
  const [state, dispatch] = useReducer(cotizadorReducer, initialState);
  const { projects, loading, activeTab, searchText, expandedId, editingVariant } = state;

  useEffect(() => {
    if (user?.id) {
      catalog
        .getProjectsByAssignedQuoter(user.id)
        .then((data) => dispatch({ type: 'SET_PROJECTS', payload: data }))
        .catch(() => dispatch({ type: 'SET_PROJECTS', payload: [] }))
        .finally(() => dispatch({ type: 'SET_LOADING', payload: false }));
    }
  }, [user?.id]);

  const enProceso = projects.filter((p) => !p.quoted || p.reopen);
  const cotizados = projects.filter((p) => p.quoted && !p.reopen);

  const filtered =
    activeTab === 'proceso'
      ? enProceso.filter((p) =>
          (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
        )
      : cotizados.filter((p) =>
          (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
        );

  const refreshProjects = () => {
    if (user?.id) {
      catalog.getProjectsByAssignedQuoter(user.id).then((data) => dispatch({ type: 'SET_PROJECTS', payload: data }));
    }
  };

  const handleQuoteVariant = async (projectId, variantId, price, elaborationTime, criticalMaterial) => {
    try {
      await catalog.quoteVariant({
        projectId,
        variantId,
        quoterId: user.id,
        price: parseInt(price, 10) || 0,
        elaborationTime: parseInt(elaborationTime, 10) || 0,
        criticalMaterial: criticalMaterial?.trim() || null,
      });
      dispatch({ type: 'SET_EDITING_VARIANT', payload: null });
      refreshProjects();
    } catch (err) {
      alert(err?.message || 'Error al cotizar');
    }
  };

  const handleToggleP3P5 = async (projectId, variantId) => {
    try {
      await catalog.toggleP3P5(projectId, variantId);
      refreshProjects();
    } catch (err) {
      alert(err?.message || 'Error al alternar P3/P5');
    }
  };

  return (
    <div className="cotizador-page">

      <div className="cotizador-search">
        <input
          type="text"
          placeholder="Buscar por consecutivo (ej: 2025...)"
          value={searchText}
          onChange={(e) => dispatch({ type: 'SET_SEARCH_TEXT', payload: e.target.value })}
        />
      </div>

      <div className="cotizador-tabs">
        <button
          type="button"
          className={activeTab === 'proceso' ? 'active' : ''}
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'proceso' })}
        >
          En Proceso ({enProceso.length})
        </button>
        <button
          type="button"
          className={activeTab === 'cotizados' ? 'active' : ''}
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'cotizados' })}
        >
          Cotizados ({cotizados.length})
        </button>
      </div>

      {loading ? (
        <p className="cotizador-loading">Cargando...</p>
      ) : (
        <div className="cotizador-content">
          <CotizadorList
            filtered={filtered}
            searchText={searchText}
            activeTab={activeTab}
            expandedId={expandedId}
            setExpandedId={(id) => dispatch({ type: 'SET_EXPANDED_ID', payload: id })}
            setEditingVariant={(v) => dispatch({ type: 'SET_EDITING_VARIANT', payload: v })}
            editingVariant={editingVariant}
            refreshProjects={refreshProjects}
            onToggleP3P5={handleToggleP3P5}
          />
        </div>
      )}

      {editingVariant && (
        <div className="cotizador-quote-modal">
          <h3>Cotizar variante</h3>
          <label htmlFor="quote-price">Precio</label>
          <input
            type="number"
            id="quote-price"
            placeholder="0"
            defaultValue={editingVariant.price}
          />
          <label htmlFor="quote-time">Tiempo elaboración (días)</label>
          <input
            type="number"
            id="quote-time"
            placeholder="0"
            defaultValue={editingVariant.elaborationTime}
          />
          <label htmlFor="quote-critical-material">Material crítico</label>
          <input
            type="text"
            id="quote-critical-material"
            placeholder="Opcional"
            defaultValue={editingVariant.criticalMaterial}
          />
          <div className="cotizador-quote-actions">
            <button type="button" onClick={() => dispatch({ type: 'SET_EDITING_VARIANT', payload: null })}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                const price = document.getElementById('quote-price')?.value;
                const time = document.getElementById('quote-time')?.value;
                const criticalMaterial = document.getElementById('quote-critical-material')?.value;
                handleQuoteVariant(
                  editingVariant.projectId,
                  editingVariant.id,
                  price,
                  time,
                  criticalMaterial
                );
              }}
            >
              Guardar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
