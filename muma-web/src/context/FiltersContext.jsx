import { createContext, useContext, useState, useMemo } from 'react';
import { useProducts } from './ProductsContext';

const FiltersContext = createContext(null);

export const useFilters = () => {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used within FiltersProvider');
  return ctx;
};

const initialFilters = {
  categoria: null,
  subcategoria: null,
  espacio: null,
  linea: null,
  componentes: {},
};

export const FiltersProvider = ({ children }) => {
  const { products } = useProducts();
  const [selectedFilters, setSelectedFilters] = useState(initialFilters);

  const getProductsFilteredUntil = (level) => {
    return products.filter((p) => {
      if (level > 0 && selectedFilters.categoria && p.category !== selectedFilters.categoria)
        return false;
      if (
        level > 1 &&
        selectedFilters.subcategoria &&
        p.subcategory !== selectedFilters.subcategoria
      )
        return false;
      if (level > 2 && selectedFilters.espacio && p.space !== selectedFilters.espacio)
        return false;
      if (level > 3 && selectedFilters.linea && p.line !== selectedFilters.linea)
        return false;
      return true;
    });
  };

  const baseOptions = useMemo(() => {
    const optsCat = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
    const productsSub = getProductsFilteredUntil(1);
    const optsSub = [...new Set(productsSub.map((p) => p.subcategory).filter(Boolean))].sort();
    const productsEsp = getProductsFilteredUntil(2);
    const optsEsp = [...new Set(productsEsp.map((p) => p.space).filter(Boolean))].sort();
    const productsLin = getProductsFilteredUntil(3);
    const optsLin = [...new Set(productsLin.map((p) => p.line).filter(Boolean))].sort();
    return { categorias: optsCat, subcategorias: optsSub, espacios: optsEsp, lineas: optsLin };
  }, [products, selectedFilters]);

  const dynamicOptions = useMemo(() => {
    const map = {};
    const filtered = getProductsFilteredUntil(4);
    filtered.forEach((p) => {
      p.variants?.forEach((v) => {
        v.components?.forEach((c) => {
          if (!map[c.name]) map[c.name] = new Set();
          map[c.name].add(c.value);
        });
      });
    });
    return Object.keys(map).reduce((acc, k) => {
      acc[k] = [...map[k]].sort();
      return acc;
    }, {});
  }, [products, selectedFilters]);

  const productsByCategory = useMemo(() => {
    const filtered = products.filter((p) => {
      if (selectedFilters.categoria && p.category !== selectedFilters.categoria) return false;
      if (selectedFilters.subcategoria && p.subcategory !== selectedFilters.subcategoria)
        return false;
      if (selectedFilters.espacio && p.space !== selectedFilters.espacio) return false;
      if (selectedFilters.linea && p.line !== selectedFilters.linea) return false;
      const compFilters = Object.entries(selectedFilters.componentes || {});
      if (compFilters.length > 0) {
        return p.variants?.some((v) =>
          compFilters.every(
            ([fName, fValue]) =>
              v.components?.some((c) => c.name === fName && c.value === fValue)
          )
        );
      }
      return true;
    });
    return filtered.reduce((acc, p) => {
      (acc[p.category] = acc[p.category] || []).push(p);
      return acc;
    }, {});
  }, [products, selectedFilters]);

  const clearFilters = () => setSelectedFilters(initialFilters);

  const setFilter = (key, value) => {
    setSelectedFilters((prev) => {
      const next = { ...prev };
      if (key === 'categoria') {
        next.categoria = value;
        next.subcategoria = null;
        next.espacio = null;
        next.linea = null;
        next.componentes = {};
      } else if (key === 'subcategoria') {
        next.subcategoria = value;
        next.espacio = null;
        next.linea = null;
        next.componentes = {};
      } else if (key === 'espacio') {
        next.espacio = value;
        next.linea = null;
        next.componentes = {};
      } else if (key === 'linea') {
        next.linea = value;
        next.componentes = {};
      }
      return next;
    });
  };

  const setComponentFilter = (name, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      componentes: {
        ...prev.componentes,
        [name]: value,
      },
    }));
  };

  return (
    <FiltersContext.Provider
      value={{
        baseOptions,
        dynamicOptions,
        selectedFilters,
        setSelectedFilters,
        setFilter,
        setComponentFilter,
        productsByCategory,
        clearFilters,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
};
