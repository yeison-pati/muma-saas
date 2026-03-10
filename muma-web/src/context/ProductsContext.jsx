import { createContext, useContext, useEffect, useState } from 'react';
import { useCatalogService } from '../hooks/useCatalogService';
import { getMediaUrls } from '../api/documentService';

const ProductsContext = createContext(null);

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
};

export const ProductsProvider = ({ children }) => {
  const catalog = useCatalogService();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const bases = await catalog.getProducts();
      if (!bases?.length) {
        setProducts([]);
        return;
      }
      const keys = bases.map((b) => b.image).filter(Boolean);
      const urlMap =
        keys.length > 0
          ? (await getMediaUrls(keys, 'image')).data || {}
          : {};
      const final = bases.map((b) => ({
        ...b,
        fullUrl: urlMap[b.image] || null,
      }));
      setProducts(final);
    } catch (e) {
      console.error('Products load', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading, reload: loadProducts }}>
      {children}
    </ProductsContext.Provider>
  );
};
