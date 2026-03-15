import './AssignConfirmModal.css';

export default function AssignConfirmModal({ visible, roleLabel, assigneeName, count, onConfirm, onCancel }) {
  if (!visible) return null;
  const countText = count != null ? `Tiene ${count} proyecto${count !== 1 ? 's' : ''} asignado${count !== 1 ? 's' : ''}` : '';
  return (
    <div className="assign-confirm-overlay" onClick={onCancel}>
      <div className="assign-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Confirmar asignación</h3>
        <p>
          ¿Asignar a <strong>{assigneeName || '—'}</strong>?
        </p>
        {countText && <p className="assign-confirm-count">{countText}</p>}
        <p className="assign-confirm-hint">Una vez asignado no se podrá cambiar.</p>
        <div className="assign-confirm-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn-confirm" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
