import { useState } from 'react';
import { useFilters } from '../../context/FiltersContext';
import ProductDetailModal from '../../components/ProductDetailModal';
import BaseEditModal from '../../components/BaseEditModal';
import DynamicFilterPanel from '../../components/DynamicFilterPanel';
import BaseList from '../../components/BaseList';
import { useProductsService } from '../../hooks/useProductsService';
import { useProducts } from '../../context/ProductsContext';
import './Productos.css';

export default function DisenadorProductos() {
  const { productsByCategory } = useFilters();
  const { reload } = useProducts();
  const productsService = useProductsService();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleProductClick = (product) => setSelectedProduct(product);

  const handleEdit = (product) => {
    setSelectedProduct(null);
    setEditingProduct(product);
  };

  const handleCloseEdit = () => {
    setEditingProduct(null);
  };

  const handleEditSaved = () => {
    setEditingProduct(null);
  };

  const handleDelete = async (product) => {
    if (!confirm('¿Eliminar este producto y todas sus variantes?')) return;
    try {
      await productsService.deleteBase(product.id);
      setSelectedProduct(null);
      setEditingProduct(null);
      reload();
    } catch (err) {
      alert(err?.message || 'Error al eliminar');
    }
  };

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
          onClose={() => setSelectedProduct(null)}
          isDesigner
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editingProduct && (
        <BaseEditModal
          product={editingProduct}
          onClose={handleCloseEdit}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
