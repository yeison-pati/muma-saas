import { useState, useEffect, useMemo } from 'react';
import { getMediaUrls } from '../api/documentService';
import ImageWithModal from './ImageWithModal';
import './ProductDetailModal.css';

/**
 * Selección inicial / al elegir miniatura: valores de cada slot según una variante concreta.
 */
function selectionsFromVariant(variant, componentsBySlot) {
  const initial = {};
  if (!variant?.components || !componentsBySlot?.length) return initial;
  for (const { title, options } of componentsBySlot) {
    const comp = variant.components.find((c) => (c?.name || '').trim() === title);
    if (!comp?.id) continue;
    const val = String(comp.value ?? '').trim();
    const opt =
      options.find(
        (o) => String(o.componentId) === String(comp.id) && String(o.value).trim() === val
      ) || options.find((o) => String(o.componentId) === String(comp.id));
    if (opt) initial[title] = { componentId: opt.componentId, value: opt.value };
  }
  return initial;
}

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

/** Mejor coincidencia parcial por chips elegidos (imagen/modelo acorde al color, etc.). */
function findPreviewVariant(variants, selectionsByCompId) {
  const exact = findMatchingVariant(variants, selectionsByCompId);
  if (exact) return exact;
  const selEntries = Object.entries(selectionsByCompId || {}).filter(
    ([, v]) => v?.value != null && String(v.value).trim()
  );
  if (!variants?.length || !selEntries.length) return variants?.[0] || null;
  let best = variants[0];
  let bestScore = -1;
  for (const v of variants) {
    let score = 0;
    for (const [compId, sel] of selEntries) {
      const c = v.components?.find((x) => String(x.id) === String(compId));
      if (c && String(c.value || '').trim() === String(sel.value || '').trim()) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best;
}

function isGltfPublicUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const path = url.split('?')[0].toLowerCase();
  return path.endsWith('.glb') || path.endsWith('.gltf');
}

/** Tipo de archivo desde URL (DWG, STEP, etc.) — todo en la misma vista, sin visores externos. */
function cadFormatFromUrl(url) {
  if (!url || typeof url !== 'string') return { ext: 'CAD', blurb: 'archivo técnico' };
  let path = url;
  try {
    path = new URL(url, 'https://placeholder.local').pathname;
  } catch {
    path = url.split('?')[0];
  }
  const m = path.match(/\.([a-z0-9]{1,12})$/i);
  const ext = m ? m[1].toUpperCase() : 'ARCHIVO';
  const blurbs = {
    DWG: 'plano o modelo DWG',
    DXF: 'intercambio DXF',
    STEP: 'modelo STEP',
    STP: 'modelo STEP',
    IFC: 'modelo BIM IFC',
    PDF: 'documento PDF',
  };
  return { ext, blurb: blurbs[ext] || 'archivo técnico' };
}

/** Carrusel: una diapositiva por variante (imagen) + una al final con el modelo (GLB/CAD) si existe. */
function buildMediaSlides(variants, modelUrl) {
  const list = (variants || []).map((v) => ({
    type: 'image',
    key: `img-${v.id}`,
    variant: v,
  }));
  if (modelUrl) {
    list.push({ type: 'model', key: 'model' });
  }
  return list;
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
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const componentsBySlot = useMemo(
    () => buildComponentsBySlot(product?.variants),
    [product?.variants]
  );

  const [selections, setSelections] = useState({});
  useEffect(() => {
    const v0 = product?.variants?.[0];
    if (!v0 || !componentsBySlot.length) {
      setSelections({});
      return;
    }
    setSelections(selectionsFromVariant(v0, componentsBySlot));
  }, [product?.id, componentsBySlot]);

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

  const previewVariant = useMemo(
    () =>
      findPreviewVariant(product?.variants, selectionsByCompId),
    [product?.variants, selectionsByCompId]
  );

  useEffect(() => {
    const key = previewVariant?.model;
    if (!key) {
      setModelUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getMediaUrls([key], 'model');
        if (!cancelled) setModelUrl(res.data?.[key] || null);
      } catch {
        if (!cancelled) setModelUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewVariant?.model, previewVariant?.id]);

  useEffect(() => {
    const key = previewVariant?.image;
    if (!key) {
      setPreviewImageUrl(product?.fullUrl ?? null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getMediaUrls([key], 'image');
        if (!cancelled) setPreviewImageUrl(res.data?.[key] || product?.fullUrl || null);
      } catch {
        if (!cancelled) setPreviewImageUrl(product?.fullUrl ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewVariant?.image, previewVariant?.id, product?.fullUrl]);

  const slides = useMemo(
    () => buildMediaSlides(product?.variants, modelUrl),
    [product?.variants, modelUrl]
  );

  useEffect(() => {
    setActiveSlideIndex(0);
  }, [product?.id]);

  useEffect(() => {
    setActiveSlideIndex((prev) =>
      slides.length === 0 ? 0 : Math.min(prev, slides.length - 1)
    );
  }, [slides.length]);

  const slideSyncKey = useMemo(
    () =>
      `${(product?.variants || []).map((v) => v.id).join(',')}#${modelUrl ? '1' : '0'}`,
    [product?.variants, modelUrl]
  );

  /** Si cambian los chips, alinear la foto con la variante en vista; no sacar al usuario de la diapositiva «Modelo». */
  useEffect(() => {
    if (!previewVariant?.id) return;
    const slideList = buildMediaSlides(product?.variants, modelUrl);
    if (slideList.length === 0) return;
    const modelIdx = slideList.findIndex((s) => s.type === 'model');
    setActiveSlideIndex((prev) => {
      if (modelIdx >= 0 && prev === modelIdx) return prev;
      const imgIdx = slideList.findIndex(
        (s) =>
          s.type === 'image' && String(s.variant?.id) === String(previewVariant.id)
      );
      if (imgIdx >= 0) return imgIdx;
      return prev;
    });
  }, [previewVariant?.id, slideSyncKey]);

  const viewerSrc =
    modelUrl && isGltfPublicUrl(modelUrl)
      ? `/viewer.html?model=${encodeURIComponent(modelUrl)}`
      : null;

  const showCadFallback = Boolean(modelUrl) && !viewerSrc;

  const cadFormat = useMemo(() => cadFormatFromUrl(modelUrl), [modelUrl]);

  const handleSelect = (title, option) => {
    setSelections((prev) => ({ ...prev, [title]: { componentId: option.componentId, value: option.value } }));
  };

  const handlePickVariantThumb = (variant) => {
    setSelections(selectionsFromVariant(variant, componentsBySlot));
  };

  const goPrevSlide = () => {
    if (slides.length < 2) return;
    const next = (activeSlideIndex - 1 + slides.length) % slides.length;
    setActiveSlideIndex(next);
    const s = slides[next];
    if (s?.type === 'image') {
      setSelections(selectionsFromVariant(s.variant, componentsBySlot));
    }
  };

  const goNextSlide = () => {
    if (slides.length < 2) return;
    const next = (activeSlideIndex + 1) % slides.length;
    setActiveSlideIndex(next);
    const s = slides[next];
    if (s?.type === 'image') {
      setSelections(selectionsFromVariant(s.variant, componentsBySlot));
    }
  };

  const activeSlide = slides[activeSlideIndex] ?? null;

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
      image: selVariant?.image,
      fullUrl: previewImageUrl ?? product.fullUrl,
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
            <div className="modal-viewer-layout">
              {slides.length > 0 && (
                <aside className="modal-variant-thumbs" aria-label="Vista: fotos y modelo">
                  {slides.map((s, i) => (
                    <button
                      key={s.key}
                      type="button"
                      className={`modal-variant-thumb ${activeSlideIndex === i ? 'is-active' : ''} ${s.type === 'model' ? 'modal-variant-thumb--model' : ''}`}
                      onClick={() => {
                        setActiveSlideIndex(i);
                        if (s.type === 'image') handlePickVariantThumb(s.variant);
                      }}
                      title={
                        s.type === 'model'
                          ? 'Modelo 3D / archivo'
                          : s.variant.sapRef || 'Foto variante'
                      }
                    >
                      {s.type === 'image' ? (
                        s.variant.fullUrl ? (
                          <img src={s.variant.fullUrl} alt="" loading="lazy" draggable={false} />
                        ) : (
                          <span className="modal-variant-thumb-fallback" aria-hidden>
                            ?
                          </span>
                        )
                      ) : (
                        <span className="modal-variant-thumb-model">3D</span>
                      )}
                    </button>
                  ))}
                </aside>
              )}
              <div className="modal-viewer-render">
              <div className="modal-viewer-stage">
                {slides.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="modal-carousel-arrow modal-carousel-arrow--prev"
                      onClick={goPrevSlide}
                      aria-label="Vista anterior"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="modal-carousel-arrow modal-carousel-arrow--next"
                      onClick={goNextSlide}
                      aria-label="Vista siguiente"
                    >
                      ›
                    </button>
                  </>
                )}
                <div className="modal-viewer-inner">
                  {activeSlide?.type === 'image' && (
                    <div className="modal-viewer-placeholder">
                      {activeSlide.variant.fullUrl ? (
                        <ImageWithModal
                          src={activeSlide.variant.fullUrl}
                          alt={product.name}
                        >
                          <img src={activeSlide.variant.fullUrl} alt={product.name} />
                        </ImageWithModal>
                      ) : (
                        <span>Sin imagen</span>
                      )}
                    </div>
                  )}
                  {activeSlide?.type === 'model' &&
                    (viewerSrc ? (
                      <iframe title="3D viewer" src={viewerSrc} className="modal-iframe" />
                    ) : showCadFallback ? (
                      <div className="modal-cad-fallback">
                        <div className="modal-cad-hero">
                          {previewImageUrl ? (
                            <img
                              src={previewImageUrl}
                              alt=""
                              className="modal-cad-hero-img"
                            />
                          ) : (
                            <div className="modal-cad-hero-empty" aria-hidden />
                          )}
                          <span className="modal-cad-badge" title={cadFormat.blurb}>
                            {cadFormat.ext}
                          </span>
                        </div>
                        <div className="modal-cad-panel">
                          <p className="modal-cad-panel-kicker">Archivo adjunto a esta variante</p>
                          <p className="modal-cad-panel-text">
                            <strong>{cadFormat.ext}</strong> — {cadFormat.blurb}. La imagen de arriba es la referencia
                            visual del producto. La vista 3D interactiva en el navegador solo aplica a{' '}
                            <strong>GLB</strong>/<strong>GLTF</strong>; el resto se gestiona aquí mismo con imagen + descarga.
                          </p>
                          <a
                            href={modelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="modal-cad-download"
                          >
                            Descargar {cadFormat.ext}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="modal-viewer-placeholder">
                        <span>Sin modelo</span>
                      </div>
                    ))}
                  {!activeSlide && (
                    <div className="modal-viewer-placeholder">
                      <span>Sin vista previa</span>
                    </div>
                  )}
                </div>
              </div>
              </div>
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
