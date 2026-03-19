import AutocompleteInput from '../../components/AutocompleteInput';
import { toUpperFormValue } from '../../utils/formText';
import './CrearVariantModal.css';

/**
 * Modal único para crear o editar una variante en "Crear base" (sin desplegables feos en la página).
 */
export default function CrearVariantModal({
  open,
  title,
  draft,
  setDraft,
  onClose,
  onConfirm,
  saving,
  confirmLabel = 'Guardar variante',
  componentOptions,
  componentValuesByRef,
  allComponentValues,
}) {
  if (!open || !draft) return null;

  const handleVariantChange = (field, value) => {
    const v = field === 'sapRef' ? toUpperFormValue(value) : value;
    setDraft((prev) => (prev ? { ...prev, [field]: v } : prev));
  };

  const handleVariantFiles = (field, file) => {
    setDraft((prev) => (prev ? { ...prev, [field]: file } : prev));
  };

  const handleComponentChange = (compIdx, field, value) => {
    const upperFields = new Set(['componentName', 'componentSapRef', 'componentSapCode', 'componentValue']);
    const v = upperFields.has(field) ? toUpperFormValue(value) : value;
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            components: prev.components.map((c, j) =>
              j === compIdx ? { ...c, [field]: v } : c
            ),
          }
        : prev
    );
  };

  const handleComponentSapChange = (compIdx, value) => {
    const u = toUpperFormValue(value);
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            components: prev.components.map((c, j) =>
              j === compIdx
                ? { ...c, componentSapRef: u, componentSapCode: u }
                : c
            ),
          }
        : prev
    );
  };

  const handleComponentSelect = (compIdx, val) => {
    const upperVal = toUpperFormValue(val || '');
    const found = componentOptions.find(
      (o) =>
        String(o.label || '').toLocaleUpperCase('es-419') ===
        String(val || '').trim().toLocaleUpperCase('es-419')
    );
    setDraft((prev) => {
      if (!prev) return prev;
      const nextComps = prev.components.map((c, j) => {
        if (j !== compIdx) return c;
        if (found) {
          return {
            ...c,
            componentId: found.id,
            componentName: '',
            componentSapRef: found.sapRef ?? '',
            componentSapCode: found.sapCode ?? found.sapRef ?? '',
          };
        }
        return {
          ...c,
          componentId: null,
          componentName: (upperVal || '').trim(),
          componentSapRef: '',
          componentSapCode: '',
        };
      });
      return { ...prev, components: nextComps };
    });
  };

  const addComponent = () => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            components: [
              ...prev.components,
              {
                componentId: null,
                componentName: '',
                componentSapRef: '',
                componentSapCode: '',
                componentValue: '',
              },
            ],
          }
        : prev
    );
  };

  const removeComponent = (compIdx) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            components: prev.components.filter((_, j) => j !== compIdx),
          }
        : prev
    );
  };

  const handleOverlayKey = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <div
      className="crear-variant-modal-overlay"
      onClick={onClose}
      onKeyDown={handleOverlayKey}
      role="presentation"
    >
      <div
        className="crear-variant-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crear-variant-modal-title"
      >
        <div className="crear-variant-modal-header">
          <h2 id="crear-variant-modal-title">{title}</h2>
          <button type="button" className="crear-variant-modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="crear-variant-modal-body">
          <div className="crear-variant-modal-sap">
            <label>
              <span>SAP - REF</span>
              <input
                value={draft.sapRef}
                onChange={(e) => handleVariantChange('sapRef', e.target.value)}
                placeholder="Ej: BASE-V1"
              />
            </label>
          </div>

          <div className="crear-variant-modal-media">
            <label>
              <span>Imagen</span>
              <div className="crear-file-wrap">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleVariantFiles('imageFile', e.target.files?.[0] || null)}
                />
              </div>
            </label>
            <label>
              <span>ModelO</span>
              <div className="crear-file-wrap">
                <input
                  type="file"
                  accept=".glb,.gltf,.dwg,model/gltf-binary,.step,.stp"
                  onChange={(e) => handleVariantFiles('modelFile', e.target.files?.[0] || null)}
                />
              </div>
            </label>
          </div>

          <div className="crear-variant-modal-components">
            <div className="crear-components-label">Componentes</div>
            {draft.components.map((comp, cIdx) => {
              const compLabel = comp.componentId
                ? componentOptions.find((o) => o.id === comp.componentId)?.label ?? ''
                : comp.componentName ?? comp.componentSapRef ?? '';
              const refForValues = comp.componentId || comp.componentSapRef || comp.componentName;
              return (
                <div key={cIdx} className="crear-variant-modal-comp-row">
                  <AutocompleteInput
                    className="crear-component-autocomplete"
                    value={compLabel}
                    onChange={(e) => handleComponentSelect(cIdx, e.target.value)}
                    options={componentOptions.map((o) => o.label)}
                    placeholder="Nombre (existente o nuevo)"
                  />
                  <input
                    type="text"
                    className="crear-component-sap"
                    value={comp.componentSapCode ?? comp.componentSapRef ?? ''}
                    onChange={(e) => handleComponentSapChange(cIdx, e.target.value)}
                    placeholder="Código SAP"
                  />
                  <AutocompleteInput
                    className="crear-component-autocomplete"
                    value={comp.componentValue ?? ''}
                    onChange={(e) =>
                      handleComponentChange(cIdx, 'componentValue', e.target.value)
                    }
                    options={
                      refForValues
                        ? componentValuesByRef[refForValues] || allComponentValues
                        : allComponentValues
                    }
                    placeholder="Valor (ej: ROJO)"
                  />
                  <button
                    type="button"
                    onClick={() => removeComponent(cIdx)}
                    disabled={draft.components.length <= 1}
                    title="Quitar componente"
                  >
                    −
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={addComponent} className="crear-add-component">
              + Agregar componente
            </button>
          </div>
        </div>

        <div className="crear-variant-modal-actions">
          <button type="button" className="crear-variant-modal-cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="crear-variant-modal-save" onClick={onConfirm} disabled={saving}>
            {saving ? 'Guardando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
