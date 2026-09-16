import { useState } from 'react';
import { api } from '../api/client';

export default function AddItemForm({ onItemAdded }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Furniture',
    condition: 'Good',
    location: '',
    description: '',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // No donor_id here — the server reads it from the signed-in
      // session, so there's nothing a client could spoof.
      const newItem = await api.createItem(formData);
      onItemAdded(newItem); // Update parent state instantly

      // Reset form
      setFormData({
        title: '',
        category: 'Furniture',
        condition: 'Good',
        location: '',
        description: '',
        image_url: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
      <h3>➕ Post an Item to Donate</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'grid', gap: '10px' }}>
        <input name="title" placeholder="Title (e.g. Wooden Desk)" value={formData.title} onChange={handleChange} required />

        <select name="category" value={formData.category} onChange={handleChange}>
          <option value="Furniture">Furniture</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
          <option value="Books">Books</option>
          <option value="Other">Other</option>
        </select>

        <select name="condition" value={formData.condition} onChange={handleChange}>
          <option value="Like New">Like New</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
        </select>

        <input name="location" placeholder="Location (e.g. Downtown)" value={formData.location} onChange={handleChange} required />

        <textarea name="description" placeholder="Description of item..." value={formData.description} onChange={handleChange} required />

        <input name="image_url" placeholder="Image URL (optional)" value={formData.image_url} onChange={handleChange} />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post Donation'}
        </button>
      </div>
    </form>
  );
}
