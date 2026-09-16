import StatusStamp from './StatusStamp';
import CategoryTag from './CategoryTag';
import { resolveImageUrl } from '../api/client';

export default function ItemDetailModal({ item, isOwn, onClose, onRequest, onReopen, onDelete }) {
  if (!item) return null;

  const isAvailable = item.status === 'Available';
  const imageSrc = resolveImageUrl(item.image_url) || `https://picsum.photos/seed/${item.id}/800/600`;
  const formattedDate = item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) : null;

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{item.title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body" style={{ gap: '16px' }}>
          <div style={{ position: 'relative', width: '100%', height: '320px', borderRadius: '10px', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
            <img
              src={imageSrc}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
              <StatusStamp status={item.status} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <CategoryTag category={item.category} />
            <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
              Condition: <strong>{item.condition}</strong>
            </span>
          </div>

          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--ink-soft)' }}>Description</h4>
            <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {item.description}
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: '8px', fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              📍 Pickup Location:{' '}
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--moss)', fontWeight: '600', textDecoration: 'underline' }}
                title="Open in Google Maps"
              >
                {item.location} ↗
              </a>
            </div>
            <div style={{ color: 'var(--ink-soft)', fontSize: '12.5px' }}>
              Posted by <strong>{item.donor_name || 'Community Member'}</strong>
              {formattedDate && ` on ${formattedDate}`}
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            {isOwn ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                {!isAvailable && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => { onReopen(item.id); onClose(); }}
                  >
                    Make available again
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ color: '#c0392b', borderColor: '#e74c3c44' }}
                  onClick={() => { onDelete(item.id); onClose(); }}
                >
                  Delete listing
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!isAvailable}
                onClick={() => { onClose(); onRequest(item); }}
              >
                {isAvailable ? 'Request item' : 'Already claimed'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}