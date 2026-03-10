import { useState, useRef, useEffect } from 'react';
import './AutocompleteInput.css';

/**
 * Input con autocompletado: muestra opciones que coinciden con lo escrito.
 * Si no hay coincidencias, permite dejar el texto libre.
 */
const EMPTY_OPTIONS = [];

export default function AutocompleteInput({
  value,
  onChange,
  options = EMPTY_OPTIONS,
  placeholder = '',
  name,
  id,
  className = '',
}) {
  const [internalValue, setInternalValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);

  const inputValue = value !== undefined && value !== null ? value : internalValue;

  const filtered = inputValue.trim()
    ? options.filter((opt) =>
        String(opt).toLowerCase().includes(inputValue.trim().toLowerCase())
      )
    : options;

  const handleInputChange = (e) => {
    const v = e.target.value;
    if (value === undefined || value === null) setInternalValue(v);
    onChange?.({ target: { name, value: v } });
    setIsOpen(true);
    setHighlightIndex(-1);
  };

  const handleSelect = (opt) => {
    if (value === undefined || value === null) setInternalValue(opt);
    onChange?.({ target: { name, value: opt } });
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Backspace') setIsOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0 && filtered[highlightIndex]) {
      e.preventDefault();
      handleSelect(filtered[highlightIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  };

  useEffect(() => {
    const fn = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', fn);
    return () => document.removeEventListener('click', fn);
  }, []);

  return (
    <div ref={containerRef} className={`autocomplete-input ${className}`}>
      <input
        type="text"
        name={name}
        id={id}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isOpen && (
        <ul className="autocomplete-list" role="listbox">
          {filtered.length === 0 ? (
            <li className="autocomplete-item autocomplete-empty">
              Sin coincidencias — se usará lo escrito
            </li>
          ) : (
            filtered.map((opt, i) => (
              <li
                key={opt}
                role="option"
                aria-selected={i === highlightIndex}
                className={`autocomplete-item ${i === highlightIndex ? 'autocomplete-highlight' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt);
                }}
              >
                {opt}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
