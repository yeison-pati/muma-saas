import { createContext, useContext } from 'react';
import { useUser } from './UserContext';
import { useCart } from './CartContext';
import { useCatalogService } from '../hooks/useCatalogService';
import { useIdentityService } from '../hooks/useIdentityService';
import { calculateTipologia } from '../utils/calculateTipologia';
import { uploadFile } from '../api/documentService';

const ProjectContext = createContext(null);

function normalizeRegion(s) {
  if (!s) return '';
  return String(s)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function pickQuoterForRegion(quoters, region) {
  if (!region || !quoters?.length) return null;
  const norm = normalizeRegion(region);
  const byRegion = quoters.filter(
    (q) => q?.user?.region && normalizeRegion(q.user.region) === norm
  );
  if (byRegion.length === 0) return null;
  const sorted = [...byRegion].sort((a, b) => (a.projects ?? 0) - (b.projects ?? 0));
  return sorted[0];
}

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
};

export const ProjectProvider = ({ children }) => {
  const { user } = useUser();
  const { userProject, customProducts, clearCart } = useCart();
  const catalog = useCatalogService();
  const identity = useIdentityService();

  const formatProductForVariant = (product) => {
    const originals = product._componentOriginals || {};
    const updated = product.caracteristicas || {};
    const originalByName = product._originalCaracteristicas || {};
    const updatedByName = Object.fromEntries(
      Object.entries(updated).map(([id, v]) => [originals[id]?.name || id, v ?? ''])
    );
    const hasMatchingVariant = !!product._selectedVariantId;
    const tipologiaFromChange = calculateTipologia(originalByName, updatedByName);
    const tipologia = tipologiaFromChange
      || (!hasMatchingVariant && Object.keys(updated).length > 0 ? 'p3' : hasMatchingVariant ? 'p4' : undefined);

    const selectedVariant = product._selectedVariantId && product.variants?.length
      ? product.variants.find((v) => String(v.id) === String(product._selectedVariantId))
      : product.variants?.[0];

    const comps = updated && Object.keys(updated).length > 0
      ? Object.entries(updated)
          .filter(([, v]) => v != null && v !== '')
          .map(([componentId, value]) => {
            const orig = originals[componentId];
            const origVal = String(orig?.value ?? '').trim();
            const newVal = String(value ?? '').trim();
            const modified = origVal !== newVal;
            if (modified && orig) {
              return {
                componentId: null,
                componentSapRef: orig.sapRef || orig.sapCode,
                componentValue: newVal,
                modified: true,
                componentName: orig.name,
              };
            }
            return {
              componentId,
              componentSapRef: orig?.sapRef || orig?.sapCode || null,
              componentValue: newVal,
            };
          })
      : (selectedVariant?.components || []).map((c) => ({
          componentId: c.id,
          componentSapRef: null,
          componentValue: c.value ?? '',
        }));

    return {
      variantId: product._selectedVariantId || selectedVariant?.id || undefined,
      baseCode: product.code,
      variantSapRef: selectedVariant?.sapRef,
      type: tipologia || undefined,
      quantity: product.quantity ?? 1,
      comments: product.comentarios || '',
      image: product.image || undefined,
      components: comps.length ? comps : [{ componentId: null, componentSapRef: 'default', componentValue: 'default' }],
    };
  };

  const formatCustomForP3 = (custom) => {
    const comps = custom.caracteristicas || custom.specifications || {};
    const components = Object.entries(comps)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => ({ componentId: null, componentName: k, componentValue: String(v) }));

    return {
      comment: custom.comentarios || custom.comment || '',
      image: custom.image || undefined,
      components: components.length ? components : [{ componentId: null, componentName: 'P3', componentValue: 'custom' }],
    };
  };

  const submitProject = async ({ name, cliente, regional, asesor, fechaEntrega }) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    if (!userProject.length && !customProducts.length) throw new Error('El carrito está vacío');

    const variants = userProject.map(formatProductForVariant);
    console.log('[submitProject] userProject=', userProject.length, 'variants=', variants.length, variants);

    const p3s = await Promise.all(
      customProducts.map(async (custom) => {
        let image = custom.image;
        if (custom.imageFile) {
          try {
            const res = await uploadFile(custom.imageFile, 'image');
            image = res?.key || null;
          } catch (e) {
            throw new Error('Error al subir la imagen del P3: ' + (e?.message || ''));
          }
        }
        return formatCustomForP3({ ...custom, image });
      })
    );

    if (!regional) {
      throw new Error('Debe seleccionar una región para crear el proyecto.');
    }

    console.log('[submitProject] getQuoters...');
    const quoters = await identity.getQuoters();
    console.log('[submitProject] quoters=', quoters?.length, 'regional=', regional);
    const quoter = pickQuoterForRegion(quoters, regional);
    console.log('[submitProject] quoter elegido=', quoter?.user?.id, quoter?.user?.name);
    if (!quoter?.user) {
      throw new Error(
        `No hay cotizador asignado para la región "${regional}". No se puede crear el proyecto. Asigne un cotizador a esta región desde el panel de administración.`
      );
    }

    const input = {
      name: name || 'Proyecto',
      client: cliente,
      region: regional,
      salesId: user.id,
      salesName: user.name,
      salesEmail: user.email,
      salesPhone: user.phone,
      quoterId: quoter.user.id,
      quoterName: quoter.user.name,
      quoterEmail: quoter.user.email,
      variants,
      p3s,
    };

    console.log('[submitProject] input.variants=', input.variants?.length, input.variants);
    console.log('[submitProject] catalog.createProject...');
    const created = await catalog.createProject(input);
    console.log('[submitProject] creado', created?.id, created?.consecutive);
    clearCart();
  };

  return (
    <ProjectContext.Provider value={{ submitProject, formatProductForVariant, formatCustomForP3 }}>
      {children}
    </ProjectContext.Provider>
  );
};
