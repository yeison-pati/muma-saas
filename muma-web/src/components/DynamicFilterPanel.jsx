import { useFilters } from '../context/FiltersContext';
import './DynamicFilterPanel.css';

const FILTER_ORDER = ['categoria', 'subcategoria', 'espacio', 'linea'];
const FILTER_PARENT = { subcategoria: 'categoria', espacio: 'subcategoria', linea: 'espacio' };

export default function DynamicFilterPanel() {
  const {
    baseOptions,
    dynamicOptions,
    selectedFilters,
    setFilter,
    setComponentFilter,
    clearFilters,
  } = useFilters();

  const keyToLabel = {
    categoria: 'Categoría',
    subcategoria: 'Subcategoría',
    espacio: 'Espacio',
    linea: 'Línea',
  };

  const keyToOptions = {
    categoria: baseOptions.categorias,
    subcategoria: baseOptions.subcategorias,
    espacio: baseOptions.espacios,
    linea: baseOptions.lineas,
  };

  const isSectionVisible = (key) => {
    const parent = FILTER_PARENT[key];
    if (!parent) return true;
    return !!selectedFilters[parent];
  };

  const showComponents = !!selectedFilters.linea;

  return (
    <div className="filter-panel">
      <h3 className="filter-title">Filtros</h3>
      <button type="button" className="filter-clear" onClick={clearFilters}>
        Limpiar
      </button>

      {FILTER_ORDER.map((key) => {
        if (!isSectionVisible(key)) return null;
        const options = keyToOptions[key] || [];
        if (options.length === 0) return null;
        const value = selectedFilters[key];
        return (
          <div key={key} className="filter-section">
            <label>{keyToLabel[key]}</label>
            <div className="filter-chips">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`filter-chip ${value === opt ? 'active' : ''}`}
                  onClick={() => setFilter(key, value === opt ? null : opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {showComponents && Object.keys(dynamicOptions || {}).length > 0 && (
        <div className="filter-section filter-section-components">
          <span className="filter-components-label" role="heading" aria-level={3}>Componentes</span>
          {Object.entries(dynamicOptions).map(([name, values]) => {
            if (!values?.length) return null;
            return (
              <div key={name} className="filter-subsection">
                <span className="filter-subsection-label">{name}</span>
                <div className="filter-chips">
                  {values.map((v) => {
                    const current = selectedFilters.componentes?.[name];
                    const isActive = current === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        className={`filter-chip ${isActive ? 'active' : ''}`}
                        onClick={() =>
                          setComponentFilter(name, isActive ? null : v)
                        }
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
