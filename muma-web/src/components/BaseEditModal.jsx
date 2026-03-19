import { useState, useEffect, useMemo } from 'react';
import { useProductsService } from '../hooks/useProductsService';
import { useProducts } from '../context/ProductsContext';
import { uploadFile } from '../api/documentService';
import { toUpperFormValue } from '../utils/formText';
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
  const [variants, setVariants] = useState(
    () =>
      product?.variants?.map((v) => ({
        id: v.id,
        sapRef: v.sapRef ?? '',
        image: v.image ?? '',
        model: v.model ?? '',
        imageFile: null,
        modelFile: null,
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
          image: v.image ?? '',
          model: v.model ?? '',
          imageFile: null,
          modelFile: null,
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
  const [variantDialog, setVariantDialog] = useState(null);
  const [variantDraft, setVariantDraft] = useState(null);
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

  const UPPER_FORM = new Set(['name', 'category', 'subcategory', 'space', 'line', 'baseMaterial']);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const v = UPPER_FORM.has(name) ? toUpperFormValue(value) : value;
    setForm((prev) => ({ ...prev, [name]: v }));
  };

  const handleVariantMedia = (vIdx, field, file) => {
    setVariants((prev) =>
      prev.map((x, i) => (i === vIdx ? { ...x, [field]: file } : x))
    );
  };

  const handleSaveBase = async () => {
    setMessage('');
    setSaving(true);
    try {
      await productsService.updateBase({
        id: product.id,
        name: form.name,
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

  const closeVariantDialog = () => {
    setVariantDialog(null);
    setVariantDraft(null);
  };

  const openVariantDialogNew = () => {
    setMessage('');
    setVariantDraft({
      sapRef: '',
      imageFile: null,
      modelFile: null,
      components: [
        {
          componentId: null,
          componentName: '',
          componentSapRef: '',
          componentSapCode: '',
          componentValue: '',
        },
      ],
    });
    setVariantDialog({ mode: 'new' });
  };

  const openVariantDialogEdit = (idx) => {
    setMessage('');
    const v = variants[idx];
    if (!v) return;
    setVariantDraft({
      id: v.id,
      sapRef: v.sapRef ?? '',
      image: v.image ?? '',
      model: v.model ?? '',
      imageFile: null,
      modelFile: null,
      components: (v.components || []).map((c) => ({
        id: c.id,
        name: c.name ?? '',
        value: c.value ?? '',
        sapRef: c.sapRef ?? '',
        sapCode: c.sapCode ?? '',
      })),
    });
    setVariantDialog({ mode: 'edit', idx });
  };

  const saveNewVariantFromModal = async () => {
    const d = variantDraft;
    if (!d || variantDialog?.mode !== 'new') return;
    const comps = d.components.filter(
      (c) =>
        c.componentId ||
        (c.componentName ?? '').trim() ||
        (c.componentSapRef ?? '').trim() ||
        (c.componentSapCode ?? '').trim()
    );
    if (comps.length === 0) {
      setMessage('La variante debe tener al menos un componente');
      return;
    }
    if (!d.imageFile || !d.modelFile) {
      setMessage('La nueva variante requiere imagen y modelo');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const imgRes = await uploadFile(d.imageFile, 'image');
      const modRes = await uploadFile(d.modelFile, 'model');
      const v = await productsService.addVariantToBase({
        baseId: product.id,
        sapRef: d.sapRef?.trim() || null,
        image: imgRes.key,
        model: modRes.key,
        components: comps.map((c) => ({
          componentId: c.componentId || null,
          componentName: c.componentName?.trim() || null,
          componentSapRef: c.componentSapRef?.trim() || null,
          componentSapCode: c.componentSapCode?.trim() || null,
          componentValue: c.componentValue?.trim() || null,
        })),
      });
      setVariants((prev) => [
        ...prev,
        {
          id: v.id,
          sapRef: v.sapRef ?? '',
          image: v.image ?? '',
          model: v.model ?? '',
          imageFile: null,
          modelFile: null,
          components: (v.components || []).map((c) => ({
            id: c.id,
            name: c.name,
            value: c.value,
            sapRef: c.sapRef,
            sapCode: c.sapCode,
          })),
        },
      ]);
      closeVariantDialog();
      reload();
    } catch (err) {
      setMessage(err?.message || 'Error al agregar variante');
    } finally {
      setSaving(false);
    }
  };

  const saveEditVariantFromModal = async () => {
    if (variantDialog?.mode !== 'edit') return;
    const d = variantDraft;
    if (!d?.id) return;
    const comps = d.components.filter(
      (c) =>
        c.id || (c.name ?? '').trim() || (c.sapCode ?? c.sapRef ?? '').trim() || (c.value ?? '').trim()
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
    let imageKey = d.image;
    let modelKey = d.model;
    if (d.imageFile) {
      const res = await uploadFile(d.imageFile, 'image');
      imageKey = res.key;
    }
    if (d.modelFile) {
      const res = await uploadFile(d.modelFile, 'model');
      modelKey = res.key;
    }
    if (!imageKey?.trim() || !modelKey?.trim()) {
      setMessage('Cada variante debe tener imagen y modelo en sistema. Suba archivos nuevos si faltan.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await productsService.updateVariant({
        id: d.id,
        sapRef: d.sapRef || null,
        image: imageKey,
        model: modelKey,
        components: comps.map((c) => ({
          componentId: c.id || null,
          componentName: (c.name ?? c.componentName ?? '').trim() || null,
          componentSapRef: (c.sapRef ?? c.componentSapRef ?? '').trim() || null,
          componentSapCode: (c.sapCode ?? c.componentSapCode ?? '').trim() || null,
          componentValue: (c.value ?? c.componentValue ?? '').trim() || null,
        })),
      });
      closeVariantDialog();
      reload();
    } catch (err) {
      setMessage(err?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (vIdx) => {
    const v = variants[vIdx];
    if (!confirm(`¿Eliminar variante ${v.sapRef || v.baseCode || '—'}?`)) return;
    if (variantDialog?.mode === 'edit' && variantDialog.idx === vIdx) {
      closeVariantDialog();
    }
    setSaving(true);
    setMessage('');
    productsService
      .deleteVariant(v.id)
      .then(() => {
        setVariants((prev) => prev.filter((_, i) => i !== vIdx));
        reload();
      })
      .catch((err) => setMessage(err?.message || 'Error al eliminar'))
      .finally(() => setSaving(false));
  };

  const patchEditDraft = (fn) => {
    setVariantDraft((prev) => (prev && prev.id ? fn(prev) : prev));
  };

  const editDraftSetSap = (value) => {
    patchEditDraft((p) => ({ ...p, sapRef: toUpperFormValue(value) }));
  };

  const editDraftSetFile = (field, file) => {
    patchEditDraft((p) => ({ ...p, [field]: file }));
  };

  const editDraftPatchComp = (cIdx, patch) => {
    patchEditDraft((p) => ({
      ...p,
      components: p.components.map((c, i) => (i === cIdx ? { ...c, ...patch } : c)),
    }));
  };

  const editDraftSapChange = (cIdx, value) => {
    const u = toUpperFormValue(value);
    patchEditDraft((p) => ({
      ...p,
      components: p.components.map((c, i) =>
        i === cIdx ? { ...c, sapRef: u, sapCode: u } : c
      ),
    }));
  };

  const editDraftPatchCompNameValue = (cIdx, field, raw) => {
    const v = field === 'name' || field === 'value' ? toUpperFormValue(raw) : raw;
    editDraftPatchComp(cIdx, { [field]: v });
  };

  const blurEditDraftComponentName = (cIdx) => {
    setVariantDraft((d) => {
      if (!d?.id) return d;
      const c = d.components[cIdx];
      if (!(c?.name ?? '').trim()) return d;
      const found = componentOptions.find(
        (o) =>
          (o.label || '').trim() === (c.name || '').trim() ||
          (o.sapRef || '').trim() === (c.name || '').trim()
      );
      if (found && !c.id) {
        return {
          ...d,
          components: d.components.map((comp, j) =>
            j === cIdx
              ? {
                  ...comp,
                  id: found.id,
                  sapRef: found.sapRef ?? found.sapCode,
                  sapCode: found.sapCode ?? found.sapRef,
                }
              : comp
          ),
        };
      }
      return d;
    });
  };

  const editDraftAddComp = () => {
    patchEditDraft((p) => ({
      ...p,
      components: [...p.components, { id: null, name: '', value: '', sapRef: '', sapCode: '' }],
    }));
  };

  const editDraftRemoveComp = (cIdx) => {
    patchEditDraft((p) => ({
      ...p,
      components: p.components.filter((_, j) => j !== cIdx),
    }));
  };

  const patchNewDraft = (fn) => {
    setVariantDraft((prev) => (prev && !prev.id ? fn(prev) : prev));
  };

  const newDraftSetSap = (value) => {
    patchNewDraft((p) => ({ ...p, sapRef: toUpperFormValue(value) }));
  };

  const newDraftSetFile = (field, file) => {
    patchNewDraft((p) => ({ ...p, [field]: file }));
  };

  const newDraftPatchComp = (cIdx, field, value) => {
    const upperFields = new Set(['componentName', 'componentSapRef', 'componentSapCode', 'componentValue']);
    const v = upperFields.has(field) ? toUpperFormValue(value) : value;
    patchNewDraft((p) => ({
      ...p,
      components: p.components.map((c, i) => (i === cIdx ? { ...c, [field]: v } : c)),
    }));
  };

  const newDraftSapChange = (cIdx, value) => {
    const u = toUpperFormValue(value);
    patchNewDraft((p) => ({
      ...p,
      components: p.components.map((c, i) =>
        i === cIdx ? { ...c, componentSapRef: u, componentSapCode: u } : c
      ),
    }));
  };

  const newDraftComponentSelect = (cIdx, val) => {
    const found = componentOptions.find(
      (o) =>
        String(o.label || '').toLocaleUpperCase('es-419') ===
        String(val || '').trim().toLocaleUpperCase('es-419')
    );
    patchNewDraft((p) => ({
      ...p,
      components: p.components.map((c, i) => {
        if (i !== cIdx) return c;
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
          componentName: toUpperFormValue(val || '').trim(),
          componentSapRef: '',
          componentSapCode: '',
        };
      }),
    }));
  };

  const newDraftAddComp = () => {
    patchNewDraft((p) => ({
      ...p,
      components: [
        ...p.components,
        {
          componentId: null,
          componentName: '',
          componentSapRef: '',
          componentSapCode: '',
          componentValue: '',
        },
      ],
    }));
  };

  const newDraftRemoveComp = (cIdx) => {
    patchNewDraft((p) => ({
      ...p,
      components: p.components.filter((_, i) => i !== cIdx),
    }));
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

  const { componentValuesByRef, allComponentValues } = useMemo(() => {
    const valuesByRef = {};
    const allValues = new Set();
    products.forEach((p) => {
      p.variants?.forEach((v) => {
        v.components?.forEach((c) => {
          const ref = c.sapRef || c.id;
          if (ref) {
            if (!valuesByRef[ref]) valuesByRef[ref] = new Set();
            if (c.value != null && String(c.value).trim()) {
              valuesByRef[ref].add(String(c.value).trim());
              allValues.add(String(c.value).trim());
            }
          }
        });
      });
    });
    return {
      componentValuesByRef: Object.fromEntries(
        Object.entries(valuesByRef).map(([k, v]) => [k, [...v].sort()])
      ),
      allComponentValues: [...allValues].sort(),
    };
  }, [products]);

  return (
    <div
      className="base-edit-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        if (variantDialog) {
          e.preventDefault();
          closeVariantDialog();
        } else {
          onClose?.();
        }
      }}
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
                />
              </label>
            </div>
          </section>

          <section className="base-edit-section">
            <h3>Variantes ({variants.length})</h3>
            <p className="base-edit-variants-hint">
              Editá o agregá variantes en un modal; la lista queda compacta.
            </p>
            {variants.map((v, vIdx) => (
              <div key={v.id} className="base-edit-variant-block base-edit-variant-summary">
                <div className="base-edit-variant-header">
                  <span>
                    Variante {vIdx + 1}: <strong>{v.sapRef || v.baseCode || '—'}</strong>
                  </span>
                  <div>
                    <button
                      type="button"
                      onClick={() => openVariantDialogEdit(vIdx)}
                      disabled={saving}
                    >
                      Editar
                    </button>
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
                <div className="base-edit-variant-preview">
                  {v.components.map((c) => (
                    <span key={c.id || `${vIdx}-${c.name}`} className="base-edit-chip">
                      {c.name || c.sapCode || '—'}: {c.value || '—'}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              className="base-edit-add-variant"
              onClick={openVariantDialogNew}
              disabled={saving}
            >
              + Agregar variante
            </button>

            {variantDialog && variantDraft && (
              <div
                className="base-edit-variant-modal-overlay"
                onClick={closeVariantDialog}
                role="presentation"
              >
                <div
                  className="base-edit-variant-modal"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="base-edit-variant-modal-title"
                >
                  <div className="base-edit-variant-modal-header">
                    <h2 id="base-edit-variant-modal-title">
                      {variantDialog.mode === 'new'
                        ? 'Nueva variante'
                        : `Editar variante ${variantDialog.idx + 1}`}
                    </h2>
                    <button
                      type="button"
                      className="base-edit-close"
                      onClick={closeVariantDialog}
                      aria-label="Cerrar"
                    >
                      ×
                    </button>
                  </div>

                  <div className="base-edit-variant-modal-body">
                    {variantDialog.mode === 'edit' && variantDraft.id ? (
                      <>
                        <label className="base-edit-variant-modal-field">
                          SAP Ref
                          <input
                            value={variantDraft.sapRef}
                            onChange={(e) => editDraftSetSap(e.target.value)}
                          />
                        </label>
                        <p className="base-edit-hint">
                          Media actual — imagen: {variantDraft.image || '—'} · modelo:{' '}
                          {variantDraft.model || '—'}
                        </p>
                        <label className="base-edit-variant-modal-field">
                          Reemplazar imagen
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              editDraftSetFile('imageFile', e.target.files?.[0] || null)
                            }
                          />
                        </label>
                        <label className="base-edit-variant-modal-field">
                          Reemplazar modelo (GLB, GLTF, DWG…)
                          <input
                            type="file"
                            accept=".glb,.gltf,.dwg,.step,.stp"
                            onChange={(e) =>
                              editDraftSetFile('modelFile', e.target.files?.[0] || null)
                            }
                          />
                        </label>
                        {variantDraft.components.map((c, cIdx) => {
                          const refForValues = c.id || c.sapRef || c.name;
                          return (
                            <div key={c.id || `e-${cIdx}`} className="base-edit-variant-modal-comp-columns">
                              <input
                                placeholder="Título (o buscar existente)"
                                value={c.name}
                                onChange={(e) =>
                                  editDraftPatchCompNameValue(cIdx, 'name', e.target.value)
                                }
                                onBlur={() => blurEditDraftComponentName(cIdx)}
                                list="base-edit-comp-options-modal"
                                title="Escribe para buscar o selecciona un componente existente"
                              />
                              <input
                                placeholder="Código SAP"
                                value={c.sapCode ?? c.sapRef ?? ''}
                                onChange={(e) => editDraftSapChange(cIdx, e.target.value)}
                                title="Código SAP (REF se rellena igual internamente)"
                              />
                              <AutocompleteInput
                                className="base-edit-autocomplete-full"
                                value={c.value ?? ''}
                                onChange={(e) =>
                                  editDraftPatchCompNameValue(cIdx, 'value', e.target.value)
                                }
                                options={
                                  refForValues
                                    ? componentValuesByRef[refForValues] || allComponentValues
                                    : allComponentValues
                                }
                                placeholder="Valor"
                              />
                              <button
                                type="button"
                                onClick={() => editDraftRemoveComp(cIdx)}
                                disabled={variantDraft.components.length <= 1}
                              >
                                −
                              </button>
                            </div>
                          );
                        })}
                        <datalist id="base-edit-comp-options-modal">
                          {componentOptions.map((o) => (
                            <option key={o.id} value={o.label || o.sapRef || o.id} />
                          ))}
                        </datalist>
                        <button type="button" className="base-edit-add-comp" onClick={editDraftAddComp}>
                          + Componente
                        </button>
                      </>
                    ) : (
                      <>
                        <label className="base-edit-variant-modal-field">
                          SAP Ref
                          <input
                            value={variantDraft.sapRef}
                            onChange={(e) => newDraftSetSap(e.target.value)}
                          />
                        </label>
                        <label className="base-edit-variant-modal-field">
                          Imagen *
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              newDraftSetFile('imageFile', e.target.files?.[0] || null)
                            }
                          />
                        </label>
                        <label className="base-edit-variant-modal-field">
                          Modelo *
                          <input
                            type="file"
                            accept=".glb,.gltf,.dwg,.step,.stp"
                            onChange={(e) =>
                              newDraftSetFile('modelFile', e.target.files?.[0] || null)
                            }
                          />
                        </label>
                        {variantDraft.components.map((c, cIdx) => {
                          const compLabel = c.componentId
                            ? componentOptions.find((o) => o.id === c.componentId)?.label ?? ''
                            : c.componentName ?? c.componentSapRef ?? '';
                          const refForValues = c.componentId || c.componentSapRef || c.componentName;
                          return (
                            <div key={cIdx} className="base-edit-variant-modal-comp-columns">
                              <AutocompleteInput
                                value={compLabel}
                                onChange={(e) => newDraftComponentSelect(cIdx, e.target.value)}
                                options={componentOptions.map((o) => o.label)}
                                placeholder="Componente (existente o nuevo)"
                              />
                              <input
                                value={c.componentSapCode ?? c.componentSapRef ?? ''}
                                onChange={(e) => newDraftSapChange(cIdx, e.target.value)}
                                placeholder="Código SAP"
                                title="Código SAP (REF se rellena igual internamente)"
                              />
                              <AutocompleteInput
                                value={c.componentValue ?? ''}
                                onChange={(e) =>
                                  newDraftPatchComp(cIdx, 'componentValue', e.target.value)
                                }
                                options={
                                  refForValues
                                    ? componentValuesByRef[refForValues] || allComponentValues
                                    : allComponentValues
                                }
                                placeholder="Valor"
                              />
                              <button
                                type="button"
                                onClick={() => newDraftRemoveComp(cIdx)}
                                disabled={variantDraft.components.length <= 1}
                              >
                                −
                              </button>
                            </div>
                          );
                        })}
                        <button type="button" className="base-edit-add-comp" onClick={newDraftAddComp}>
                          + Componente
                        </button>
                      </>
                    )}
                  </div>

                  <div className="base-edit-variant-modal-footer">
                    <button type="button" onClick={closeVariantDialog} disabled={saving}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="base-edit-variant-modal-save"
                      onClick={() =>
                        variantDialog.mode === 'new'
                          ? saveNewVariantFromModal()
                          : saveEditVariantFromModal()
                      }
                      disabled={saving}
                    >
                      {saving
                        ? 'Guardando…'
                        : variantDialog.mode === 'new'
                          ? 'Agregar variante'
                          : 'Guardar variante'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {message && <p className="base-edit-message">{message}</p>}
      </div>
    </div>
  );
}
