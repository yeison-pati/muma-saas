import { useState } from 'react';
import { useCatalogService } from '../../hooks/useCatalogService';
import { useUser } from '../../context/UserContext';
import { useProducts } from '../../context/ProductsContext';
import { uploadFile } from '../../api/documentService';
import CrearFormFields from './CrearFormFields';
import CrearVariantsSection from './CrearVariantsSection';
import './Crear.css';

export default function DisenadorCrear() {
  const catalog = useCatalogService();
  const { user } = useUser();
  const { products, reload } = useProducts();
  const [form, setForm] = useState({
    code: '',
    name: '',
    category: '',
    subcategory: '',
    space: '',
    line: '',
    baseMaterial: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [initialVariants, setInitialVariants] = useState([
    { sapRef: '', components: [{ componentId: null, componentName: '', componentSapRef: '', componentSapCode: '', componentValue: '' }] },
  ]);

  const { componentOptions, componentValuesByRef, allComponentValues } = (() => {
    const byId = new Map();
    const valuesByRef = {};
    const allValues = new Set();
    for (const p of products) {
      for (const v of p.variants || []) {
        for (const c of v.components || []) {
          if (c?.id) {
            byId.set(c.id, { id: c.id, label: c.name || c.sapRef || c.id, sapRef: c.sapRef, sapCode: c.sapCode });
            const ref = c.sapRef || c.id;
            if (!valuesByRef[ref]) valuesByRef[ref] = new Set();
            if (c.value != null && String(c.value).trim()) {
              const val = String(c.value).trim();
              valuesByRef[ref].add(val);
              allValues.add(val);
            }
          }
        }
      }
    }
    return {
      componentOptions: [...byId.values()].sort((a, b) => (a.label || '').localeCompare(b.label || '')),
      componentValuesByRef: Object.fromEntries(
        Object.entries(valuesByRef).map(([k, v]) => [k, [...v].sort()])
      ),
      allComponentValues: [...allValues].sort(),
    };
  })();

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

  const handleVariantChange = (variantIdx, field, value) => {
    setInitialVariants((prev) =>
      prev.map((v, i) => (i === variantIdx ? { ...v, [field]: value } : v))
    );
  };

  const handleComponentChange = (variantIdx, compIdx, field, value) => {
    setInitialVariants((prev) =>
      prev.map((v, i) =>
        i === variantIdx
          ? {
              ...v,
              components: v.components.map((c, j) =>
                j === compIdx ? { ...c, [field]: value } : c
              ),
            }
          : v
      )
    );
  };

  const handleComponentSapChange = (variantIdx, compIdx, value) => {
    setInitialVariants((prev) =>
      prev.map((v, i) =>
        i === variantIdx
          ? {
              ...v,
              components: v.components.map((c, j) =>
                j === compIdx ? { ...c, componentSapRef: value, componentSapCode: value } : c
              ),
            }
          : v
      )
    );
  };

  const handleComponentSelect = (variantIdx, compIdx, val) => {
    const found = componentOptions.find((o) => o.label === val);
    if (found) {
      setInitialVariants((prev) =>
        prev.map((v, i) =>
          i === variantIdx
            ? {
                ...v,
                components: v.components.map((c, j) =>
                  j === compIdx
                    ? {
                        ...c,
                        componentId: found.id,
                        componentName: '',
                        componentSapRef: found.sapRef ?? '',
                        componentSapCode: found.sapCode ?? found.sapRef ?? '',
                      }
                    : c
                ),
              }
            : v
        )
      );
    } else {
      setInitialVariants((prev) =>
        prev.map((v, i) =>
          i === variantIdx
            ? {
                ...v,
                components: v.components.map((c, j) =>
                  j === compIdx
                    ? { ...c, componentId: null, componentName: (val || '').trim(), componentSapRef: '', componentSapCode: '' }
                    : c
                ),
              }
            : v
        )
      );
    }
  };

  const addComponent = (variantIdx) => {
    setInitialVariants((prev) =>
      prev.map((v, i) =>
        i === variantIdx
          ? { ...v, components: [...v.components, { componentId: null, componentName: '', componentSapRef: '', componentSapCode: '', componentValue: '' }] }
          : v
      )
    );
  };

  const removeComponent = (variantIdx, compIdx) => {
    setInitialVariants((prev) =>
      prev.map((v, i) =>
        i === variantIdx
          ? { ...v, components: v.components.filter((_, j) => j !== compIdx) }
          : v
      )
    );
  };

  const addVariant = () => {
    setInitialVariants((prev) => [
      ...prev,
      { sapRef: '', components: [{ componentId: null, componentName: '', componentSapRef: '', componentSapCode: '', componentValue: '' }] },
    ]);
  };

  const removeVariant = (variantIdx) => {
    setInitialVariants((prev) => prev.filter((_, i) => i !== variantIdx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      let imageKey = null;
      let modelKey = null;

      if (imageFile) {
        const res = await uploadFile(imageFile, 'image');
        imageKey = res.key;
      }
      if (modelFile) {
        const res = await uploadFile(modelFile, 'model');
        modelKey = res.key;
      }

      const withNameNoSap = initialVariants.some((v) =>
        v.components.some(
          (c) => !c.componentId && (c.componentName?.trim()) && !(c.componentSapRef?.trim() || c.componentSapCode?.trim())
        )
      );
      if (withNameNoSap) {
        setMessage('Los componentes nuevos requieren Código SAP (nombre e SAP son independientes)');
        setSaving(false);
        return;
      }

      const variantsToSend = initialVariants
        .map((v) => {
          const components = v.components.filter(
            (c) => c.componentId || c.componentSapRef?.trim() || c.componentSapCode?.trim()
          );
          if (components.length === 0) return null;
          return {
            sapRef: v.sapRef?.trim() || null,
            components: components.map((c) => ({
              componentId: c.componentId || null,
              componentName: c.componentName?.trim() || null,
              componentSapRef: c.componentSapRef?.trim() || null,
              componentSapCode: c.componentSapCode?.trim() || null,
              componentValue: c.componentValue?.trim() || null,
            })),
          };
        })
        .filter(Boolean);

      if (variantsToSend.length === 0) {
        setMessage('Debe agregar al menos una variante con un componente');
        setSaving(false);
        return;
      }

      await catalog.createBase({
        ...form,
        image: imageKey,
        model: modelKey,
        creatorId: user?.id,
        creatorName: user?.name,
        initialVariants: variantsToSend,
      });
      setMessage('Base creada correctamente');
      setForm({ code: '', name: '', category: '', subcategory: '', space: '', line: '', baseMaterial: '' });
      setInitialVariants([{ sapRef: '', components: [{ componentId: null, componentName: '', componentSapRef: '', componentSapCode: '', componentValue: '' }] }]);
      setImageFile(null);
      setModelFile(null);
      reload();
    } catch (err) {
      setMessage(err?.message || 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="crear-page">
      <form className="crear-form" onSubmit={handleSubmit}>
        <CrearFormFields
          form={form}
          handleChange={handleChange}
          setImageFile={setImageFile}
          setModelFile={setModelFile}
          categories={categories}
          subcategories={subcategories}
          spaces={spaces}
          lines={lines}
          baseMaterials={baseMaterials}
        />

        <CrearVariantsSection
          initialVariants={initialVariants}
          componentOptions={componentOptions}
          componentValuesByRef={componentValuesByRef}
          allComponentValues={allComponentValues}
          handleVariantChange={handleVariantChange}
          handleComponentChange={handleComponentChange}
          handleComponentSapChange={handleComponentSapChange}
          handleComponentSelect={handleComponentSelect}
          addComponent={addComponent}
          removeComponent={removeComponent}
          addVariant={addVariant}
          removeVariant={removeVariant}
        />

        <div className="crear-submit-row">
          {message && <p className="crear-message">{message}</p>}
          <button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear base'}
          </button>
        </div>
      </form>
    </div>
  );
}
