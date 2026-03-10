import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import AutocompleteInput from '../../components/AutocompleteInput';
import './P3.css';

const FILTER_ORDER = ['categoria', 'subcategoria', 'espacio', 'linea'];
const FILTER_PARENT = { subcategoria: 'categoria', espacio: 'subcategoria', linea: 'espacio' };

export default function ComercialP3() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addCustomProduct } = useCart();

  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState({ categoria: null, subcategoria: null, espacio: null, linea: null });
  const [cart, setCart] = useState([]);
  const [newCompName, setNewCompName] = useState('');
  const [newCompValue, setNewCompValue] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filters.categoria && p.category !== filters.categoria) return false;
      if (filters.subcategoria && p.subcategory !== filters.subcategoria) return false;
      if (filters.espacio && p.space !== filters.espacio) return false;
      if (filters.linea && p.line !== filters.linea) return false;
      return true;
    });
  }, [products, filters]);

  const baseOptions = useMemo(() => {
    const cat = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
    const sub = filters.categoria
      ? [...new Set(products.filter((p) => p.category === filters.categoria).map((p) => p.subcategory).filter(Boolean))].sort()
      : [];
    const esp = filters.categoria && filters.subcategoria
      ? [...new Set(filteredProducts.map((p) => p.space).filter(Boolean))].sort()
      : [];
    const lin = filters.categoria && filters.subcategoria
      ? [...new Set(filteredProducts.map((p) => p.line).filter(Boolean))].sort()
      : [];
    return { categorias: cat, subcategorias: sub, espacios: esp, lineas: lin };
  }, [products, filters, filteredProducts]);

  const productsForComponents = useMemo(() => {
    if (!filters.categoria || !filters.subcategoria) return [];
    const hasEspacios = (baseOptions.espacios || []).length > 0;
    const hasLineas = (baseOptions.lineas || []).length > 0;
    if (hasEspacios && !filters.espacio) return [];
    if (hasLineas && !filters.linea) return [];
    return filteredProducts;
  }, [filters, filteredProducts, baseOptions]);

  const filteredComponents = useMemo(() => {
    const map = {};
    productsForComponents.forEach((p) => {
      p.variants?.forEach((v) => {
        v.components?.forEach((c) => {
          if (c?.name) {
            if (!map[c.name]) map[c.name] = new Set();
            if (c.value != null && String(c.value).trim()) map[c.name].add(String(c.value).trim());
          }
        });
      });
    });
    return Object.fromEntries(
      Object.entries(map).map(([k, v]) => [k, [...v].sort()])
    );
  }, [productsForComponents]);

  const allComponentNames = useMemo(() => {
    const s = new Set();
    products.forEach((p) => {
      p.variants?.forEach((v) => {
        v.components?.forEach((c) => {
          if (c?.name) s.add(c.name);
        });
      });
    });
    return [...s].sort();
  }, [products]);

  const setFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (key === 'categoria') {
        next.categoria = value;
        next.subcategoria = null;
        next.espacio = null;
        next.linea = null;
      } else if (key === 'subcategoria') {
        next.subcategoria = value;
        next.espacio = null;
        next.linea = null;
      } else if (key === 'espacio') {
        next.espacio = value;
        next.linea = null;
      } else if (key === 'linea') {
        next.linea = value;
      }
      return next;
    });
  };

  const clearFilters = () => setFilters({ categoria: null, subcategoria: null, espacio: null, linea: null });

  const addToCart = (sapRef, value) => {
    const ref = (sapRef || '').trim();
    const v = (value || '').trim();
    if (!ref) return;
    setCart((prev) => {
      const without = prev.filter((c) => c.componentSapRef !== ref);
      return [...without, { componentSapRef: ref, componentValue: v || null }];
    });
    setNewCompName('');
    setNewCompValue('');
  };

  const removeFromCart = (sapRef) => {
    setCart((prev) => prev.filter((c) => c.componentSapRef !== sapRef));
  };

  const handleAddNewComponent = () => {
    if (!newCompName?.trim()) {
      setMessage('El nombre del componente es obligatorio');
      return;
    }
    addToCart(newCompName, newCompValue);
    setMessage('');
  };

  const handleAddToProject = () => {
    if (cart.length === 0 && !comentarios?.trim()) {
      setMessage('Agrega al menos un componente o un comentario');
      return;
    }
    setMessage('');
    const caracteristicas = cart.reduce((acc, c) => {
      acc[c.componentSapRef] = c.componentValue || '';
      return acc;
    }, {});
    const item = {
      id: `p3_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      code: `P3-${Date.now().toString().slice(-6)}`,
      name: 'P3 Custom',
      caracteristicas,
      comentarios: comentarios?.trim() || '',
      imageFile,
      quantity: 1,
      p3: true,
      tipologia: 'P3',
    };
    addCustomProduct(item);
    setFormOpen(false);
    setCart([]);
    setComentarios('');
    setImageFile(null);
    navigate('/comercial/proyecto');
  };

  const hasFilters = filters.categoria || filters.subcategoria || filters.espacio || filters.linea;
  const componentEntries = Object.entries(filteredComponents).filter(([, v]) => v?.length > 0);

  if (!formOpen) {
    return (
      <div className="p3-page">
        <p className="p3-desc">
          Filtra para ver componentes, márcalos para añadirlos al carrito. Limpia filtros, filtra otros,
          añade más. Con un comentario, añade la variante al proyecto (no al catálogo).
        </p>
        <button type="button" className="p3-toggle" onClick={() => setFormOpen(true)}>
          + Crear variante P3
        </button>
      </div>
    );
  }

  return (
    <div className="p3-page">
      <p className="p3-desc">
        Filtra, marca componentes y añádelos al carrito. Los filtros se mantienen; usa Limpiar cuando
        quieras buscar otros componentes. Comentario + añadir al proyecto.
      </p>

      <div className="p3-layout">
        <aside className="p3-filters">
          <div className="p3-filter-panel">
            <h3>Filtros</h3>
            <button type="button" className="p3-filter-clear" onClick={clearFilters}>
              Limpiar
            </button>
            {FILTER_ORDER.map((key) => {
              const parent = FILTER_PARENT[key];
              if (parent && !filters[parent]) return null;
              const opts = baseOptions[key === 'categoria' ? 'categorias' : key === 'subcategoria' ? 'subcategorias' : key === 'espacio' ? 'espacios' : 'lineas'] || [];
              if (opts.length === 0) return null;
              const label = { categoria: 'Categoría', subcategoria: 'Subcategoría', espacio: 'Espacio', linea: 'Línea' }[key];
              return (
                <div key={key} className="p3-filter-section">
                  <label>{label}</label>
                  <div className="p3-filter-chips">
                    {opts.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`p3-filter-chip ${filters[key] === opt ? 'active' : ''}`}
                        onClick={() => setFilter(key, filters[key] === opt ? null : opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="p3-main">
          <div className="p3-card">
            <div className="p3-card-header">
              <h2>Componentes (filtrados)</h2>
            </div>

            {!filters.categoria ? (
              <p className="p3-hint">Selecciona categoría en los filtros (izquierda) para filtrar.</p>
            ) : !filters.subcategoria ? (
              <p className="p3-hint">Selecciona subcategoría.</p>
            ) : !filters.espacio ? (
              <p className="p3-hint">Selecciona espacio.</p>
            ) : !filters.linea ? (
              <p className="p3-hint">Selecciona línea para ver componentes.</p>
            ) : componentEntries.length === 0 ? (
              <p className="p3-hint">No hay componentes en los productos filtrados. Crea uno nuevo abajo.</p>
            ) : (
              <div className="p3-components-grid">
                {componentEntries.map(([name, values]) => (
                  <div key={name} className="p3-component-group">
                    <span className="p3-comp-label">{name}</span>
                    <div className="p3-value-chips">
                      {values.map((val) => {
                        const inCart = cart.some((c) => c.componentSapRef === name && c.componentValue === val);
                        return (
                          <button
                            key={val}
                            type="button"
                            className={`p3-value-chip ${inCart ? 'selected' : ''}`}
                            onClick={() => addToCart(name, val)}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p3-section p3-new-comp">
              <strong>Añadir componente nuevo</strong>
              <div className="p3-new-comp-row">
                <AutocompleteInput
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  options={allComponentNames}
                  placeholder="Nombre"
                />
                <input
                  type="text"
                  value={newCompValue}
                  onChange={(e) => setNewCompValue(e.target.value)}
                  placeholder="Valor"
                  className="p3-new-value-input"
                />
                <button type="button" className="p3-add-comp-btn" onClick={handleAddNewComponent}>
                  + Añadir
                </button>
              </div>
            </div>
          </div>

          {message && <p className="p3-message">{message}</p>}
        </main>

        <aside className="p3-left">
          <div className="p3-cart-card">
            <h3>Componentes de la variante</h3>
            {cart.length === 0 ? (
              <p className="p3-hint">Marca componentes en el centro para añadirlos.</p>
            ) : (
              <div className="p3-cart-list">
                {cart.map((c) => (
                  <div key={c.componentSapRef} className="p3-cart-item">
                    <span>{c.componentSapRef}: {c.componentValue || '(vacío)'}</span>
                    <button type="button" className="p3-remove-cart" onClick={() => removeFromCart(c.componentSapRef)} title="Quitar">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="p3-section">
              <strong>Imagen</strong>
              <div className="p3-image-wrap">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="p3-image-input"
                />
                {imageFile && (
                  <span className="p3-image-name">{imageFile.name}</span>
                )}
              </div>
            </div>
            <div className="p3-section">
              <strong>Comentario</strong>
              <textarea
                className="p3-comentarios"
                placeholder="Especificaciones, notas..."
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                rows={3}
              />
            </div>
            <div className="p3-actions">
              <button type="button" className="p3-cancel" onClick={() => setFormOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="p3-add" onClick={handleAddToProject}>
                Añadir al proyecto
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
