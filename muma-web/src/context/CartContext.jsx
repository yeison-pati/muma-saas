import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserContext';

const CartContext = createContext(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

const STORAGE_PROJECT = (userId) => `project:${userId}`;
const STORAGE_CUSTOM = (userId) => `customProducts:${userId}`;

export const CartProvider = ({ children }) => {
  const { user } = useUser();
  const [userProject, setUserProject] = useState([]);
  const [customProducts, setCustomProducts] = useState([]);

  useEffect(() => {
    if (!user?.id) {
      setUserProject([]);
      setCustomProducts([]);
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_PROJECT(user.id));
      setUserProject(stored ? JSON.parse(stored) : []);
      const storedCustom = localStorage.getItem(STORAGE_CUSTOM(user.id));
      setCustomProducts(storedCustom ? JSON.parse(storedCustom) : []);
    } catch {
      setUserProject([]);
      setCustomProducts([]);
    }
  }, [user?.id]);

  const saveProject = (data) => {
    if (user?.id) localStorage.setItem(STORAGE_PROJECT(user.id), JSON.stringify(data));
  };

  const saveCustom = (data) => {
    if (user?.id) {
      const serializable = data.map(({ imageFile, ...rest }) => rest);
      localStorage.setItem(STORAGE_CUSTOM(user.id), JSON.stringify(serializable));
    }
  };

  const addProductToProject = (product, quantity = 1) => {
    if (!user?.id) return;
    const uniqueId = `${product.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const selectedVariant = product._selectedVariantId && product.variants?.length
      ? product.variants.find((v) => String(v.id) === String(product._selectedVariantId))
      : product.variants?.[0];
    const variantsList = product.variants || [];

    let caracteristicas = product.caracteristicas;
    let _componentOriginals = product._componentOriginals;
    let _originalCaracteristicas = product._originalCaracteristicas;

    if (!caracteristicas || Object.keys(caracteristicas).length === 0) {
      caracteristicas = (selectedVariant?.components || []).reduce((acc, c) => {
        if (c?.id && c.value != null) acc[c.id] = c.value;
        return acc;
      }, {});
    }
    if (!_componentOriginals || Object.keys(_componentOriginals).length === 0) {
      _componentOriginals = {};
      for (const compId of Object.keys(caracteristicas)) {
        const c = variantsList.flatMap((v) => v.components || []).find((x) => String(x?.id) === String(compId));
        if (c) _componentOriginals[compId] = { id: c.id, name: c.name, sapRef: c.sapRef, sapCode: c.sapCode, value: caracteristicas[compId] };
      }
    }
    if (!_originalCaracteristicas || Object.keys(_originalCaracteristicas).length === 0) {
      _originalCaracteristicas = (selectedVariant?.components || []).reduce((acc, c) => {
        if (c?.name) acc[c.name] = c.value ?? '';
        return acc;
      }, {});
    }
    const newItem = {
      ...product,
      id: uniqueId,
      _originalId: product.id,
      quantity,
      caracteristicas,
      _originalCaracteristicas,
      _componentOriginals,
      _selectedVariantId: product._selectedVariantId,
      comentarios: product.comentarios || '',
      sapRef: selectedVariant?.sapRef ?? product.sapRef,
      sapCode: selectedVariant?.sapCode ?? product.sapCode,
      type: selectedVariant?.type ?? product.type,
    };
    setUserProject((prev) => {
      const next = [...prev, newItem];
      saveProject(next);
      return next;
    });
  };

  const removeProductFromProject = (productOrId) => {
    if (!user?.id) return;
    const targetId =
      typeof productOrId === 'object' ? productOrId.id : productOrId;
    setUserProject((prev) => {
      const next = prev.filter((p) => p.id !== targetId);
      saveProject(next);
      return next;
    });
  };

  const updateProductInProject = (productId, updates) => {
    if (!user?.id) return;
    setUserProject((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, ...updates } : p
      );
      saveProject(next);
      return next;
    });
  };

  const increaseProductQty = (productId) => {
    if (!user?.id) return;
    setUserProject((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, quantity: (p.quantity || 1) + 1 } : p
      );
      saveProject(next);
      return next;
    });
  };

  const decreaseProductQty = (productId) => {
    if (!user?.id) return;
    setUserProject((prev) => {
      const next = prev
        .map((p) =>
          p.id === productId
            ? { ...p, quantity: Math.max(0, (p.quantity || 1) - 1) }
            : p
        )
        .filter((p) => (p.quantity || 0) > 0);
      saveProject(next);
      return next;
    });
  };

  const addCustomProduct = (item) => {
    if (!user?.id) return;
    const newItem = { ...item, id: Date.now().toString(), quantity: item.quantity || 1 };
    setCustomProducts((prev) => {
      const next = [...prev, newItem];
      saveCustom(next);
      return next;
    });
  };

  const removeCustomProduct = (id) => {
    if (!user?.id) return;
    setCustomProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveCustom(next);
      return next;
    });
  };

  const updateCustomProduct = (id, updates) => {
    if (!user?.id) return;
    setCustomProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      saveCustom(next);
      return next;
    });
  };

  const increaseCustomProductQty = (id) => {
    if (!user?.id) return;
    setCustomProducts((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, quantity: (p.quantity || 1) + 1 } : p
      );
      saveCustom(next);
      return next;
    });
  };

  const decreaseCustomProductQty = (id) => {
    if (!user?.id) return;
    setCustomProducts((prev) => {
      const next = prev
        .map((p) =>
          p.id === id
            ? { ...p, quantity: Math.max(0, (p.quantity || 1) - 1) }
            : p
        )
        .filter((p) => (p.quantity || 0) > 0);
      saveCustom(next);
      return next;
    });
  };

  const clearCart = () => {
    setUserProject([]);
    setCustomProducts([]);
    if (user?.id) {
      saveProject([]);
      saveCustom([]);
    }
  };

  return (
    <CartContext.Provider
      value={{
        userProject,
        customProducts,
        addProductToProject,
        removeProductFromProject,
        updateProductInProject,
        increaseProductQty,
        decreaseProductQty,
        addCustomProduct,
        removeCustomProduct,
        updateCustomProduct,
        increaseCustomProductQty,
        decreaseCustomProductQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
