import BaseCard from './BaseCard';
import './BaseList.css';

const EMPTY_ITEMS = [];

export default function BaseList({ title, items = EMPTY_ITEMS, onProductClick }) {
  const data = items || [];

  if (data.length === 0) return null;

  return (
    <section className="base-list">
      <h2 className="base-list-title">{title}</h2>
      <div className="base-list-grid">
        {data.map((item) => (
          <BaseCard
            key={item.id}
            product={item}
            onClick={() => onProductClick?.(item)}
          />
        ))}
      </div>
    </section>
  );
}
