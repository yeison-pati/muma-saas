import { useState, useEffect, useMemo } from 'react';
import { getMediaUrls } from '../api/documentService';
import ImageWithModal from './ImageWithModal';
import './ProductDetailModal.css';

/**
 * Agrupa componentes por nombre (slot). Cada opción tiene componentId y value.
 * Usa ID para identificar, nunca name/value.
 * @returns {Array<{ title: string, options: Array<{ componentId: string, value: string }> }>}
 */
function buildComponentsBySlot(variants) {
  if (!variants?.length) return [];
  const map = new Map();
  for (const v of variants) {
    for (const c of v.components || []) {
      if (!c?.id || !c?.name) continue;
      const key = c.name.trim();
      const val = c.value != null ? String(c.value).trim() : '';
      if (!val) continue;
      if (!map.has(key)) map.set(key, []);
      const opts = map.get(key);
      if (!opts.some((o) => String(o.componentId) === String(c.id))) {
        opts.push({ componentId: String(c.id), value: val });
      }
    }
  }
  return Array.from(map.entries())
    .map(([title, opts]) => ({ title, options: opts.sort((a, b) => a.value.localeCompare(b.value)) }))
    .filter((x) => x.options.length > 0);
}

/**
 * Busca variante que coincida exactamente con las selecciones (por componentId).
 */
function findMatchingVariant(variants, selectionsByCompId) {
  if (!variants?.length || !selectionsByCompId) return null;
  const selEntries = Object.entries(selectionsByCompId).filter(
    ([, v]) => v?.value != null && String(v.value).trim()
  );
  for (const v of variants) {
    const comps = v.components || [];
    if (comps.length !== selEntries.length) continue;
    const match = comps.every((c) => {
      const sel = selectionsByCompId[String(c.id)];
      return sel && String(sel.value || '').trim() === String(c.value || '').trim();
    });
    if (match) return v;
  }
  return null;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  isDesigner = false,
  onEdit,
  onDelete,
}) {
  const [modelUrl, setModelUrl] = useState(null);

  const componentsBySlot = useMemo(
    () => buildComponentsBySlot(product?.variants),
    [product?.variants]
  );

  const [selections, setSelections] = useState({});
  useEffect(() => {
    const initial = {};
    for (const { title, options } of componentsBySlot) {
      if (options.length > 0 && !initial[title]) initial[title] = { componentId: options[0].componentId, value: options[0].value };
    }
    setSelections(initial);
  }, [product?.id, componentsBySlot]);

  useEffect(() => {
    const run = async () => {
      let url = null;
      if (product?.model) {
        try {
          const res = await getMediaUrls([product.model], 'model');
          url = res.data?.[product.model] || null;
        } catch {
          url = null;
        }
      }
      setModelUrl(url);
    };
    run();
  }, [product?.model]);

  const viewerSrc = modelUrl
    ? `/viewer.html?model=${encodeURIComponent(modelUrl)}`
    : null;

  const handleSelect = (title, option) => {
    setSelections((prev) => ({ ...prev, [title]: { componentId: option.componentId, value: option.value } }));
  };

  const selectionsByCompId = useMemo(() => {
    const out = {};
    for (const sel of Object.values(selections || {})) {
      if (sel?.componentId) out[sel.componentId] = sel;
    }
    return out;
  }, [selections]);

  const matchingVariant = useMemo(
    () => findMatchingVariant(product?.variants, selectionsByCompId),
    [product?.variants, selectionsByCompId]
  );

  const handleAddToCart = () => {
    if (!onAddToCart) return;
    const caracteristicas = {};
    const _componentOriginals = {};
    const variantsList = product?.variants || [];
    for (const [, sel] of Object.entries(selections)) {
      if (!sel?.componentId || sel.value == null) continue;
      const val = String(sel.value).trim();
      if (!val) continue;
      caracteristicas[sel.componentId] = val;
      const comp = variantsList.flatMap((v) => v.components || []).find((c) => String(c.id) === String(sel.componentId));
      if (comp) {
        const origVal = comp.originalValue ?? comp.value ?? '';
        _componentOriginals[sel.componentId] = { id: comp.id, name: comp.name, sapRef: comp.sapRef, sapCode: comp.sapCode, value: origVal };
      }
    }
    const _originalCaracteristicas = {};
    const selVariant = matchingVariant || variantsList[0];
    for (const c of selVariant?.components || []) {
      if (c?.name) _originalCaracteristicas[c.name] = (c.originalValue ?? c.value ?? '').trim();
    }
    onAddToCart({
      ...product,
      caracteristicas,
      _componentOriginals,
      _originalCaracteristicas,
      _selectedVariantId: matchingVariant?.id ?? variantsList[0]?.id,
    });
  };

  const handleOverlayKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={handleOverlayKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Cerrar modal"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2>{product?.name}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-viewer">
            <div className="modal-viewer-inner">
              {viewerSrc ? (
                <iframe
                  title="3D viewer"
                  src={viewerSrc}
                  className="modal-iframe"
                />
              ) : (
                <div className="modal-viewer-placeholder">
                  {product?.fullUrl ? (
                    <ImageWithModal src={product.fullUrl} alt={product.name}>
                      <img src={product.fullUrl} alt={product.name} />
                    </ImageWithModal>
                  ) : (
                    <span>Sin vista previa</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="modal-info">
            <div className="modal-info-top">
              <p className="modal-code">REF: {product?.code}</p>
              <div className="modal-actions">
                {onAddToCart && (
                  <button
                    type="button"
                    className="modal-btn-add"
                    onClick={handleAddToCart}
                  >
                    Añadir al carrito
                  </button>
                )}
                {isDesigner && onEdit && (
                  <button
                    type="button"
                    className="modal-btn-edit"
                    onClick={() => onEdit(product)}
                  >
                    Editar
                  </button>
                )}
                {isDesigner && onDelete && (
                  <button
                    type="button"
                    className="modal-btn-delete"
                    onClick={() => onDelete(product)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
            {product?.subcategory && (
              <p className="modal-title">{product.subcategory}</p>
            )}
            {product?.category && (
              <p className="modal-type">{product.category}</p>
            )}
            {product?.line && product?.line !== 'no aplica' && (
              <p><strong>Línea:</strong> {product.line}</p>
            )}
            {product?.space && product?.space !== 'no aplica' && (
              <p><strong>Espacio:</strong> {product.space}</p>
            )}
            {product?.baseMaterial && product?.baseMaterial !== 'no aplica' && (
              <p><strong>Materia base:</strong> {product.baseMaterial}</p>
            )}

            {componentsBySlot.length > 0 && (
              <div className="modal-components-selector">
                <strong>Configuración</strong>
                {componentsBySlot.map(({ title, options }) => (
                  <div key={title} className="modal-component-group">
                    <span className="modal-component-title">{title}</span>
                    <div className="modal-component-values">
                      {options.map((opt) => (
                        <button
                          key={opt.componentId}
                          type="button"
                          className={`modal-value-chip ${selections[title]?.componentId === opt.componentId ? 'selected' : ''}`}
                          onClick={() => handleSelect(title, opt)}
                        >
                          {opt.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {matchingVariant && (
                  <p className="modal-variant-match">
                    Variante existente: {matchingVariant.sapRef || '—'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
