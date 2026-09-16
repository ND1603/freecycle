import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      onClose();
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
          <h2>{mode === 'signup' ? 'Create an account' : 'Sign in'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label className="field">
              <span className="field-label">Your name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          )}
          <label className="field">
            <span className="field-label">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>

          {error && <span className="field-error">{error}</span>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}
            >
              {mode === 'signup' ? 'Have an account? Sign in' : 'New here? Create account'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
