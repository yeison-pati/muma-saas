import { calculateTipologia } from '../utils/calculateTipologia';
import { getVariantDisplayCodes, getComponentDisplayCodes } from '../utils/variantComponentCodes';
import ImageWithModal from './ImageWithModal';
import './CartItem.css';

export default function CartItem({
  item,
  expanded,
  onToggle,
  onIncrease,
  onDecrease,
  onChangeCaracteristica,
  onRemove,
  onChangeComment,
}) {
  const isP3 = item?.p3 || item?.tipologia === 'P3';
  const componentOriginals = item?._componentOriginals || {};
  const original = item?._originalCaracteristicas || {};
  const updated = item?.caracteristicas || {};

  const originalByName = Object.keys(original).length
    ? original
    : Object.fromEntries(Object.entries(componentOriginals).map(([id, o]) => [o?.name || id, o?.value ?? '']));
  const updatedByName = Object.fromEntries(
    Object.entries(updated).map(([id, v]) => [componentOriginals[id]?.name || id, v ?? ''])
  );
  const computedTipologia = calculateTipologia(originalByName, updatedByName);
  // P3 custom: siempre P3, no usar computedTipologia (evita que se muestre como P1 por caracteristicas).
  // Para productos normales: computed primero, luego item.tipologia/type, P4 si variante sin cambios.
  const tipologia = isP3
    ? 'P3'
    : (computedTipologia || item?.tipologia || item?.type
        || (item?._selectedVariantId && !computedTipologia ? 'P4' : null)
        || '—');

  const displayName = item?.name || item?.subcategoria || item?.categoria || 'Producto';

  const selectedVariant = item?._selectedVariantId && item?.variants?.length
    ? item.variants.find((v) => String(v.id) === String(item._selectedVariantId))
    : item?.variants?.[0];
  const sapRef = item?.sapRef ?? selectedVariant?.sapRef;
  const sapCode = item?.sapCode ?? selectedVariant?.sapCode;
  const itemType = item?.type ?? selectedVariant?.type;

  const compIds = [...new Set([...Object.keys(componentOriginals), ...Object.keys(updated)])].filter(Boolean);
  const allComps = compIds
    .map((id) => ({ id, name: componentOriginals[id]?.name || id, ...componentOriginals[id] }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const originalByKey = Object.fromEntries(
    Object.entries(componentOriginals).map(([id, o]) => [o?.name || id, o?.value ?? ''])
  );
  const updatedByKey = Object.fromEntries(
    Object.entries(updated).map(([id, v]) => [componentOriginals[id]?.name || id, v ?? ''])
  );
  const variantCodes = getVariantDisplayCodes({
    sapRef,
    sapCode,
    type: tipologia || itemType,
    currentByKey: updatedByKey,
    originalByKey: originalByKey,
  });

  return (
    <div className={`cart-item ${expanded ? 'cart-item-expanded' : ''}`}>
      <button
        type="button"
        className="cart-item-header"
        onClick={() => onToggle?.()}
      >
        <div className="cart-item-meta">
          <div
            className="cart-item-image"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="button"
            tabIndex={0}
          >
            {item?.fullUrl ? (
              <ImageWithModal src={item.fullUrl} alt={displayName}>
                <img src={item.fullUrl} alt={displayName} />
              </ImageWithModal>
            ) : (
              <div className="cart-item-placeholder">📦</div>
            )}
          </div>
          <div className="cart-item-info">
            <span className="cart-item-name">{displayName}</span>
            {variantCodes && (
              <div className="cart-item-code codigo-stack codigo-stack-fixed">
                {variantCodes.secondary ? (
                  <span className="codigo-sap">{variantCodes.secondary}</span>
                ) : (
                  <span className="codigo-sap codigo-placeholder" aria-hidden> </span>
                )}
                <span className={variantCodes.secondary ? 'codigo-ref' : 'codigo-ref codigo-ref-only'}>{variantCodes.primary}</span>
              </div>
            )}
          </div>
        </div>

        <div className="cart-item-actions">
          <span className="cart-item-tipologia">{/^p[1-5]$/i.test(tipologia) ? tipologia.toUpperCase() : tipologia}</span>
          <div className="cart-item-qty">
            <button type="button" className="cart-item-qty-btn" onClick={(e) => { e.stopPropagation(); onDecrease?.(); }}>
              −
            </button>
            <span className="cart-item-qty-value">{item?.quantity || 1}</span>
            <button type="button" className="cart-item-qty-btn" onClick={(e) => { e.stopPropagation(); onIncrease?.(); }}>
              +
            </button>
          </div>
          <button
            type="button"
            className="cart-item-delete"
            onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
            title="Eliminar"
          >
            ✕
          </button>
          <span className="cart-item-expand">{expanded ? '▴' : '▾'}</span>
        </div>
      </button>

      {expanded && allComps.length > 0 && (
        <div className="cart-item-body">
          <div className="cart-item-caracteristicas">
            <span className="cart-item-label">Características</span>
            <div className="cart-item-fields">
              {allComps.map((comp) => {
                const currentValue = (item.caracteristicas || {})[comp.id] ?? '';
                const compOrig = componentOriginals[comp.id];
                const originalValue = compOrig?.value ?? '';
                const compCodes = getComponentDisplayCodes({
                  sapRef: compOrig?.sapRef,
                  sapCode: compOrig?.sapCode,
                  currentValue,
                  originalValue,
                });
                return (
                  <div key={comp.id} className={`cart-item-field ${compCodes ? 'cart-item-field-with-codes' : ''}`}>
                    <label>
                      {comp.name}
                      {compCodes && (
                        <div className="cart-item-field-codes codigo-stack codigo-stack-fixed">
                          {compCodes.secondary ? (
                            <span className="codigo-sap">{compCodes.secondary}</span>
                          ) : (
                            <span className="codigo-sap codigo-placeholder" aria-hidden> </span>
                          )}
                          <span className={compCodes.secondary ? 'codigo-ref' : 'codigo-ref codigo-ref-only'}>{compCodes.primary}</span>
                        </div>
                      )}
                    </label>
                    <input
                      type="text"
                      value={String(currentValue ?? '')}
                      onChange={(e) => onChangeCaracteristica?.(comp.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={comp.name}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="cart-item-comment">
        <textarea
          placeholder="Agregar comentario..."
          value={item?.comentarios ?? ''}
          onChange={(e) => onChangeComment?.(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          rows={2}
        />
      </div>
    </div>
  );
}
