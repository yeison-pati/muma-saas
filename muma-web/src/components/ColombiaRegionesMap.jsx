import { useState } from 'react';
import './ColombiaRegionesMap.css';

export const COLOMBIA_REGIONS = [
  { id: 'Antioquia', label: 'Antioquia' },
  { id: 'Occidente Ampliado', label: 'Occidente Ampliado' },
  { id: 'Costa', label: 'Costa' },
  { id: 'Servicios', label: 'Servicios' },
  { id: 'Internacional', label: 'Internacional' },
];

export default function ColombiaRegionesMap({ value, onChange, singleSelect = true }) {
  const selected = value ?? null;

  const handleClick = (id) => {
    const next = singleSelect ? (selected === id ? null : id) : id;
    onChange?.(next || '');
  };

  return (
    <div className="zone-selector-container">
      <div className="zone-pills">
        {COLOMBIA_REGIONS.map((r) => {
          const isSelected = selected === r.id;
          return (
            <button
              key={r.id}
              type="button"
              className={`zone-pill ${isSelected ? 'selected' : ''}`}
              onClick={() => handleClick(r.id)}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
