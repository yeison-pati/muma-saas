import './CrearVariantsSection.css';

export default function CrearVariantsSection({
  initialVariants,
  onOpenNew,
  onOpenEdit,
  onRemoveVariant,
}) {
  return (
    <fieldset className="crear-variant-section">
      <legend>Variantes</legend>
      {initialVariants.length === 0 ? (
        <div className="crear-variants-empty">
          <p>No hay variantes todavía. Creá la primera para esta base.</p>
          <button type="button" className="crear-variants-primary" onClick={onOpenNew}>
            + Crear variante
          </button>
        </div>
      ) : (
        <>
          <ul className="crear-variant-list">
            {initialVariants.map((variant, vIdx) => (
              <li key={vIdx} className="crear-variant-list-item">
                <div className="crear-variant-list-main">
                  <strong className="crear-variant-list-title">Variante {vIdx + 1}</strong>
                  <span className="crear-variant-list-meta">
                    {variant.sapRef?.trim() ? `SAP: ${variant.sapRef}` : 'Sin SAP'}
                  </span>
                  <span className="crear-variant-list-meta">
                    {(variant.components || []).filter(
                      (c) => c.componentId || c.componentSapRef?.trim() || c.componentSapCode?.trim()
                    ).length}{' '}
                    componente(s)
                  </span>
                </div>
                <div className="crear-variant-list-actions">
                  <button type="button" onClick={() => onOpenEdit(vIdx)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="crear-variant-list-remove"
                    onClick={() => onRemoveVariant(vIdx)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="crear-add-variant" onClick={onOpenNew}>
            + Agregar variante
          </button>
        </>
      )}
    </fieldset>
  );
}
