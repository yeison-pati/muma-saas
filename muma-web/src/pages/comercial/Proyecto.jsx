import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { useProject } from '../../context/ProjectContext';
import { useCatalogService } from '../../hooks/useCatalogService';
import ProjectForm from '../../components/ProjectForm';
import CartItem from '../../components/CartItem';
import './Proyecto.css';

function getTodayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ComercialProyecto() {
  const { user } = useUser();
  const catalog = useCatalogService();
  const {
    userProject,
    customProducts,
    removeProductFromProject,
    updateProductInProject,
    increaseProductQty,
    decreaseProductQty,
    removeCustomProduct,
    updateCustomProduct,
    increaseCustomProductQty,
    decreaseCustomProductQty,
    clearCart,
  } = useCart();
  const { submitProject } = useProject();

  const [expandedItemId, setExpandedItemId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [clientOptions, setClientOptions] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    catalog
      .getProjectsBySales(user.id)
      .then((data) => {
        const clients = [...new Set((data || []).map((p) => p.client).filter(Boolean))].sort();
        setClientOptions(clients);
      })
      .catch(() => setClientOptions([]));
  }, [user?.id, catalog]);

  const isEmpty = userProject.length === 0 && customProducts.length === 0;

  const toggleExpanded = (id) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

  const handleChangeCaracteristica = (item, key, value) => {
    const updated = { ...(item.caracteristicas || {}), [key]: value };
    updateProductInProject(item.id, { caracteristicas: updated });
  };

  const handleSubmit = async (formData) => {
    setSubmitMessage('');
    if (!formData.name || !formData.client) {
      setSubmitMessage('Completa nombre y cliente para crear el proyecto.');
      return;
    }

    try {
      setSubmitting(true);
      await submitProject({
        name: formData.name,
        cliente: formData.client,
        regional: formData.region,
        asesor: user?.name,
        fechaEntrega: getTodayDate(),
      });
      setSubmitMessage('Proyecto creado correctamente.');
      setFormKey((k) => k + 1);
    } catch (e) {
      setSubmitMessage(e?.message || 'Error creando el proyecto.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearCart = () => {
    clearCart();
  };

  return (
    <div className="proyecto-page">
      <div className="proyecto-layout">
        <div className="proyecto-items">
          <div className="proyecto-items-header">
            <h2>Productos</h2>
            <button
              type="button"
              className="proyecto-clear-btn"
              disabled={isEmpty}
              onClick={handleClearCart}
            >
              Vaciar carrito
            </button>
          </div>

          {isEmpty ? (
            <p className="proyecto-empty">
              El carrito está vacío. Añade productos desde la vista de productos o crea un P3.
            </p>
          ) : (
            <>
              {userProject.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  expanded={expandedItemId === item.id}
                  onToggle={() => toggleExpanded(item.id)}
                  onIncrease={() => increaseProductQty(item.id)}
                  onDecrease={() => decreaseProductQty(item.id)}
                  onChangeCaracteristica={(key, text) =>
                    handleChangeCaracteristica(item, key, text)
                  }
                  onChangeComment={(text) =>
                    updateProductInProject(item.id, { comentarios: text })
                  }
                  onRemove={() => removeProductFromProject(item)}
                />
              ))}
              {customProducts.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  expanded={expandedItemId === item.id}
                  onToggle={() => toggleExpanded(item.id)}
                  onIncrease={() => increaseCustomProductQty(item.id)}
                  onDecrease={() => decreaseCustomProductQty(item.id)}
                  onChangeCaracteristica={(key, text) => {
                    const updated = { ...(item.caracteristicas || {}), [key]: text };
                    updateCustomProduct(item.id, { caracteristicas: updated });
                  }}
                  onChangeComment={(text) =>
                    updateCustomProduct(item.id, { comentarios: text })
                  }
                  onRemove={() => removeCustomProduct(item.id)}
                />
              ))}
            </>
          )}

          <Link to="/comercial/p3" className="proyecto-p3-btn">
            + Crear P3
          </Link>
        </div>

        <div className="proyecto-form">
          <ProjectForm
            key={formKey}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitMessage={submitMessage}
            cartEmpty={isEmpty}
            asesor={user?.name}
            clientOptions={clientOptions}
          />
        </div>
      </div>
    </div>
  );
}
