import AutocompleteInput from '../../components/AutocompleteInput';

export default function CrearVariantsSection({
  initialVariants,
  componentOptions,
  componentValuesByRef,
  allComponentValues,
  handleVariantChange,
  handleComponentChange,
  handleComponentSapChange,
  handleComponentSelect,
  addComponent,
  removeComponent,
  addVariant,
  removeVariant,
}) {
  return (
    <fieldset className="crear-variant-section">
      <legend>Variantes (mínimo 1 variante con 1 componente)</legend>
      <div className="crear-variants-grid">
        {initialVariants.map((variant, vIdx) => (
          <div key={vIdx} className="crear-variant-block">
            <div className="crear-variant-header">
              <span className="crear-variant-label">Variante {vIdx + 1}</span>
              <button
                type="button"
                onClick={() => removeVariant(vIdx)}
                disabled={initialVariants.length <= 1}
                className="crear-remove-variant"
                title="Quitar variante"
              >
                Eliminar
              </button>
            </div>
            <div className="crear-variant-sap">
              <label>
                <span>SAP Ref (opcional)</span>
                <input
                  value={variant.sapRef}
                  onChange={(e) => handleVariantChange(vIdx, 'sapRef', e.target.value)}
                  placeholder="Ej: BASE-V1"
                />
              </label>
            </div>
            <div>
              <div className="crear-components-label">Componentes</div>
              {variant.components.map((comp, cIdx) => {
                const compLabel = comp.componentId
                  ? (componentOptions.find((o) => o.id === comp.componentId)?.label ?? '')
                  : (comp.componentSapRef ?? '');
                const handleCompSelect = (val) => handleComponentSelect(vIdx, cIdx, val);
                const refForValues = comp.componentId || comp.componentSapRef;
                return (
                  <div key={cIdx} className="crear-component-row">
                    <AutocompleteInput
                      className="crear-component-autocomplete"
                      value={compLabel}
                      onChange={(e) => handleCompSelect(e.target.value)}
                      options={componentOptions.map((o) => o.label)}
                      placeholder="Componente (seleccione o escriba ref)"
                    />
                    <input
                      type="text"
                      className="crear-component-sap"
                      value={comp.componentSapCode ?? comp.componentSapRef ?? ''}
                      onChange={(e) => handleComponentSapChange(vIdx, cIdx, e.target.value)}
                      placeholder="Código SAP"
                      title="Código SAP (REF se rellena igual internamente)"
                    />
                    <AutocompleteInput
                      className="crear-component-autocomplete"
                      value={comp.componentValue ?? ''}
                      onChange={(e) => handleComponentChange(vIdx, cIdx, 'componentValue', e.target.value)}
                      options={
                        refForValues
                          ? (componentValuesByRef[refForValues] || allComponentValues)
                          : allComponentValues
                      }
                      placeholder="Valor (ej: Rojo)"
                    />
                    <button
                      type="button"
                      onClick={() => removeComponent(vIdx, cIdx)}
                      disabled={variant.components.length <= 1}
                      title="Quitar componente"
                    >
                      −
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => addComponent(vIdx)}
                className="crear-add-component"
              >
                + Agregar componente
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={addVariant} className="crear-add-variant">
        + Agregar variante
      </button>
    </fieldset>
  );
}
