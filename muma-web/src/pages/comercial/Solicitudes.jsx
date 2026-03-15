import { useReducer, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useCatalogService } from '../../hooks/useCatalogService';
import { generateProjectPdf } from '../../api/documentService';
import PDFFormModal from '../../components/PDFFormModal';
import ProjectProductsTable from '../../components/ProjectProductsTable';
import { COLOMBIA_REGIONS } from '../../components/ColombiaRegionesMap';
import './Solicitudes.css';

const initialState = {
  projects: [],
  loading: true,
  activeTab: 'proceso',
  searchText: '',
  filterRegion: '',
  expandedId: null,
  pdfModal: { visible: false, project: null, products: [] },
  modificaciones: {},
};

function solicitudesReducer(state, action) {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SEARCH_TEXT':
      return { ...state, searchText: action.payload };
    case 'SET_FILTER_REGION':
      return { ...state, filterRegion: action.payload };
    case 'SET_EXPANDED_ID':
      return { ...state, expandedId: action.payload };
    case 'SET_PDF_MODAL':
      return { ...state, pdfModal: action.payload };
    case 'SET_MODIFICACIONES':
      return { ...state, modificaciones: action.payload };
    case 'UPDATE_MODIFICACION':
      return { ...state, modificaciones: action.payload };
    case 'REMOVE_MODIFICACION':
      return { ...state, modificaciones: action.payload };
    default:
      return state;
  }
}

function SolicitudesList({
  list,
  searchText,
  filterRegion,
  activeTab,
  expandedId,
  setExpandedId,
  modificaciones,
  handleReopen,
  handleMakeEffective,
  handleQuitarEffective,
  handleMakeVariantEffective,
  handleDeleteProject,
  openPdfModal,
  handleUpdateQuantity,
  handleProductUpdate,
  refreshProjects,
}) {
  if (list.length === 0) {
    return (
      <p className="solicitudes-empty">
        {searchText.trim() || filterRegion
          ? 'No se encontraron solicitudes'
          : activeTab === 'proceso'
            ? 'No tienes solicitudes en proceso'
            : 'No tienes solicitudes cotizadas'}
      </p>
    );
  }
  return (
    <ul className="solicitudes-list">
      {list.map((p) => {
        const variants = p.variants || [];
        const costoTotal = p.totalCost ?? variants.reduce((s, v) => s + (v.price ?? 0) * (v.quantity ?? 1), 0);
        const isExpanded = expandedId === p.id;
        const isCotizadas = activeTab === 'cotizadas';

        return (
          <li key={p.id} className="solicitudes-item">
            <div className="solicitudes-item-header">
              <button
                type="button"
                className="solicitudes-item-btn"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <span className="solicitudes-consecutivo">{p.consecutive || p.name}</span>
                <span className="solicitudes-name"> - {p.name || 'Sin nombre'}</span>
                {isCotizadas && p.effective && <span className="solicitudes-effective-tag"> (Efectivo)</span>}
              </button>
              {isCotizadas && (
                <div className="solicitudes-item-actions">
                  {p.effective ? (
                    <>
                      <button
                        type="button"
                        className="solicitudes-reopen-btn"
                        onClick={() => handleReopen(p.id)}
                        disabled={!modificaciones[p.id]}
                        title={modificaciones[p.id] ? 'Crea nuevo proyecto con variantes editadas + efectivas. El original pierde efectivo.' : 'Edita un producto para reabrir como nuevo proyecto'}
                      >
                        {modificaciones[p.id] ? 'Reabrir (nuevo proyecto)' : 'Edita para reabrir'}
                      </button>
                      <button
                        type="button"
                        className="solicitudes-quitar-effective-btn"
                        onClick={() => handleQuitarEffective(p.id)}
                        title="Quitar efectivo del proyecto"
                      >
                        Quitar efectivo
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="solicitudes-reopen-btn"
                        onClick={() => handleReopen(p.id)}
                        disabled={!modificaciones[p.id]}
                        title={modificaciones[p.id] ? 'Reabrir con modificaciones' : 'Edita un producto para reabrir'}
                      >
                        {modificaciones[p.id] ? 'Reabrir / nueva versión' : 'Edita para reabrir'}
                      </button>
                      <button
                        type="button"
                        className="solicitudes-effective-btn"
                        onClick={() => handleMakeEffective(p.id)}
                        title="Hacer efectivo (irreversible)"
                      >
                        Hacer efectivo
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="solicitudes-pdf-btn"
                    onClick={() => openPdfModal(p)}
                  >
                    Generar PDF
                  </button>
                  <button
                    type="button"
                    className="solicitudes-delete-btn"
                    onClick={() => handleDeleteProject(p.id)}
                    title="Eliminar proyecto (borra todo en cascada)"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
            {isExpanded && (
              <div className="solicitudes-detail">
                <div className="solicitudes-meta">
                  <p>Cliente: {p.client}</p>
                  <p>Región: {p.region}</p>
                  <p>Total: ${costoTotal?.toLocaleString?.() ?? costoTotal}</p>
                </div>
                <div className="solicitudes-badges">
                  <span className="badge badge-products">{variants.length} producto{variants.length !== 1 ? 's' : ''}</span>
                  <span className="badge badge-version">v{p.version ?? 1}</span>
                  <span className="badge badge-estado">Estado: {p.state ?? 0}%</span>
                </div>
                <ProjectProductsTable
                  variants={variants}
                  projectId={p.id}
                  modificaciones={modificaciones[p.id]}
                  cotizadas={isCotizadas}
                  allowEditableComponents={isCotizadas}
                  projectEffective={p.effective}
                  onUpdateQuantity={handleUpdateQuantity}
                  onProductUpdate={handleProductUpdate}
                  onRefresh={refreshProjects}
                  onMakeVariantEffective={p.effective ? handleMakeVariantEffective : undefined}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function ComercialSolicitudes() {
  const { user } = useUser();
  const catalog = useCatalogService();
  const [state, dispatch] = useReducer(solicitudesReducer, initialState);
  const { projects, loading, activeTab, searchText, filterRegion, expandedId, pdfModal, modificaciones } = state;

  useEffect(() => {
    if (user?.id) {
      catalog
        .getProjectsBySales(user.id)
        .then((data) => dispatch({ type: 'SET_PROJECTS', payload: data }))
        .catch(() => dispatch({ type: 'SET_PROJECTS', payload: [] }))
        .finally(() => dispatch({ type: 'SET_LOADING', payload: false }));
    }
  }, [user?.id]);

  const enProceso = projects.filter((p) => !p.quoted || p.reopen);
  const cotizadas = projects.filter((p) => p.quoted && !p.reopen);

  const filtered =
    activeTab === 'proceso'
      ? enProceso.filter((p) => {
          if (searchText.trim() && !(p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase()))
            return false;
          if (filterRegion && p.region !== filterRegion) return false;
          return true;
        })
      : cotizadas.filter((p) => {
          if (searchText.trim() && !(p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase()))
            return false;
          if (filterRegion && p.region !== filterRegion) return false;
          return true;
        });

  const refreshProjects = () => {
    if (user?.id) {
      catalog.getProjectsBySales(user.id).then((data) => dispatch({ type: 'SET_PROJECTS', payload: data }));
    }
  };

  const handleProductUpdate = (projectId, variantId, updates) => {
    const prevMod = modificaciones[projectId] || {};
    const isSameVariant = prevMod.variantId === variantId;
    const next = {
      ...modificaciones,
      [projectId]: {
        ...(isSameVariant ? prevMod : {}),
        variantId,
        ...updates,
      },
    };
    dispatch({ type: 'UPDATE_MODIFICACION', payload: next });
  };

  const handleReopen = async (projectId) => {
    const modInfo = modificaciones[projectId];
    console.log('[REOPEN] modInfo=', JSON.stringify(modInfo, null, 2));
    try {
      if (modInfo?.variantId) {
        const input = { projectId, variantId: modInfo.variantId };
        if (modInfo.quantity != null) input.quantity = modInfo.quantity;
        if (modInfo.comments != null) input.comments = modInfo.comments;
        if (modInfo.type != null) input.type = modInfo.type;
        const project = projects.find((p) => p.id === projectId);
        const variant = project?.variants?.find((v) => String(v.id) === String(modInfo.variantId));
        console.log('[REOPEN] variant=', variant?.id, 'components=', variant?.components?.map((c) => ({ id: c.id, sapRef: c.sapRef, value: c.value, originalValue: c.originalValue, catalogOriginalValue: c.catalogOriginalValue })));
        const componentsSource = modInfo.components && Object.keys(modInfo.components).length > 0
          ? modInfo.components
          : (variant?.components || []).reduce((acc, c) => (c?.id ? { ...acc, [c.id]: c.catalogOriginalValue ?? c.originalValue ?? c.value ?? '' } : acc), {});
        console.log('[REOPEN] componentsSource=', componentsSource);
        if (Object.keys(componentsSource).length > 0) {
          const compsById = (variant?.components || []).reduce((acc, c) => {
            if (c?.id) acc[c.id] = c;
            return acc;
          }, {});
          input.components = Object.entries(componentsSource).map(([componentId, value]) => {
            const comp = compsById[componentId];
            const revertTarget = comp?.catalogOriginalValue ?? comp?.originalValue ?? comp?.value ?? '';
            const origVal = String(revertTarget).trim();
            const newVal = String(value ?? '').trim();
            const modified = origVal !== newVal;
            const sapRef = comp?.sapRef || comp?.sapCode;
            const out = modified && comp
              ? { componentId: null, componentSapRef: sapRef, componentName: comp.name, value: newVal, modified: true }
              : { componentId, componentSapRef: sapRef, value: value ?? '', modified: false };
            console.log('[REOPEN] comp', componentId, 'revertTarget=', revertTarget, 'newVal=', newVal, 'modified=', modified, 'out=', out);
            return out;
          });
        }
        console.log('[REOPEN] ENVIANDO input=', JSON.stringify(input, null, 2));
        await catalog.updateVariantAndReopen(input);
      } else {
        await catalog.reOpenProject(projectId);
      }
      const next = { ...modificaciones };
      delete next[projectId];
      dispatch({ type: 'REMOVE_MODIFICACION', payload: next });
      await (user?.id ? catalog.getProjectsBySales(user.id) : Promise.resolve([])).then((data) => {
        if (Array.isArray(data)) dispatch({ type: 'SET_PROJECTS', payload: data });
      });
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'proceso' });
    } catch (err) {
      alert(err?.message || 'Error al reabrir');
    }
  };

  const handleMakeEffective = async (projectId) => {
    try {
      await catalog.makeProjectEffective(projectId);
      refreshProjects();
    } catch (err) {
      alert(err?.message || 'Error al marcar efectivo');
    }
  };

  const handleQuitarEffective = async (projectId) => {
    try {
      await catalog.quitarProjectEffective(projectId);
      refreshProjects();
    } catch (err) {
      alert(err?.message || 'Error al quitar efectivo');
    }
  };

  const handleMakeVariantEffective = async (projectId, variantId, effective) => {
    try {
      await catalog.makeVariantQuoteEffective(projectId, variantId, effective);
      refreshProjects();
    } catch (err) {
      alert(err?.message || 'Error al marcar variante efectiva');
    }
  };

  const handleUpdateQuantity = async (projectId, variantId, quantity) => {
    await catalog.updateVariantQuoteQuantity({
      projectId,
      variantId,
      quantity,
    });
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('¿Eliminar este proyecto? Se borrará todo (cotizaciones, variantes asociadas, etc.) de forma permanente.')) return;
    try {
      await catalog.deleteProject(projectId);
      refreshProjects();
    } catch (err) {
      alert(err?.message || 'Error al eliminar el proyecto');
    }
  };

  const handlePdfGenerate = async (pdfData) => {
    try {
      const blob = await generateProjectPdf(pdfData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${pdfData.projectName || 'proyecto'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      dispatch({ type: 'SET_PDF_MODAL', payload: { visible: false, project: null, products: [] } });
    } catch (err) {
      console.error('Error generando PDF', err);
      alert('No se pudo generar el PDF');
    }
  };

  const openPdfModal = (project) => {
    const mod = modificaciones[project.id];
    const products = (project.variants || []).map((v) => {
      const isModifiedVariant = mod?.variantId === v.id;
      const qty = isModifiedVariant && mod?.quantity != null ? mod.quantity : v.quantity ?? 1;
      const comments = isModifiedVariant && mod?.comments != null ? mod.comments : v.comments;
      const typeVal = isModifiedVariant && mod?.type != null ? mod.type : v.type;
      const comps = isModifiedVariant && mod?.components
        ? (v.components || []).map((c) => {
            const newVal = mod.components[c.id];
            const val = newVal !== undefined ? newVal : c.value;
            const origVal = c.originalValue ?? c.value;
            const modified = newVal !== undefined && String(newVal ?? '').trim() !== String(origVal ?? '').trim();
            return { ...c, value: val, originalValue: origVal, sapCode: modified ? null : c.sapCode };
          })
        : v.components;
      return {
        id: v.id,
        image: v.baseImage,
        price: v.price,
        quantity: qty,
        elaborationTime: v.elaborationTime,
        criticalMaterial: v.criticalMaterial,
        components: comps,
        category: v.category,
        subcategory: v.subcategory,
        line: v.line,
        space: v.space,
        type: typeVal,
        comments,
        sapRef: v.sapRef,
        sapCode: v.sapCode,
        baseCode: v.baseCode,
      };
    });
    dispatch({ type: 'SET_PDF_MODAL', payload: { visible: true, project, products } });
  };

  return (
    <div className="solicitudes-page">

      <div className="solicitudes-filters">
        <input
          type="text"
          placeholder="Buscar por consecutivo (ej: 2025...)"
          value={searchText}
          onChange={(e) => dispatch({ type: 'SET_SEARCH_TEXT', payload: e.target.value })}
        />
        <select
          value={filterRegion}
          onChange={(e) => dispatch({ type: 'SET_FILTER_REGION', payload: e.target.value })}
          className="solicitudes-region-select"
        >
          <option value="">Todas las regiones</option>
          {COLOMBIA_REGIONS.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
        <button
          type="button"
          className="solicitudes-clear-btn"
          onClick={() => { dispatch({ type: 'SET_SEARCH_TEXT', payload: '' }); dispatch({ type: 'SET_FILTER_REGION', payload: '' }); }}
        >
          Limpiar
        </button>
      </div>

      <div className="solicitudes-tabs">
        <button
          type="button"
          className={activeTab === 'proceso' ? 'active' : ''}
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'proceso' })}
        >
          En Proceso ({enProceso.length})
        </button>
        <button
          type="button"
          className={activeTab === 'cotizadas' ? 'active' : ''}
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'cotizadas' })}
        >
          Cotizadas ({cotizadas.length})
        </button>
      </div>

      {loading ? (
        <p className="solicitudes-loading">Cargando...</p>
      ) : (
        <div className="solicitudes-content">
          <SolicitudesList
            list={filtered}
            searchText={searchText}
            filterRegion={filterRegion}
            activeTab={activeTab}
            expandedId={expandedId}
            setExpandedId={(id) => dispatch({ type: 'SET_EXPANDED_ID', payload: id })}
            modificaciones={modificaciones}
            handleReopen={handleReopen}
            handleMakeEffective={handleMakeEffective}
            handleQuitarEffective={handleQuitarEffective}
            handleMakeVariantEffective={handleMakeVariantEffective}
            handleDeleteProject={handleDeleteProject}
            openPdfModal={openPdfModal}
            handleUpdateQuantity={handleUpdateQuantity}
            handleProductUpdate={handleProductUpdate}
            refreshProjects={refreshProjects}
          />
        </div>
      )}

      <PDFFormModal
        visible={pdfModal.visible}
        onClose={() => dispatch({ type: 'SET_PDF_MODAL', payload: { visible: false, project: null, products: [] } })}
        project={pdfModal.project}
        products={pdfModal.products}
        onGenerate={handlePdfGenerate}
      />
    </div>
  );
}
