import { useState } from 'react';
import { api, resolveImageUrl } from '../api/client';
import { CATEGORIES, CONDITIONS } from '../data/constants';

export default function PostItemModal({ onClose, onItemAdded }) {
  const [form, setForm] = useState({
    title: '',
    category: CATEGORIES[0],
    condition: CONDITIONS[0],
    location: '',
    description: '',
    image_url: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setForm((f) => ({ ...f, image_url: '' })); // file takes priority over pasted URL
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let finalImageUrl = form.image_url.trim();

      if (imageFile) {
        setUploading(true);
        const data = await api.uploadImage(imageFile);
        finalImageUrl = data.imageUrl;
        setUploading(false);
      }

      const newItem = await api.createItem({ ...form, image_url: finalImageUrl });
      onItemAdded(newItem);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Donate an item</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Title</span>
            <input value={form.title} onChange={(e) => update('title', e.target.value)} required />
          </label>

          <label className="field">
            <span className="field-label">Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              required
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field-label">Category</span>
              <select value={form.category} onChange={(e) => update('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Condition</span>
              <select value={form.condition} onChange={(e) => update('condition', e.target.value)}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <label className="field">
            <span className="field-label">Pickup location</span>
            <input value={form.location} onChange={(e) => update('location', e.target.value)} required />
          </label>

          <label className="field">
            <span className="field-label">Photo</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} />
          </label>

          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="image-preview" />
          )}

          {!imageFile && (
            <label className="field">
              <span className="field-label">...or paste an image URL instead</span>
              <input
                value={form.image_url}
                onChange={(e) => update('image_url', e.target.value)}
                placeholder="https://..."
              />
            </label>
          )}

          {error && <span className="field-error">{error}</span>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {uploading ? 'Uploading photo...' : submitting ? 'Posting...' : 'Post donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
