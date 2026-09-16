import StatusStamp from './StatusStamp';
import CategoryTag from './CategoryTag';
import { resolveImageUrl } from '../api/client';

export default function ItemCard({ item, isOwn, onRequest, onReopen, onDelete }) {
  const isAvailable = item.status === 'Available';
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

        {isOwn ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            {!isAvailable && (
              <button
                className="btn btn-ghost btn-sm"
                title="Make available if claimant flaked"
                onClick={() => onReopen(item.id)}
              >
                Reopen
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: '#c0392b', borderColor: '#e74c3c44' }}
              onClick={() => onDelete(item.id)}
              title="Delete this listing"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            disabled={!isAvailable}
            onClick={() => onRequest(item)}
          >
            {isAvailable ? 'Request item' : 'Already claimed'}
          </button>
        )}
      </div>
    </article>
  );
}