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
