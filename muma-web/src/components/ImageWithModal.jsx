import { useState } from 'react';
import ImageModal from './ImageModal';

/**
 * Imagen que al hacer click abre modal con la imagen grande.
 * NO usar para imágenes de productos en proyectos (ProjectProductsTable).
 */
export default function ImageWithModal({ src, alt = '', className, children }) {
  const [modalOpen, setModalOpen] = useState(false);
  if (!src) return children || null;
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={`image-with-modal-trigger ${className || ''}`}
        onClick={() => setModalOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
        style={{ cursor: 'pointer', display: 'inline-block' }}
      >
        {children || <img src={src} alt={alt} />}
      </div>
      <ImageModal
        src={src}
        alt={alt}
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
