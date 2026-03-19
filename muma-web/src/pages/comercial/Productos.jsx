import { useState } from 'react';
import { useFilters } from '../../context/FiltersContext';
import { useCart } from '../../context/CartContext';
import ProductDetailModal from '../../components/ProductDetailModal';
import DynamicFilterPanel from '../../components/DynamicFilterPanel';
import BaseList from '../../components/BaseList';
import './Productos.css';

export default function ComercialProductos() {
  const { productsByCategory } = useFilters();
  const { addProductToProject } = useCart();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      <button
        type="button"
        className="productos-filters-toggle"
        onClick={() => setFiltersOpen(true)}
        aria-label="Abrir filtros"
      >
        Filtros
      </button>
      <div className="productos-layout">
        <aside className={`productos-filters ${filtersOpen ? 'productos-filters-open' : ''}`}>
          <div className="productos-filters-header">
            <span>Filtros</span>
            <button
              type="button"
              className="productos-filters-close"
              onClick={() => setFiltersOpen(false)}
              aria-label="Cerrar filtros"
            >
              ✕
            </button>
          </div>
          <DynamicFilterPanel />
        </aside>
        <button
          type="button"
          className="productos-filters-backdrop"
          aria-hidden={!filtersOpen}
          onClick={() => setFiltersOpen(false)}
        />
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
