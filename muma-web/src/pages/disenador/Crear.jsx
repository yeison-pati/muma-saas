import { useState, useMemo } from 'react';
import { useProductsService } from '../../hooks/useProductsService';
import { useUser } from '../../context/UserContext';
import { useProducts } from '../../context/ProductsContext';
import { uploadFile } from '../../api/documentService';
import { toUpperFormValue } from '../../utils/formText';
import { graphqlErrorUserMessage } from '../../utils/graphqlErrorUserMessage';
import CrearFormFields from './CrearFormFields';
import CrearVariantsSection from './CrearVariantsSection';
import CrearVariantModal from './CrearVariantModal';
import './Crear.css';

const emptyComponent = () => ({
  componentId: null,
  componentName: '',
  componentSapRef: '',
  componentSapCode: '',
  componentValue: '',
});

const emptyVariant = () => ({
  sapRef: '',
  imageFile: null,
  modelFile: null,
  components: [emptyComponent()],
});

const UPPER_FORM = new Set(['code', 'name', 'category', 'subcategory', 'space', 'line', 'baseMaterial']);

export default function DisenadorCrear() {
  const productsService = useProductsService();
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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [initialVariants, setInitialVariants] = useState([]);
  const [variantModal, setVariantModal] = useState(null);
  const [variantDraft, setVariantDraft] = useState(null);

  const { componentOptions, componentValuesByRef, allComponentValues } = useMemo(() => {
    const byId = new Map();
    const valuesByRef = {};
    const allValues = new Set();
    for (const p of products) {
      for (const v of p.variants || []) {
        for (const c of v.components || []) {
          if (c?.id) {
            byId.set(c.id, {
              id: c.id,
              label: c.name || c.sapRef || c.id,
              sapRef: c.sapRef,
              sapCode: c.sapCode,
            });
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
  }, [products]);

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
    const v = UPPER_FORM.has(name) ? toUpperFormValue(value) : value;
    setForm((prev) => ({ ...prev, [name]: v }));
  };

  const openVariantNew = () => {
    setMessage('');
    setVariantDraft(emptyVariant());
    setVariantModal({ mode: 'new' });
  };

  const openVariantEdit = (index) => {
    setMessage('');
    const v = initialVariants[index];
    if (!v) return;
    setVariantDraft({
      ...v,
      components: (v.components || []).map((c) => ({ ...c })),
    });
    setVariantModal({ mode: 'edit', index });
  };

  const closeVariantModal = () => {
    setVariantModal(null);
    setVariantDraft(null);
  };

  const confirmVariantModal = () => {
    const d = variantDraft;
    if (!d || !variantModal) return;

    const componentsFiltered = d.components.filter(
      (c) => c.componentId || c.componentSapRef?.trim() || c.componentSapCode?.trim()
    );
    if (componentsFiltered.length === 0) {
      setMessage('La variante debe tener al menos un componente con SAP o existente.');
      return;
    }

    const withNameNoSap = d.components.some(
      (c) =>
        !c.componentId &&
        c.componentName?.trim() &&
        !(c.componentSapRef?.trim() || c.componentSapCode?.trim())
    );
    if (withNameNoSap) {
      setMessage('Los componentes nuevos requieren Código SAP (nombre e SAP son independientes).');
      return;
    }

    if (!d.imageFile || !d.modelFile) {
      setMessage('Imagen y modelo son obligatorios para cada variante.');
      return;
    }

    if (variantModal.mode === 'new') {
      setInitialVariants((prev) => [...prev, d]);
    } else {
      const idx = variantModal.index;
      setInitialVariants((prev) => prev.map((v, i) => (i === idx ? d : v)));
    }
    closeVariantModal();
  };

  const removeVariant = (variantIdx) => {
    setInitialVariants((prev) => prev.filter((_, i) => i !== variantIdx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const baseFieldsOk =
        form.code?.trim() &&
        form.name?.trim() &&
        form.category?.trim() &&
        form.subcategory?.trim() &&
        form.space?.trim() &&
        form.line?.trim() &&
        form.baseMaterial?.trim();
      if (!baseFieldsOk) {
        setMessage('Complete todos los campos de la base (incl. categoría, espacio, línea, materia).');
        setSaving(false);
        return;
      }

      if (initialVariants.length === 0) {
        setMessage('Agregá al menos una variante (botón «Crear variante»).');
        setSaving(false);
        return;
      }

      const withNameNoSap = initialVariants.some((v) =>
        v.components.some(
          (c) =>
            !c.componentId &&
            c.componentName?.trim() &&
            !(c.componentSapRef?.trim() || c.componentSapCode?.trim())
        )
      );
      if (withNameNoSap) {
        setMessage('Los componentes nuevos requieren Código SAP (nombre e SAP son independientes)');
        setSaving(false);
        return;
      }

      for (let i = 0; i < initialVariants.length; i++) {
        const v = initialVariants[i];
        if (!v.imageFile || !v.modelFile) {
          setMessage(`Variante ${i + 1}: suba imagen y modelo obligatorios.`);
          setSaving(false);
          return;
        }
      }

      const variantsToSend = [];
      for (const v of initialVariants) {
        const components = v.components.filter(
          (c) => c.componentId || c.componentSapRef?.trim() || c.componentSapCode?.trim()
        );
        if (components.length === 0) {
          setMessage('Cada variante debe tener al menos un componente.');
          setSaving(false);
          return;
        }
        const imgRes = await uploadFile(v.imageFile, 'image');
        const modRes = await uploadFile(v.modelFile, 'model');
        variantsToSend.push({
          sapRef: v.sapRef?.trim() || null,
          image: imgRes.key,
          model: modRes.key,
          components: components.map((c) => ({
            componentId: c.componentId || null,
            componentName: c.componentName?.trim() || null,
            componentSapRef: c.componentSapRef?.trim() || null,
            componentSapCode: c.componentSapCode?.trim() || null,
            componentValue: c.componentValue?.trim() || null,
          })),
        });
      }

      await productsService.createBase({
        ...form,
        creatorId: user?.id,
        creatorName: user?.name,
        initialVariants: variantsToSend,
      });
      setMessage('Base creada correctamente');
      setForm({
        code: '',
        name: '',
        category: '',
        subcategory: '',
        space: '',
        line: '',
        baseMaterial: '',
      });
      setInitialVariants([]);
      reload();
    } catch (err) {
      const { short } = graphqlErrorUserMessage(err);
      setMessage(short || 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  const variantModalTitle =
    variantModal?.mode === 'edit'
      ? `Editar variante ${(variantModal.index ?? 0) + 1}`
      : 'Nueva variante';

  return (
    <div className="crear-page">
      <form className="crear-form" onSubmit={handleSubmit}>
        <CrearFormFields
          form={form}
          handleChange={handleChange}
          categories={categories}
          subcategories={subcategories}
          spaces={spaces}
          lines={lines}
          baseMaterials={baseMaterials}
        />

        <CrearVariantsSection
          initialVariants={initialVariants}
          onOpenNew={openVariantNew}
          onOpenEdit={openVariantEdit}
          onRemoveVariant={removeVariant}
        />

        <div className="crear-submit-row">
          {message && (
            <p
              className={`crear-message ${
                message.includes('correctamente') ? 'crear-message--success' : 'crear-message--error'
              }`}
            >
              {message}
            </p>
          )}
          <button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear base'}
          </button>
        </div>
      </form>

      <CrearVariantModal
        open={Boolean(variantModal && variantDraft)}
        title={variantModalTitle}
        draft={variantDraft}
        setDraft={setVariantDraft}
        onClose={closeVariantModal}
        onConfirm={confirmVariantModal}
        saving={saving}
        confirmLabel="Guardar variante"
        componentOptions={componentOptions}
        componentValuesByRef={componentValuesByRef}
        allComponentValues={allComponentValues}
      />
    </div>
  );
}
