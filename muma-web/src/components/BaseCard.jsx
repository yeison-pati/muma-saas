import ImageWithModal from './ImageWithModal';
import './BaseCard.css';

export default function BaseCard({ product, onClick }) {
  return (
    <button
      type="button"
      className="base-card"
      onClick={onClick}
    >
      <div
        className="base-card-image"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="button"
        tabIndex={0}
      >
        {product.fullUrl ? (
          <ImageWithModal src={product.fullUrl} alt={product.name}>
            <img src={product.fullUrl} alt={product.name} />
          </ImageWithModal>
        ) : (
          <div className="base-card-placeholder">Sin imagen</div>
        )}
      </div>
      <div className="base-card-info">
        <span className="base-card-name">{product.name}</span>
        {product.baseMaterial && (
          <span className="base-card-tag">{product.baseMaterial}</span>
        )}
        {(product.line || product.space) && (
          <span className="base-card-detail">
            {[product.line, product.space].filter(Boolean).join(' • ')}
          </span>
        )}
      </div>
    </button>
  );
}
