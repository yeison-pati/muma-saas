import './ImageModal.css';

/**
 * Modal para mostrar imagen en grande al hacer click.
 * Usar en BaseCard, CartItem, etc. NO en imágenes de productos en proyectos.
 */
export default function ImageModal({ src, alt = '', visible, onClose }) {
  if (!visible) return null;
  return (
    <div
      className="image-modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose?.()}
      role="button"
      tabIndex={0}
      aria-label="Cerrar"
    >
      <div
        className="image-modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <button type="button" className="image-modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <img src={src} alt={alt} className="image-modal-img" />
      </div>
    </div>
  );
}
