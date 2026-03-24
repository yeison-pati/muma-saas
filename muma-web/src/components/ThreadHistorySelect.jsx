import { useState, useId } from 'react';
import './ThreadHistorySelect.css';

function formatClosedAt(iso) {
  if (!iso) return 'Sin fecha';
  try {
    return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
}

/**
 * Selector compacto para hilos cerrados (evita filas de botones y scroll horizontal).
 */
export default function ThreadHistorySelect({ threads, onSelect, className = '' }) {
  const [value, setValue] = useState('');
  const selectId = useId();

  const handleChange = (e) => {
    const id = e.target.value;
    setValue('');
    if (!id) return;
    const thread = threads.find((t) => String(t.id) === String(id));
    if (thread) onSelect(thread);
  };

  if (!threads?.length) return null;

  return (
    <div className={`thread-history-select-root ${className}`.trim()}>
      <label className="thread-history-select-label" htmlFor={selectId}>
        Historial
      </label>
      <select
        id={selectId}
        className="thread-history-select"
        value={value}
        onChange={handleChange}
        aria-label={`Historial de chats cerrados (${threads.length})`}
      >
        <option value="">Chats anteriores ({threads.length})</option>
        {threads.map((t) => (
          <option key={t.id} value={t.id}>
            {formatClosedAt(t.closedAt)}
          </option>
        ))}
      </select>
    </div>
  );
}
