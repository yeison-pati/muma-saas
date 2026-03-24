import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

const MOBILE_BREAKPOINT_PX = 768;

function useIsMobile(breakpoint = MOBILE_BREAKPOINT_PX) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint}px)`).matches
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);
  return isMobile;
}
import { getMediaUrls } from '../api/documentService';
import { useProducts } from '../context/ProductsContext';
import { calculateTipologia } from '../utils/calculateTipologia';
import { getVariantDisplayCodes, getComponentDisplayCodes } from '../utils/variantComponentCodes';
import AssignConfirmModal from './AssignConfirmModal';
import './ProjectProductsTable.css';

const EMPTY_VARIANTS = [];

/** P4: enriquece desde products en context (Catalog no llama a Products). */
function enrichVariantsWithProducts(variants, products) {
  if (!variants?.length || !products?.length) return variants || [];
  return variants.map((v) => {
    if (!v.productVariantId && v.sapRef) return v; // ya tiene datos
    const pid = v.productVariantId || v.id;
    for (const p of products) {
      const pv = p.variants?.find((pv) => String(pv.id) === String(pid));
      if (pv) {
        return {
          ...v,
          sapRef: v.sapRef ?? pv.sapRef,
          sapCode: v.sapCode ?? pv.sapCode,
          baseCode: v.baseCode ?? p.code,
          baseName: v.baseName ?? p.name,
          baseImage: v.baseImage ?? pv.image,
          category: v.category ?? p.category,
          subcategory: v.subcategory ?? p.subcategory,
          line: v.line ?? p.line,
          space: v.space ?? p.space,
          components: v.components?.length ? v.components : (pv.components || []),
        };
      }
    }
    return v;
  });
}

function DescripcionEstructurada({
  variant,
  typeVal,
  compsArr,
  commentsVal,
  caractExpanded,
  onToggleCaract,
  listSummaryOnly = false,
}) {
  return (
    <div className="descripcion-estructurada">
      {variant.category && <div className="descripcion-category">{variant.category}</div>}
      {variant.subcategory && <div className="descripcion-subcategory">{variant.subcategory}</div>}
      {variant.line && <div className="descripcion-detail">Línea: {variant.line}</div>}
      {variant.space && <div className="descripcion-detail">Espacio: {variant.space}</div>}
      {typeVal && <div className="descripcion-detail">Tipología: {typeVal}</div>}
      {compsArr.length > 0 && (
        listSummaryOnly ? (
          <div className="descripcion-detail descripcion-mobile-summary-hint">
            Características ({compsArr.length}) — toca para ver el detalle
          </div>
        ) : (
          <div className="descripcion-caracteristicas">
            <button
              type="button"
              className="descripcion-caract-toggle"
              onClick={onToggleCaract}
            >
              {caractExpanded ? '▼' : '▶'} Características ({compsArr.length})

            </button>
            {caractExpanded && (
              <div className="descripcion-chips">
                {compsArr.map((c) => (
                  <span key={c.name} className={c.codes ? 'descripcion-chip descripcion-chip-with-codes' : 'descripcion-chip'}>
                    <span className="descripcion-chip-label">{c.name}: {c.val}</span>
                    {c.codes && (
                      <div className="codigo-stack codigo-stack-fixed">
                        {c.codes.secondary ? (
                          <span className="codigo-sap">{c.codes.secondary}</span>
                        ) : (
                          <span className="codigo-sap codigo-placeholder" aria-hidden> </span>
                        )}
                        <span className={c.codes.secondary ? 'codigo-ref' : 'codigo-ref codigo-ref-only'}>{c.codes.primary}</span>
                      </div>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      )}
      <div className={`descripcion-comentarios${listSummaryOnly ? ' descripcion-comentarios--clamp' : ''}`}>
        <span className="descripcion-comentarios-label">Comentarios:</span>
        <span className="descripcion-comentarios-text">{commentsVal || 'Sin comentarios'}</span>
      </div>
    </div>
  );
}

/** Solicitudes cotizadas: metadatos + características y comentarios siempre como campos editables (sin segundo desplegable). */
function DescripcionInlineEditable({
  variant: v,
  typeVal,
  getEffectiveComponents,
  getEffectiveComments,
  onComponentChange,
  onCommentsChange,
}) {
  const comps = (v.components || []).filter((c) => c?.id);
  return (
    <div className="descripcion-inline-editable">
      <div className="descripcion-inline-meta">
        {v.category && <div className="descripcion-inline-title">{v.category}</div>}
        {v.subcategory && <div className="descripcion-inline-sub">{v.subcategory}</div>}
        <div className="descripcion-inline-details">
          {v.line && <span>Línea: {v.line}</span>}
          {v.space && <span>Espacio: {v.space}</span>}
          {typeVal != null && typeVal !== '' && <span>Tipología: {typeVal}</span>}
        </div>
      </div>
      {comps.length > 0 && (
        <div className="descripcion-inline-fields" role="group" aria-label="Características">
          {comps.map((c) => (
            <div key={c.id} className="descripcion-inline-field">
              <label htmlFor={`comp-${v.id}-${c.id}`}>{c.name || c.id}</label>
              <input
                id={`comp-${v.id}-${c.id}`}
                type="text"
                value={getEffectiveComponents(v)[c.id] ?? ''}
                placeholder={String(c.catalogOriginalValue ?? c.originalValue ?? c.value ?? '')}
                onChange={(e) => onComponentChange(v, c, e.target.value)}
                autoComplete="off"
              />
            </div>
          ))}
        </div>
      )}
      <div className="descripcion-inline-field descripcion-inline-field--full">
        <label htmlFor={`comments-${v.id}`}>Comentarios</label>
        <textarea
          id={`comments-${v.id}`}
          value={getEffectiveComments(v)}
          onChange={(e) => onCommentsChange(v.id, e.target.value)}
          placeholder="Sin comentarios"
          rows={2}
        />
      </div>
    </div>
  );
}

/**
 * Tabla de productos de un proyecto, estilo mumaviejo.
 * Muestra: Código (ref+sap según tipología), Imagen, Descripción, Cantidad, Valor, Valor Total, Tiempo.
 * Nunca muestra UUID.
 * allowEditableComponents: permite editar cantidad, características y comentarios (para reabrir con modificaciones).
 */
export default function ProjectProductsTable({
  variants = EMPTY_VARIANTS,
  projectId,
  modificaciones,
  cotizadas = false,
  proceso = false,
  reopen = false,
  allowEditableComponents = false,
  projectEffective = false,
  onUpdateQuantity,
  onProductUpdate,
  onRemoveVariant,
  onQuoteClick,
  onRefresh,
  onMakeVariantEffective,
  onToggleP3P5,
  onMarkAsDesigned,
  onMarkAsDeveloped,
  isLeader = false,
  assignRoleType,
  assignees = [],
  onAssignVariant,
  assignOnly = false,
  assignRoleFilter = null,
  assigneesQuoter = [],
  assigneesDesigner = [],
  assigneesDevelopment = [],
}) {
  const getUser = (item) => item?.user || item;
  const quotersForProject = assigneesQuoter;
  const designersForProject = assigneesDesigner;
  const developersForProject = assigneesDevelopment;

  const { products } = useProducts();
  const enrichedVariants = useMemo(() => enrichVariantsWithProducts(variants, products), [variants, products]);

  const [pendingAssign, setPendingAssign] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [editingQty, setEditingQty] = useState(null);
  const [qtyValue, setQtyValue] = useState('');
  const [loading, setLoading] = useState(null);
  const [expandedCaract, setExpandedCaract] = useState({}); // variantId -> bool
  const [localMods, setLocalMods] = useState({}); // variantId -> { quantity?, comments?, components?, editedComponentIds?: Record<string, true> }
  const isMobile = useIsMobile(MOBILE_BREAKPOINT_PX);
  const [mobileDetailId, setMobileDetailId] = useState(null);

  const displayVariants = enrichedVariants;

  useEffect(() => {
    if (!isMobile) setMobileDetailId(null);
  }, [isMobile]);

  useEffect(() => {
    if (mobileDetailId && !displayVariants.some((r) => r.id === mobileDetailId)) {
      setMobileDetailId(null);
    }
  }, [displayVariants, mobileDetailId]);

  useEffect(() => {
    if (!mobileDetailId) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileDetailId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileDetailId]);

  // Sincronizar con modificaciones del padre al montar/re-expandir (no sobrescribir ediciones locales)
  useEffect(() => {
    if (!modificaciones?.variantId || !modificaciones.components) return;
    const vid = modificaciones.variantId;
    setLocalMods((prev) => {
      if (prev[vid]?.components) return prev;
      return { ...prev, [vid]: { ...prev[vid], ...modificaciones } };
    });
  }, [projectId, modificaciones?.variantId]);

  // Limpiar localMods cuando se reabre (modificaciones se borra) para mostrar datos frescos del servidor
  useEffect(() => {
    if (!modificaciones && displayVariants.length > 0) {
      setLocalMods((prev) => {
        const variantIds = new Set(displayVariants.map((v) => v.id));
        const next = { ...prev };
        let changed = false;
        for (const vid of variantIds) {
          if (next[vid]) {
            delete next[vid];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [modificaciones, displayVariants]);

  // Cargar URLs de imágenes
  useEffect(() => {
    const keys = displayVariants.map((v) => v.baseImage).filter(Boolean);
    if (keys.length === 0) {
      setImageUrls({});
      return;
    }
    getMediaUrls(keys, 'image')
      .then((res) => res.data || {})
      .catch(() => ({}))
      .then((data) => setImageUrls(data));
  }, [displayVariants]);

  // Características colapsadas por defecto (el usuario hace clic para expandir)

  const getSortCode = (v) => {
    const t = String(v.type || '').toLowerCase();
    if (t === 'p3' || t === 'p5') return v.id || '';
    return v.sapRef || v.sapCode || '';
  };
  const rows = [...displayVariants].sort((a, b) =>
    String(getSortCode(a)).localeCompare(String(getSortCode(b)), undefined, { numeric: true })
  );

  const getVariantMods = (v) => {
    if (!modificaciones?.variantId || modificaciones.variantId !== v.id) return {};
    return localMods[v.id] || {};
  };
  const getEffectiveQty = (v) => (getVariantMods(v).quantity != null ? getVariantMods(v).quantity : v.quantity ?? 1);
  const getEffectiveComments = (v) => (getVariantMods(v).comments != null ? getVariantMods(v).comments : v.comments ?? '');
  const getEffectiveComponents = (v) => {
    const mods = getVariantMods(v).components;
    if (mods) return mods;
    const arr = v.components || [];
    return Object.fromEntries(arr.filter((c) => c.id).map((c) => [c.id, c.value ?? '']));
  };

  const notifyProductUpdate = (variantId, updates) => {
    setLocalMods((prev) => ({ ...prev, [variantId]: { ...prev[variantId], ...updates } }));
    onProductUpdate?.(projectId, variantId, updates);
  };

  const handleSaveQty = async (variantId) => {
    const qty = parseInt(qtyValue, 10);
    if (!qty || qty < 1) return;
    if (allowEditableComponents && onProductUpdate) {
      notifyProductUpdate(variantId, { quantity: qty });
      setEditingQty(null);
      setQtyValue('');
      return;
    }
    try {
      setLoading(variantId);
      await onUpdateQuantity?.(projectId, variantId, qty);
      setEditingQty(null);
      onRefresh?.();
    } catch (err) {
      alert(err?.message || 'Error al actualizar cantidad');
    } finally {
      setLoading(null);
    }
  };

  const handleComponentInputChange = (v, c, rawValue) => {
    const updated = { ...getEffectiveComponents(v), [c.id]: rawValue };
    const originalByKey = Object.fromEntries(
      (v.components || []).map((x) => [x?.name || x.id, x?.catalogOriginalValue ?? x?.originalValue ?? x?.value ?? ''])
    );
    const updatedByKey = Object.fromEntries(
      Object.entries(updated).map(([id, val]) => {
        const comp = (v.components || []).find((x) => String(x.id) === String(id));
        return [comp?.name || id, val ?? ''];
      })
    );
    const calcType = calculateTipologia(originalByKey, updatedByKey);
    const newType = v.type === 'p3' ? 'p3' : (calcType !== '' ? calcType : null);
    notifyProductUpdate(v.id, { components: updated, type: newType });
  };

  const handleRemove = async (variantId) => {
    if (!confirm('¿Quitar este producto del proyecto?')) return;
    try {
      setLoading(variantId);
      await onRemoveVariant?.(projectId, variantId);
      onRefresh?.();
    } catch (err) {
      alert(err?.message || 'Error al quitar producto');
    } finally {
      setLoading(null);
    }
  };

  /** Códigos de variante: 2 si no modificada, 1 (REF) si componentes difieren. P3 nuevo: ninguno. */
  const getVariantCodes = (v, useMods = false) => {
    const mods = getVariantMods(v);
    const typeVal = useMods && 'type' in mods ? mods.type : v.type;
    const currentComps = useMods ? getEffectiveComponents(v) : (v.components || []).reduce((o, c) => ({ ...o, [c.id]: c.value }), {});
    const originalComps = (v.components || []).reduce((o, c) => ({ ...o, [c.id]: c.catalogOriginalValue ?? c.originalValue ?? c.value }), {});
    return getVariantDisplayCodes({
      sapRef: v.sapRef,
      sapCode: v.sapCode,
      type: typeVal,
      currentByKey: currentComps,
      originalByKey: originalComps,
    });
  };

  const buildDescripcionProps = (v, useMods = false) => {
    const mods = getVariantMods(v);
    const typeVal = useMods && 'type' in mods ? mods.type : v.type;
    const comps = useMods ? getEffectiveComponents(v) : (v.components || []).reduce((o, c) => ({ ...o, [c.id]: c.value }), {});
    const compsArr = comps ? Object.entries(comps)
      .filter(([, val]) => val)
      .map(([cid, val]) => {
        const comp = (v.components || []).find((c) => c && (c.id === cid || String(c.id) === String(cid)));
        const name = comp?.name ?? cid;
        const origVal = comp?.catalogOriginalValue ?? comp?.originalValue ?? comp?.value ?? '';
        const compCodes = getComponentDisplayCodes({
          sapRef: comp?.sapRef,
          sapCode: comp?.sapCode,
          currentValue: val,
          originalValue: origVal,
        });
        return { name, val, codes: compCodes };
      })
      : [];
    const commentsVal = useMods ? getEffectiveComments(v) : v.comments;
    return {
      variant: v,
      typeVal: typeVal ?? v.type,
      compsArr,
      commentsVal,
      caractExpanded: expandedCaract[v.id],
      onToggleCaract: () => setExpandedCaract((prev) => ({ ...prev, [v.id]: !prev[v.id] })),
    };
  };

  /** Cantidad, precios, asignaciones, acciones (escritorio y modal apilado). */
  const renderRowTail = (v) => {
    const qty = getEffectiveQty(v);
    const price = v.price ?? 0;
    const lineTotal = price * qty;
    const time = v.elaborationTime ?? 0;
    const isEditing = editingQty === v.id;
    const canEdit = allowEditableComponents && onProductUpdate;
    return (
      <>
        <div className="col-cantidad">
          {(cotizadas && (onUpdateQuantity || canEdit)) ? (
            isEditing ? (
              <span className="qty-edit">
                <input
                  type="number"
                  min={1}
                  value={qtyValue}
                  onChange={(e) => setQtyValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveQty(v.id)}
                />
                <button
                  type="button"
                  className="btn-save-qty"
                  onClick={() => handleSaveQty(v.id)}
                  disabled={loading === v.id}
                >
                  ✓
                </button>
                <button
                  type="button"
                  className="btn-cancel-qty"
                  onClick={() => { setEditingQty(null); setQtyValue(''); }}
                >
                  ✕
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="btn-edit-qty"
                onClick={() => {
                  setEditingQty(v.id);
                  setQtyValue(String(getEffectiveQty(v)));
                }}
                title="Editar cantidad"
              >
                {qty}
              </button>
            )
          ) : (
            qty
          )}
        </div>
        <div className="col-valor">
          {price ? `$ ${price.toLocaleString()} COP` : '-'}
        </div>
        <div className="col-valor-total">
          ${lineTotal.toLocaleString()} COP
        </div>
        <div className="col-tiempo">
          {time ? `${time} días` : '-'}
        </div>
        <div className="col-material">
          <span>{v.criticalMaterial || '-'}</span>
        </div>
        {assignOnly && (
          <>
            {(!assignRoleFilter || assignRoleFilter === 'QUOTER') && (
              <div className="col-asignar" data-mobile-label="Cotizador">
                <select
                  className="btn-assign-select"
                  value={pendingAssign?.variantId === v.id ? pendingAssign.assigneeId : (v.assignedQuoterId || '')}
                  onChange={(e) => {
                    const assigneeId = e.target.value;
                    if (!assigneeId) return;
                    const item = quotersForProject.find((q) => (getUser(q)?.id || q.id) === assigneeId);
                    const u = getUser(item);
                    setPendingAssign({
                      variantId: v.id,
                      roleType: 'QUOTER',
                      assigneeId,
                      assigneeName: u?.name || u?.email || '—',
                      count: item?.projects ?? null,
                    });
                  }}
                  disabled={!!v.assignedQuoterId}
                  title={v.assignedQuoterId ? 'Ya asignado (no se puede cambiar)' : 'Asignar cotizador (solo de la región del proyecto)'}
                >
                  <option value="">—</option>
                  {quotersForProject.map((item) => {
                    const u = getUser(item);
                    const cnt = item?.projects ?? 0;
                    const label = cnt != null ? `${u?.name || u?.email || '—'} (${cnt})` : (u?.name || u?.email || '—');
                    return (
                      <option key={u?.id || item.id} value={u?.id || item.id}>{label}</option>
                    );
                  })}
                </select>
              </div>
            )}
            {(!assignRoleFilter || assignRoleFilter === 'DESIGNER') && (
              <div className="col-asignar" data-mobile-label="Diseñador">
                <select
                  className="btn-assign-select"
                  value={pendingAssign?.variantId === v.id ? pendingAssign.assigneeId : (v.assignedDesignerId || '')}
                  onChange={(e) => {
                    const assigneeId = e.target.value;
                    if (!assigneeId) return;
                    const item = designersForProject.find((d) => (getUser(d)?.id || d.id) === assigneeId);
                    const u = getUser(item);
                    setPendingAssign({
                      variantId: v.id,
                      roleType: 'DESIGNER',
                      assigneeId,
                      assigneeName: u?.name || u?.email || '—',
                      count: item?.created ?? item?.edited ?? null,
                    });
                  }}
                  disabled={!!v.assignedDesignerId}
                  title={v.assignedDesignerId ? 'Ya asignado (no se puede cambiar)' : 'Asignar diseñador (solo de la región del proyecto)'}
                >
                  <option value="">—</option>
                  {designersForProject.map((item) => {
                    const u = getUser(item);
                    const cnt = item?.created ?? item?.edited ?? 0;
                    const label = cnt != null ? `${u?.name || u?.email || '—'} (${cnt})` : (u?.name || u?.email || '—');
                    return (
                      <option key={u?.id || item.id} value={u?.id || item.id}>{label}</option>
                    );
                  })}
                </select>
              </div>
            )}
            {(!assignRoleFilter || assignRoleFilter === 'DEVELOPMENT') && (
              <div className="col-asignar" data-mobile-label="Desarrollo">
                <select
                  className="btn-assign-select"
                  value={pendingAssign?.variantId === v.id ? pendingAssign.assigneeId : (v.assignedDevelopmentUserId || '')}
                  onChange={(e) => {
                    const assigneeId = e.target.value;
                    if (!assigneeId) return;
                    const item = developersForProject.find((d) => (getUser(d)?.id || d.id) === assigneeId);
                    const u = getUser(item);
                    setPendingAssign({
                      variantId: v.id,
                      roleType: 'DEVELOPMENT',
                      assigneeId,
                      assigneeName: u?.name || u?.email || '—',
                      count: null,
                    });
                  }}
                  disabled={!!v.assignedDevelopmentUserId}
                  title={v.assignedDevelopmentUserId ? 'Ya asignado (no se puede cambiar)' : 'Asignar desarrollo (solo de la región del proyecto)'}
                >
                  <option value="">—</option>
                  {developersForProject.map((item) => {
                    const u = getUser(item);
                    return (
                      <option key={u?.id || item.id} value={u?.id || item.id}>{u?.name || u?.email || '—'}</option>
                    );
                  })}
                </select>
              </div>
            )}
          </>
        )}
        {(cotizadas || proceso || onMarkAsDesigned || onMarkAsDeveloped) && !assignOnly && (
          <div className="col-acciones">
            {proceso && onQuoteClick && (reopen || v.price == null) ? (
              <button
                type="button"
                className="btn-quote"
                onClick={() => onQuoteClick(v)}
                title="Cotizar"
              >
                Cotizar
              </button>
            ) : cotizadas && projectEffective && onMakeVariantEffective ? (
              <button
                type="button"
                className={v.effective ? 'btn-effective-on' : 'btn-effective-off'}
                onClick={() => onMakeVariantEffective(projectId, v.id, !v.effective)}
                disabled={loading === v.id}
                title={v.effective ? 'Marcado efectivo' : 'Marcar efectivo'}
              >
                {v.effective ? '✓ Efectivo' : 'Marcar efectivo'}
              </button>
            ) : cotizadas && onRemoveVariant ? (
              <button
                type="button"
                className="btn-remove"
                onClick={() => handleRemove(v.id)}
                disabled={loading === v.id}
                title="Quitar del proyecto"
              >
                Quitar
              </button>
            ) : null}
            {onToggleP3P5 && (v.type === 'p3' || v.type === 'p5') && (
              <button
                type="button"
                className="btn-toggle-p3p5"
                onClick={() => onToggleP3P5(projectId, v.id)}
                disabled={loading === v.id}
                title="Alternar P3 ↔ P5"
              >
                P3↔P5
              </button>
            )}
            {onMarkAsDesigned && v.quotedAt && !v.designedAt && (
              <button
                type="button"
                className="btn-mark-designed"
                onClick={() => onMarkAsDesigned(projectId, v.id)}
                disabled={loading === v.id}
                title="Marcar como diseñado"
              >
                Marcar diseñado
              </button>
            )}
            {onMarkAsDeveloped && v.designedAt && !v.developedAt && (
              <button
                type="button"
                className="btn-mark-developed"
                onClick={() => onMarkAsDeveloped(projectId, v.id)}
                disabled={loading === v.id}
                title="Marcar como desarrollado"
              >
                Marcar desarrollado
              </button>
            )}
            {onMarkAsDeveloped && v.developedAt && (
              <span className="desarrollo-done">✓ Desarrollado</span>
            )}
            {isLeader && assignRoleType && assignees.length > 0 && onAssignVariant && (
              <select
                className="btn-assign-select"
                value={
                  assignRoleType === 'QUOTER' ? (v.assignedQuoterId || '') :
                  assignRoleType === 'DESIGNER' ? (v.assignedDesignerId || '') :
                  (v.assignedDevelopmentUserId || '')
                }
                onChange={(e) => {
                  const assigneeId = e.target.value;
                  if (assigneeId) onAssignVariant(projectId, v.id, assigneeId, assignRoleType);
                }}
                title={`Asignar ${assignRoleType === 'QUOTER' ? 'cotizador' : assignRoleType === 'DESIGNER' ? 'diseñador' : 'desarrollo'}`}
              >
                <option value="">Asignar...</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name || a.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </>
    );
  };

  const renderCodigoBlock = (v, canEdit) => (
    <div className="col-codigo">
      {(() => {
        const codes = getVariantCodes(v, canEdit);
        if (!codes) return <span className="codigo-empty">—</span>;
        const { primary, secondary } = codes;
        return (
          <div className="codigo-stack codigo-stack-fixed">
            {secondary ? (
              <span className="codigo-sap">{secondary}</span>
            ) : (
              <span className="codigo-sap codigo-placeholder" aria-hidden> </span>
            )}
            <span className={secondary ? 'codigo-ref' : 'codigo-ref codigo-ref-only'}>{primary}</span>
          </div>
        );
      })()}
    </div>
  );

  const renderImagenBlock = (v, imgUrl) => (
    <div className="col-imagen">
      {imgUrl ? (
        <img src={imgUrl} alt="" className="product-thumb" />
      ) : (
        <div className="product-thumb-placeholder">Sin imagen</div>
      )}
    </div>
  );

  const renderDescripcionBlock = (v, listSummaryOnly) => {
    const canEdit = allowEditableComponents && onProductUpdate;
    const mods = getVariantMods(v);
    const typeValInline = 'type' in mods && mods.type != null ? mods.type : v.type;
    return (
      <div className="col-descripcion">
        {cotizadas && canEdit && !listSummaryOnly ? (
          <DescripcionInlineEditable
            variant={v}
            typeVal={typeValInline}
            getEffectiveComponents={getEffectiveComponents}
            getEffectiveComments={getEffectiveComments}
            onComponentChange={handleComponentInputChange}
            onCommentsChange={(variantId, text) => notifyProductUpdate(variantId, { comments: text })}
          />
        ) : canEdit && listSummaryOnly ? (
          <DescripcionEstructurada {...buildDescripcionProps(v, true)} listSummaryOnly />
        ) : (
          <DescripcionEstructurada {...buildDescripcionProps(v)} listSummaryOnly={listSummaryOnly} />
        )}
      </div>
    );
  };

  if (rows.length === 0) {
    return (
      <div className="project-products-empty">
        No hay productos en este proyecto
      </div>
    );
  }

  const mobileDetailVariant = mobileDetailId ? rows.find((r) => r.id === mobileDetailId) : null;

  return (
    <div className="project-products-table-wrap" role="region" aria-label="Productos del proyecto">
      <div className="project-products-header">
        <span className="col-codigo">Código</span>
        <span className="col-imagen">Imagen</span>
        <span className="col-descripcion">Descripción</span>
        <span className="project-products-header-desktop-only col-cantidad">Cantidad</span>
        <span className="project-products-header-desktop-only col-valor">Valor</span>
        <span className="project-products-header-desktop-only col-valor-total">Valor Total</span>
        <span className="project-products-header-desktop-only col-tiempo">Tiempo</span>
        <span className="project-products-header-desktop-only col-material">Material crítico</span>
        {assignOnly && (
          <>
            {(!assignRoleFilter || assignRoleFilter === 'QUOTER') && <span className="project-products-header-desktop-only col-asignar">Cotizador</span>}
            {(!assignRoleFilter || assignRoleFilter === 'DESIGNER') && <span className="project-products-header-desktop-only col-asignar">Diseñador</span>}
            {(!assignRoleFilter || assignRoleFilter === 'DEVELOPMENT') && <span className="project-products-header-desktop-only col-asignar">Desarrollo</span>}
          </>
        )}
        {(cotizadas || proceso || onMarkAsDesigned || onMarkAsDeveloped) && !assignOnly && <span className="project-products-header-desktop-only col-acciones">Acciones</span>}
      </div>
      <div className="project-products-body">
        {rows.map((v) => {
          const imgUrl = v.baseImage ? imageUrls[v.baseImage] : null;
          const canEdit = allowEditableComponents && onProductUpdate;

          return (
            <div key={v.id} className={`project-products-row${isMobile ? ' project-products-row--mobile' : ''}`}>
              {isMobile ? (
                <div
                  className="project-products-mobile-hit"
                  role="button"
                  tabIndex={0}
                  onClick={() => setMobileDetailId(v.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMobileDetailId(v.id);
                    }
                  }}
                  aria-label="Ver detalle del producto"
                >
                  {renderCodigoBlock(v, canEdit)}
                  {renderImagenBlock(v, imgUrl)}
                  {renderDescripcionBlock(v, true)}
                  <span className="project-products-mobile-hit-chevron" aria-hidden>›</span>
                </div>
              ) : (
                <>
                  {renderCodigoBlock(v, canEdit)}
                  {renderImagenBlock(v, imgUrl)}
                  {renderDescripcionBlock(v, false)}
                  {renderRowTail(v)}
                </>
              )}
            </div>
          );
        })}
      </div>
      {isMobile &&
        mobileDetailVariant &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="project-product-mobile-modal-backdrop"
            role="presentation"
            onClick={() => setMobileDetailId(null)}
          >
            <div
              className="project-product-mobile-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-product-mobile-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="project-product-mobile-modal-header">
                <h2 id="project-product-mobile-modal-title" className="project-product-mobile-modal-title">
                  Detalle del producto
                </h2>
                <button
                  type="button"
                  className="project-product-mobile-modal-close"
                  onClick={() => setMobileDetailId(null)}
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
              <div className="project-product-mobile-modal-scroll">
                <div className="ppm-modal-hero">
                  {renderImagenBlock(
                    mobileDetailVariant,
                    mobileDetailVariant.baseImage ? imageUrls[mobileDetailVariant.baseImage] : null
                  )}
                  {renderCodigoBlock(mobileDetailVariant, allowEditableComponents && !!onProductUpdate)}
                </div>
                {renderDescripcionBlock(mobileDetailVariant, false)}
                <div className="ppm-modal-stack">
                  {renderRowTail(mobileDetailVariant)}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      {assignOnly && (
        <AssignConfirmModal
          visible={!!pendingAssign}
          roleLabel={pendingAssign?.roleType === 'QUOTER' ? 'cotizador' : pendingAssign?.roleType === 'DESIGNER' ? 'diseñador' : 'desarrollo'}
          assigneeName={pendingAssign?.assigneeName}
          count={pendingAssign?.count}
          onConfirm={async () => {
            if (!pendingAssign) return;
            try {
              await onAssignVariant?.(projectId, pendingAssign.variantId, pendingAssign.assigneeId, pendingAssign.roleType);
            } catch (err) {
              alert(err?.message || 'Error al asignar');
            } finally {
              setPendingAssign(null);
            }
          }}
          onCancel={() => setPendingAssign(null)}
        />
      )}
    </div>
  );
}
