import { createContext, useContext, useEffect, useState } from 'react';
import { useProductsService } from '../hooks/useProductsService';
import { getMediaUrls } from '../api/documentService';

const ProductsContext = createContext(null);

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
};

export const ProductsProvider = ({ children }) => {
  const productsService = useProductsService();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const bases = await productsService.getProducts();
      if (!bases?.length) {
        setProducts([]);
        return;
      }
      const imageKeys = [
        ...new Set(
          bases.flatMap((b) =>
            (b.variants || []).map((v) => v.image).filter(Boolean)
          )
        ),
      ];
      const urlMap =
        imageKeys.length > 0 ? (await getMediaUrls(imageKeys, 'image')).data || {} : {};

      const final = bases.map((b) => {
        const variants = (b.variants || []).map((v) => ({
          ...v,
          fullUrl: v.image ? urlMap[v.image] || null : null,
        }));
        const fullUrl =
          variants[0]?.fullUrl || variants.find((v) => v.fullUrl)?.fullUrl || null;
        return {
          ...b,
          variants,
          fullUrl,
        };
      });
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
