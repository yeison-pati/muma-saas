import { useState } from 'react';
import { useFilters } from '../../context/FiltersContext';
import { useCart } from '../../context/CartContext';
import ProductDetailModal from '../../components/ProductDetailModal';
import DynamicFilterPanel from '../../components/DynamicFilterPanel';
import BaseList from '../../components/BaseList';
import './Productos.css';

export default function ComercialProductos() {
  const { productsByCategory, products } = useFilters();
  const { addProductToProject } = useCart();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (product) => {
    addProductToProject(product);
    setSelectedProduct(null);
  };

  const handleCloseModal = () => setSelectedProduct(null);

  return (
    <div className="productos-page">
      <div className="productos-layout">
        <aside className="productos-filters">
          <DynamicFilterPanel />
        </aside>
        <section className="productos-content">
          {Object.entries(productsByCategory || {}).map(([cat, items]) => (
            <BaseList
              key={cat}
              title={cat}
              items={items}
              onProductClick={handleProductClick}
            />
          ))}
        </section>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
          isDesigner={false}
        />
      )}
    </div>
  );
}
