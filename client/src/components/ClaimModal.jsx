import { useState } from 'react';
import { api } from '../api/client';

export default function ClaimModal({ item, onClose, onClaimed }) {
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState(
    `Hi ${item.donor_name}, I'd love to take the "${item.title}" off your hands. When works for pickup?`
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api.createClaim(item.id, contact, message);
      onClaimed(item.id, data.conversationId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request "{item.title}"</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <p className="claim-intro">
            This sends a message to {item.donor_name}, who posted this from {item.location}.
          </p>
          <label className="field">
            <span className="field-label">Your contact info</span>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email or phone number"
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Message to donor</span>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} required />
          </label>

          {error && <span className="field-error">{error}</span>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
