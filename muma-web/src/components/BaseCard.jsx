import ImageWithModal from './ImageWithModal';
import './BaseCard.css';

export default function BaseCard({ product, onClick }) {
  const coverUrl =
    product?.variants?.[0]?.fullUrl || product?.fullUrl || null;

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
        {coverUrl ? (
          <ImageWithModal src={coverUrl} alt={product.name}>
            <img src={coverUrl} alt={product.name} />
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
