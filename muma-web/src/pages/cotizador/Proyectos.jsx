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

function filterCotizadorList(projects, activeTab, searchText) {
  const base =
    activeTab === 'proceso'
      ? projects.filter((p) => !p.quoted || p.reopen)
      : projects.filter((p) => p.quoted && !p.reopen);
  const q = searchText.trim().toLowerCase();
  return base.filter((p) => (p.consecutive || p.name || '').toLowerCase().includes(q));
}

function CotizadorList({
  filtered,
  searchText,
  activeTab,
  selectedId,
  setSelectedId,
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
    <div className="cotizador-sidebar-list">
      {filtered.map((p) => {
        const isSelected = selectedId === p.id;
        return (
          <button
            key={p.id}
            type="button"
            className={`cotizador-sidebar-item ${isSelected ? 'active' : ''}`}
            onClick={() => setSelectedId(p.id)}
          >
            <span className="cotizador-consecutivo">{p.consecutive || 'S/C'}</span>
            <span className="cotizador-sidebar-client">
              {(p.client || 'Sin cliente')} — {(p.name || 'Sin nombre')}
            </span>
            <div className="cotizador-sidebar-badges">
              {p.quoted && !p.reopen && <span className="cotizador-tag">✓ Cotizado</span>}
              {p.effective && <span className="cotizador-effective-tag"> (Efectivo)</span>}
            </div>
          </button>
        );
      })}
    </div>
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

  const filtered = filterCotizadorList(projects, activeTab, searchText);

  useEffect(() => {
    if (expandedId == null) return;
    if (!filterCotizadorList(projects, activeTab, searchText).some((p) => p.id === expandedId)) {
      dispatch({ type: 'SET_EXPANDED_ID', payload: null });
    }
  }, [expandedId, activeTab, searchText, projects]);

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

  const selectedProject = projects.find((p) => p.id === expandedId);
  const isCotizadosTab = activeTab === 'cotizados';

  return (
    <div className={`cotizador-page master-detail${expandedId != null ? ' master-detail--detail-open' : ''}`}>
      <div className="cotizador-sidebar">
        <div className="cotizador-sidebar-header">
          <div className="cotizador-search">
            <input
              type="text"
              placeholder="Buscar proyecto..."
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
              Proceso ({enProceso.length})
            </button>
            <button
              type="button"
              className={activeTab === 'cotizados' ? 'active' : ''}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'cotizados' })}
            >
              Cotizados ({cotizados.length})
            </button>
          </div>
        </div>

        <div className="cotizador-sidebar-content">
          {loading ? (
            <p className="cotizador-loading">Cargando...</p>
          ) : (
            <CotizadorList
              filtered={filtered}
              searchText={searchText}
              activeTab={activeTab}
              selectedId={expandedId}
              setSelectedId={(id) => dispatch({ type: 'SET_EXPANDED_ID', payload: id })}
            />
          )}
        </div>
      </div>

      <div className="cotizador-main">
        {selectedProject ? (
          <div className="cotizador-detail-view">
            <div className="cotizador-detail-header">
              <button
                type="button"
                className="cotizador-back-btn"
                onClick={() => dispatch({ type: 'SET_EXPANDED_ID', payload: null })}
              >
                ← Volver
              </button>
              <div className="cotizador-header-info">
                <h2>{selectedProject.consecutive} — {selectedProject.name}</h2>
                <div className="cotizador-meta">
                  <p><strong>Cliente:</strong> {selectedProject.client}</p>
                  <p><strong>Total:</strong> ${(selectedProject.totalCost ?? 0).toLocaleString()}</p>
                </div>
                <div className="cotizador-badges">
                  <span className="badge badge-version">v{selectedProject.version ?? 1}</span>
                  <span className="badge badge-estado">Estado: {selectedProject.state ?? 0}%</span>
                </div>
              </div>
            </div>

            <ProjectProductsTable
              variants={selectedProject.variants || []}
              projectId={selectedProject.id}
              proceso={!isCotizadosTab}
              cotizadas={isCotizadosTab}
              reopen={selectedProject.reopen}
              onQuoteClick={(v) =>
                dispatch({
                  type: 'SET_EDITING_VARIANT',
                  payload: editingVariant?.id === v.id ? null : { ...v, projectId: selectedProject.id }
                })
              }
              onToggleP3P5={handleToggleP3P5}
              onRefresh={refreshProjects}
            />
          </div>
        ) : (
          <div className="cotizador-no-selection">
            <span className="selection-icon">💰</span>
            <p>Selecciona un proyecto de la lista para gestionar la cotización</p>
          </div>
        )}
      </div>

      {editingVariant && (
        <div
          className="cotizador-quote-shell"
          role="presentation"
          onClick={() => dispatch({ type: 'SET_EDITING_VARIANT', payload: null })}
        >
          <div
            className="cotizador-quote-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cotizador-quote-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="cotizador-quote-title">Cotizar variante</h3>
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
        </div>
      )}

    </div>
  );
}
