import { useState, useEffect, useMemo } from 'react';
import { useProductsService } from '../hooks/useProductsService';
import { useProducts } from '../context/ProductsContext';
import { uploadFile } from '../api/documentService';
import AutocompleteInput from './AutocompleteInput';
import './BaseEditModal.css';

export default function BaseEditModal({ product: productProp, onClose, onSaved }) {
  const productsService = useProductsService();
  const { products, reload } = useProducts();
  const product = products.find((p) => p.id === productProp?.id) ?? productProp;

  const [form, setForm] = useState({
    name: product?.name ?? '',
    category: product?.category ?? '',
    subcategory: product?.subcategory ?? '',
    space: product?.space ?? '',
    line: product?.line ?? '',
    baseMaterial: product?.baseMaterial ?? '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [variants, setVariants] = useState(
    () =>
      product?.variants?.map((v) => ({
        id: v.id,
        sapRef: v.sapRef ?? '',
        components: (v.components || []).map((c) => ({
          id: c.id,
          name: c.name ?? '',
          value: c.value ?? '',
          sapRef: c.sapRef ?? '',
          sapCode: c.sapCode ?? '',
        })),
      })) ?? []
  );

  useEffect(() => {
    if (product?.variants) {
      setVariants(
        product.variants.map((v) => ({
          id: v.id,
          sapRef: v.sapRef ?? '',
          components: (v.components || []).map((c) => ({
            id: c.id,
            name: c.name ?? '',
            value: c.value ?? '',
            sapRef: c.sapRef ?? '',
            sapCode: c.sapCode ?? '',
          })),
        }))
      );
    }
  }, [product?.id, product?.variants]);
  const [editingVariantIdx, setEditingVariantIdx] = useState(null);
  const [addingVariant, setAddingVariant] = useState(false);
  const [newVariant, setNewVariant] = useState({
    sapRef: '',
    components: [{ componentId: null, componentName: '', componentSapRef: '', componentSapCode: '', componentValue: '' }],
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
  const subcategories = form.category
    ? [...new Set(products.filter((p) => p.category === form.category).map((p) => p.subcategory).filter(Boolean))].sort()
    : [...new Set(products.map((p) => p.subcategory).filter(Boolean))].sort();
  const spaces = form.subcategory
    ? [...new Set(products.filter((p) => p.subcategory === form.subcategory).map((p) => p.space).filter(Boolean))].sort()
    : [...new Set(products.map((p) => p.space).filter(Boolean))].sort();
  const lines = form.space
    ? [...new Set(products.filter((p) => p.space === form.space).map((p) => p.line).filter(Boolean))].sort()
    : [...new Set(products.map((p) => p.line).filter(Boolean))].sort();
  const baseMaterials = [...new Set(products.map((p) => p.baseMaterial).filter(Boolean))].sort();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveBase = async () => {
    setMessage('');
    setSaving(true);
    try {
      let imageKey = product?.image;
      let modelKey = product?.model;
      if (imageFile) {
        const res = await uploadFile(imageFile, 'image');
        imageKey = res.key;
      }
      if (modelFile) {
        const res = await uploadFile(modelFile, 'model');
        modelKey = res.key;
      }
      await productsService.updateBase({
        id: product.id,
        name: form.name,
        image: imageKey,
        model: modelKey,
        category: form.category || null,
        subcategory: form.subcategory || null,
        space: form.space || null,
        line: form.line || null,
        baseMaterial: form.baseMaterial || null,
      });
      setMessage('Base actualizada');
      reload();
      onSaved?.();
    } catch (err) {
      setMessage(err?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBase = async () => {
    if (!confirm('¿Eliminar esta base y todas sus variantes?')) return;
    setSaving(true);
    try {
      await productsService.deleteBase(product.id);
      reload();
      onClose();
    } catch (err) {
      setMessage(err?.message || 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariant = () => {
    const comps = newVariant.components.filter(
      (c) => c.componentId || (c.componentName ?? '').trim() || (c.componentSapRef ?? '').trim() || (c.componentSapCode ?? '').trim()
    );
    if (comps.length === 0) {
      setMessage('La variante debe tener al menos un componente');
      return;
    }
    setSaving(true);
    setMessage('');
    productsService
      .addVariantToBase({
        baseId: product.id,
        sapRef: newVariant.sapRef?.trim() || null,
        components: comps.map((c) => ({
          componentId: c.componentId || null,
          componentName: c.componentName?.trim() || null,
          componentSapRef: c.componentSapRef?.trim() || null,
          componentSapCode: c.componentSapCode?.trim() || null,
          componentValue: c.componentValue?.trim() || null,
        })),
      })
      .then((v) => {
        setVariants((prev) => [
          ...prev,
          {
            id: v.id,
            sapRef: v.sapRef ?? '',
            components: (v.components || []).map((c) => ({ id: c.id, name: c.name, value: c.value })),
          },
        ]);
        setAddingVariant(false);
        setNewVariant({ sapRef: '', components: [{ componentId: null, componentName: '', componentSapRef: '', componentSapCode: '', componentValue: '' }] });
        reload();
      })
      .catch((err) => setMessage(err?.message || 'Error al agregar variante'))
      .finally(() => setSaving(false));
  };

  const handleUpdateVariant = async (vIdx) => {
    const v = variants[vIdx];
    const comps = v.components.filter(
      (c) => c.id || (c.name ?? '').trim() || (c.sapCode ?? c.sapRef ?? '').trim() || (c.value ?? '').trim()
    );
    if (comps.length === 0) {
      setMessage('La variante debe tener al menos un componente');
      return;
    }
    const invalidNew = comps.find(
      (c) => !c.id && !(c.name ?? '').trim() && !(c.sapCode ?? c.sapRef ?? '').trim()
    );
    if (invalidNew) {
      setMessage('Cada componente nuevo debe tener Título o Código SAP');
      return;
    }
    setSaving(true);
    setMessage('');
    productsService
      .updateVariant({
        id: v.id,
        sapRef: v.sapRef || null,
        components: comps.map((c) => ({
          componentId: c.id || null,
          componentName: (c.name ?? c.componentName ?? '').trim() || null,
          componentSapRef: (c.sapRef ?? c.componentSapRef ?? '').trim() || null,
          componentSapCode: (c.sapCode ?? c.componentSapCode ?? '').trim() || null,
          componentValue: (c.value ?? c.componentValue ?? '').trim() || null,
        })),
      })
      .then(() => {
        setEditingVariantIdx(null);
        reload();
      })
      .catch((err) => setMessage(err?.message || 'Error al actualizar'))
      .finally(() => setSaving(false));
  };

  const handleDeleteVariant = async (vIdx) => {
    const v = variants[vIdx];
    if (!confirm(`¿Eliminar variante ${v.sapRef || v.baseCode || '—'}?`)) return;
    setSaving(true);
    setMessage('');
    productsService
      .deleteVariant(v.id)
      .then(() => {
        setVariants((prev) => prev.filter((_, i) => i !== vIdx));
        setEditingVariantIdx(null);
        reload();
      })
      .catch((err) => setMessage(err?.message || 'Error al eliminar'))
      .finally(() => setSaving(false));
  };

  const handleVariantChange = (vIdx, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === vIdx ? { ...v, [field]: value } : v))
    );
  };

  const handleVariantComponentChange = (vIdx, cIdx, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              components: v.components.map((c, j) =>
                j === cIdx ? { ...c, [field]: value } : c
              ),
            }
          : v
      )
    );
  };

  const handleVariantComponentSapChange = (vIdx, cIdx, value) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              components: v.components.map((c, j) =>
                j === cIdx ? { ...c, sapRef: value, sapCode: value } : c
              ),
            }
          : v
      )
    );
  };

  const handleVariantComponentNameBlur = (vIdx, cIdx) => {
    const c = variants[vIdx]?.components[cIdx];
    if (!c?.name?.trim()) return;
    const found = componentOptions.find(
      (o) =>
        (o.label || '').trim() === (c.name || '').trim() ||
        (o.sapRef || '').trim() === (c.name || '').trim()
    );
    if (found && !c.id) {
      setVariants((prev) =>
        prev.map((v, i) =>
          i === vIdx
            ? {
                ...v,
                components: v.components.map((comp, j) =>
                  j === cIdx
                    ? { ...comp, id: found.id, sapRef: found.sapRef ?? found.sapCode, sapCode: found.sapCode ?? found.sapRef }
                    : comp
                ),
              }
            : v
        )
      );
    }
  };

  const addComponentToVariant = (vIdx) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === vIdx
          ? { ...v, components: [...v.components, { id: null, name: '', value: '', sapRef: '', sapCode: '' }] }
          : v
      )
    );
  };

  const removeComponentFromVariant = (vIdx, cIdx) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === vIdx ? { ...v, components: v.components.filter((_, j) => j !== cIdx) } : v
      )
    );
  };

  const handleNewVariantChange = (field, value) => {
    setNewVariant((prev) => ({ ...prev, [field]: value }));
  };

  const componentOptions = useMemo(() => {
    const byId = new Map();
    products.forEach((p) => {
      p.variants?.forEach((v) => {
        v.components?.forEach((c) => {
          if (c?.id) byId.set(c.id, { id: c.id, label: c.name || c.sapRef || c.id, sapRef: c.sapRef, sapCode: c.sapCode });
        });
      });
    });
    return [...byId.values()].sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  }, [products]);

  const handleNewVariantComponentChange = (cIdx, field, value) => {
    setNewVariant((prev) => ({
      ...prev,
      components: prev.components.map((c, i) =>
        i === cIdx ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleNewVariantComponentSapChange = (cIdx, value) => {
    setNewVariant((prev) => ({
      ...prev,
      components: prev.components.map((c, i) =>
        i === cIdx ? { ...c, componentSapRef: value, componentSapCode: value } : c
      ),
    }));
  };

  const handleNewVariantComponentSelect = (cIdx, val) => {
    const found = componentOptions.find((o) => o.label === val);
    if (found) {
      setNewVariant((prev) => ({
        ...prev,
        components: prev.components.map((c, i) =>
          i === cIdx
            ? {
                ...c,
                componentId: found.id,
                componentName: '',
                componentSapRef: found.sapRef ?? '',
                componentSapCode: found.sapCode ?? found.sapRef ?? '',
              }
            : c
        ),
      }));
    } else {
      setNewVariant((prev) => ({
        ...prev,
        components: prev.components.map((c, i) =>
          i === cIdx
            ? { ...c, componentId: null, componentName: (val || '').trim(), componentSapRef: '', componentSapCode: '' }
            : c
        ),
      }));
    }
  };

  const addNewVariantComponent = () => {
    setNewVariant((prev) => ({
      ...prev,
      components: [...prev.components, { componentId: null, componentName: '', componentSapRef: '', componentSapCode: '', componentValue: '' }],
    }));
  };

  const removeNewVariantComponent = (cIdx) => {
    setNewVariant((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== cIdx),
    }));
  };

  return (
    <div
      className="base-edit-overlay"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose?.()}
      role="button"
      tabIndex={0}
      aria-label="Cerrar"
    >
      <div
        className="base-edit-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="base-edit-header">
          <h2>Editar: {product?.name}</h2>
          <div className="base-edit-header-actions">
            <button type="button" onClick={handleSaveBase} disabled={saving}>
              Guardar base
            </button>
            <button
              type="button"
              className="base-edit-delete"
              onClick={handleDeleteBase}
              disabled={saving}
            >
              Eliminar base
            </button>
            <button type="button" className="base-edit-close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="base-edit-body">
          <section className="base-edit-section">
            <h3>Datos de la base</h3>
            <div className="base-edit-form">
              <label htmlFor="base-edit-code">
                Código (solo lectura)
                <input id="base-edit-code" value={product?.code} readOnly disabled />
              </label>
              <label htmlFor="base-edit-name">
                Nombre *
                <input id="base-edit-name" name="name" value={form.name} onChange={handleChange} />
              </label>
              <label htmlFor="base-edit-category">
                Categoría
                <AutocompleteInput
                  id="base-edit-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  options={categories}
                  placeholder="Escribir o elegir..."
                />
              </label>
              <label htmlFor="base-edit-subcategory">
                Subcategoría
                <AutocompleteInput
                  id="base-edit-subcategory"
                  name="subcategory"
                  value={form.subcategory}
                  onChange={handleChange}
                  options={subcategories}
                  placeholder="Escribir o elegir..."
                />
              </label>
              <label htmlFor="base-edit-space">
                Espacio
                <AutocompleteInput
                  id="base-edit-space"
                  name="space"
                  value={form.space}
                  onChange={handleChange}
                  options={spaces}
                  placeholder="Escribir o elegir..."
                />
              </label>
              <label htmlFor="base-edit-line">
                Línea
                <AutocompleteInput
                  id="base-edit-line"
                  name="line"
                  value={form.line}
                  onChange={handleChange}
                  options={lines}
                  placeholder="Escribir o elegir..."
                />
              </label>
              <label htmlFor="base-edit-baseMaterial">
                Materia base
                <AutocompleteInput
                  id="base-edit-baseMaterial"
                  name="baseMaterial"
                  value={form.baseMaterial}
                  onChange={handleChange}
                  options={baseMaterials}
                  placeholder="Escribir o elegir..."
                />
              </label>
              <label htmlFor="base-edit-imagen">
                Imagen (nueva)
                <input
                  id="base-edit-imagen"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </label>
              <label htmlFor="base-edit-modelo">
                Modelo 3D (nuevo)
                <input
                  id="base-edit-modelo"
                  type="file"
                  accept=".glb,.gltf"
                  onChange={(e) => setModelFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </section>

          <section className="base-edit-section">
            <h3>Variantes ({variants.length})</h3>
            {variants.map((v, vIdx) => (
              <div key={v.id} className="base-edit-variant-block">
                <div className="base-edit-variant-header">
                  <span>
                    Variante {vIdx + 1}: {v.sapRef || v.baseCode || '—'}
                  </span>
                  <div>
                    {editingVariantIdx === vIdx ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateVariant(vIdx)}
                          disabled={saving}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingVariantIdx(null)}
                          disabled={saving}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingVariantIdx(vIdx)}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      type="button"
                      className="base-edit-variant-delete"
                      onClick={() => handleDeleteVariant(vIdx)}
                      disabled={saving || variants.length <= 1}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                {editingVariantIdx === vIdx ? (
                  <div className="base-edit-variant-form">
                    <label>
                      SAP Ref
                      <input
                        value={v.sapRef}
                        onChange={(e) =>
                          handleVariantChange(vIdx, 'sapRef', e.target.value)
                        }
                      />
                    </label>
                    {v.components.map((c, cIdx) => (
                      <div key={c.id || `new-${vIdx}-${cIdx}`} className="base-edit-component-row">
                        <input
                          placeholder="Título (o buscar existente)"
                          value={c.name}
                          onChange={(e) =>
                            handleVariantComponentChange(
                              vIdx,
                              cIdx,
                              'name',
                              e.target.value
                            )
                          }
                          onBlur={() => handleVariantComponentNameBlur(vIdx, cIdx)}
                          list={`comp-options-edit-${vIdx}`}
                          title="Escribe para buscar o selecciona un componente existente"
                        />
                        <datalist id={`comp-options-edit-${vIdx}`}>
                          {componentOptions.map((o) => (
                            <option key={o.id} value={o.label || o.sapRef || o.id} />
                          ))}
                        </datalist>
                        <input
                          placeholder="Código SAP"
                          value={c.sapCode ?? c.sapRef ?? ''}
                          onChange={(e) => handleVariantComponentSapChange(vIdx, cIdx, e.target.value)}
                          title="Código SAP (REF se rellena igual internamente)"
                        />
                        <input
                          placeholder="Valor"
                          value={c.value}
                          onChange={(e) =>
                            handleVariantComponentChange(
                              vIdx,
                              cIdx,
                              'value',
                              e.target.value
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() => removeComponentFromVariant(vIdx, cIdx)}
                          disabled={v.components.length <= 1}
                        >
                          −
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="base-edit-add-comp"
                      onClick={() => addComponentToVariant(vIdx)}
                    >
                      + Componente
                    </button>
                  </div>
                ) : (
                  <div className="base-edit-variant-preview">
                    {v.components.map((c) => (
                      <span key={c.id} className="base-edit-chip">
                        {c.name}: {c.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {addingVariant ? (
              <div className="base-edit-variant-block base-edit-new-variant">
                <h4>Nueva variante</h4>
                <label>
                  SAP Ref
                  <input
                    value={newVariant.sapRef}
                    onChange={(e) =>
                      handleNewVariantChange('sapRef', e.target.value)
                    }
                  />
                </label>
                {newVariant.components.map((c, cIdx) => {
                  const compLabel = c.componentId
                    ? (componentOptions.find((o) => o.id === c.componentId)?.label ?? '')
                    : (c.componentName ?? c.componentSapRef ?? '');
                  return (
                  <div key={cIdx} className="base-edit-component-row">
                    <AutocompleteInput
                      placeholder="Componente (seleccione o ref)"
                      value={compLabel}
                      onChange={(e) => handleNewVariantComponentSelect(cIdx, e.target.value)}
                      options={componentOptions.map((o) => o.label)}
                    />
                    <input
                      placeholder="Código SAP"
                      value={c.componentSapCode ?? c.componentSapRef ?? ''}
                      onChange={(e) => handleNewVariantComponentSapChange(cIdx, e.target.value)}
                      title="Código SAP (REF se rellena igual internamente)"
                    />
                    <input
                      placeholder="Valor"
                      value={c.componentValue}
                      onChange={(e) =>
                        handleNewVariantComponentChange(
                          cIdx,
                          'componentValue',
                          e.target.value
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeNewVariantComponent(cIdx)}
                      disabled={newVariant.components.length <= 1}
                    >
                      −
                    </button>
                  </div>
                  );
                })}
                <button
                  type="button"
                  className="base-edit-add-comp"
                  onClick={addNewVariantComponent}
                >
                  + Componente
                </button>
                <div className="base-edit-new-variant-actions">
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    disabled={saving}
                  >
                    Agregar variante
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingVariant(false);
                      setNewVariant({
                        sapRef: '',
                        components: [
                          { componentId: null, componentSapRef: '', componentSapCode: '', componentValue: '' },
                        ],
                      });
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="base-edit-add-variant"
                onClick={() => setAddingVariant(true)}
              >
                + Agregar variante
              </button>
            )}
          </section>
        </div>

        {message && <p className="base-edit-message">{message}</p>}
      </div>
    </div>
  );
}
