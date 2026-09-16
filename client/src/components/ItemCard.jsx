import StatusStamp from './StatusStamp';
import CategoryTag from './CategoryTag';
import { resolveImageUrl } from '../api/client';

export default function ItemCard({ item, isOwn, onRequest }) {
  const disabled = item.status !== 'Available' || isOwn;

  let buttonLabel = 'Request item';
  if (isOwn) buttonLabel = 'Your donation';
  else if (item.status !== 'Available') buttonLabel = 'Already claimed';

  const imageSrc = resolveImageUrl(item.image_url) || `https://picsum.photos/seed/${item.id}/500/375`;

  return (
    <article className="item-card">
      <div className="item-card-media">
        <img src={imageSrc} alt={item.title} loading="lazy" />
        <div className="item-card-stamp-wrap">
          <StatusStamp status={item.status} />
        </div>
      </div>
      <div className="item-card-body">
        <CategoryTag category={item.category} />
        <h3 className="item-card-title">{item.title}</h3>
        <p className="item-card-desc">{item.description}</p>
      </div>
      <div className="item-card-footer">
        <div className="item-card-meta">
          <span className="meta-row">📍 {item.location}</span>
          <span className="meta-row meta-condition">{item.condition}</span>
        </div>
        <button
          className="btn btn-primary btn-sm"
          disabled={disabled}
          onClick={() => onRequest(item)}
        >
          {buttonLabel}
        </button>
      </div>
    </article>
  );
}
