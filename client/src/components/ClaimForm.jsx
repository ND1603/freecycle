import { useState } from 'react';
import { api } from '../api/client';

export default function ClaimForm({ item, onClose, onClaimed }) {
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
    <form onSubmit={handleSubmit} style={{ marginTop: '10px', padding: '12px', background: '#f7f7f7', borderRadius: '6px' }}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'grid', gap: '8px' }}>
        <input
          placeholder="Your email or phone number"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send request'}
          </button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </form>
  );
}
