import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthForm() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
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
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '30px', maxWidth: '340px' }}>
      <h3>{mode === 'signup' ? '👤 Create an account' : '👋 Sign in'}</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'grid', gap: '10px' }}>
        {mode === 'signup' && (
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
        <button
          type="button"
          onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
        >
          {mode === 'signup' ? 'Have an account? Sign in' : 'New here? Create account'}
        </button>
      </div>
    </form>
  );
}
