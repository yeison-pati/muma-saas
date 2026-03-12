import { useState, useEffect } from 'react';
import { getMediaUrls } from '../api/documentService';
import { calculateTipologia } from '../utils/calculateTipologia';
import { getVariantDisplayCodes, getComponentDisplayCodes } from '../utils/variantComponentCodes';
import './ProjectProductsTable.css';

const EMPTY_VARIANTS = [];

function DescripcionEstructurada({ variant, typeVal, compsArr, commentsVal, caractExpanded, onToggleCaract }) {
  return (
    <div className="descripcion-estructurada">
      {variant.category && <div className="descripcion-category">{variant.category}</div>}
      {variant.subcategory && <div className="descripcion-subcategory">{variant.subcategory}</div>}
      {variant.line && <div className="descripcion-detail">Línea: {variant.line}</div>}
      {variant.space && <div className="descripcion-detail">Espacio: {variant.space}</div>}
      {typeVal && <div className="descripcion-detail">Tipología: {typeVal}</div>}
      {compsArr.length > 0 && (
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
      )}
      <div className="descripcion-comentarios">
        <span className="descripcion-comentarios-label">Comentarios:</span>
        <span className="descripcion-comentarios-text">{commentsVal || 'Sin comentarios'}</span>
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
}) {
  const [imageUrls, setImageUrls] = useState({});
  const [editingQty, setEditingQty] = useState(null);
  const [qtyValue, setQtyValue] = useState('');
  const [loading, setLoading] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState(null);
  const [expandedCaract, setExpandedCaract] = useState({}); // variantId -> bool
  const [localMods, setLocalMods] = useState({}); // variantId -> { quantity?, comments?, components?, editedComponentIds?: Record<string, true> }

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
    if (!modificaciones && variants.length > 0) {
      setLocalMods((prev) => {
        const variantIds = new Set(variants.map((v) => v.id));
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
  }, [modificaciones, variants]);

  // Cargar URLs de imágenes
  useEffect(() => {
    const keys = variants.map((v) => v.baseImage).filter(Boolean);
    if (keys.length === 0) {
      setImageUrls({});
      return;
    }
    getMediaUrls(keys, 'image')
      .then((res) => res.data || {})
      .catch(() => ({}))
      .then((data) => setImageUrls(data));
  }, [variants]);

  // Características colapsadas por defecto (el usuario hace clic para expandir)

  const getSortCode = (v) => {
    const t = String(v.type || '').toLowerCase();
    if (t === 'p3' || t === 'p5') return v.id || '';
    return v.sapRef || v.sapCode || '';
  };
  const products = [...variants].sort((a, b) =>
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

  if (products.length === 0) {
    return (
      <div className="project-products-empty">
        No hay productos en este proyecto
      </div>
    );
  }

  return (
    <div className="project-products-table-wrap">
      <div className="project-products-header">
        <span className="col-codigo">Código</span>
        <span className="col-imagen">Imagen</span>
        <span className="col-descripcion">Descripción</span>
        <span className="col-cantidad">Cantidad</span>
        <span className="col-valor">Valor</span>
        <span className="col-valor-total">Valor Total</span>
        <span className="col-tiempo">Tiempo</span>
        <span className="col-material">Material crítico</span>
        {(cotizadas || proceso) && <span className="col-acciones">Acciones</span>}
      </div>
      <div className="project-products-body">
        {products.map((v) => {
          const qty = getEffectiveQty(v);
          const price = v.price ?? 0;
          const lineTotal = price * qty;
          const time = v.elaborationTime ?? 0;
          const isEditing = editingQty === v.id;
          const imgUrl = v.baseImage ? imageUrls[v.baseImage] : null;
          const isDescExpanded = expandedDesc === v.id;
          const canEdit = allowEditableComponents && onProductUpdate;

          return (
            <div key={v.id} className="project-products-row">
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
              <div className="col-imagen">
                {imgUrl ? (
                  <img src={imgUrl} alt="" className="product-thumb" />
                ) : (
                  <div className="product-thumb-placeholder">Sin imagen</div>
                )}
              </div>
              <div className="col-descripcion">
                {canEdit ? (
                  <>
                    <DescripcionEstructurada {...buildDescripcionProps(v, true)} />
                    <button
                      type="button"
                      className="descripcion-edit-toggle"
                      onClick={() => setExpandedDesc(isDescExpanded ? null : v.id)}
                    >
                      {isDescExpanded ? '▼' : '▶'} Editar características y comentarios
                    </button>
                    {isDescExpanded && (
                      <div className="descripcion-edit">
                        {(v.components || []).map((c) => {
                          const label = c.name || c.id;
                          return (
                            <div key={c.id} className="descripcion-edit-row">
                              <label htmlFor={`comp-${v.id}-${c.id}`}>{label}:</label>
                              <input
                                id={`comp-${v.id}-${c.id}`}
                                type="text"
                                value={getEffectiveComponents(v)[c.id] ?? ''}
                                placeholder={c.catalogOriginalValue ?? c.originalValue ?? label}
                                onChange={(e) => {
                                  const updated = { ...getEffectiveComponents(v), [c.id]: e.target.value };
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
                                }}
                              />
                            </div>
                          );
                        })}
                        <div className="descripcion-edit-row">
                          <label htmlFor={`comments-${v.id}`}>Comentarios:</label>
                          <textarea
                            id={`comments-${v.id}`}
                            value={getEffectiveComments(v)}
                            onChange={(e) => notifyProductUpdate(v.id, { comments: e.target.value })}
                            placeholder="Comentarios..."
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <DescripcionEstructurada {...buildDescripcionProps(v)} />
                )}
              </div>
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
                {v.criticalMaterial || '-'}
              </div>
              {(cotizadas || proceso) && (
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
