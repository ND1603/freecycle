import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ onClose }) {
  const { user, updateUser } = useAuth();

  const [stats, setStats] = useState({ donationsCount: 0, claimsCount: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Name edit state
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    api.getUserStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');
    if (!name.trim()) return;

    setSavingName(true);
    try {
      const data = await api.updateProfile(name.trim());
      updateUser(data.user);
      setNameSuccess('Display name updated!');
      setTimeout(() => setNameSuccess(''), 3000);
    } catch (err) {
      setNameError(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (!currentPassword || !newPassword) return;

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>My Profile</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body" style={{ gap: '20px' }}>
          {/* User info & Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: '600' }}>{user?.name}</span>
            <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{user?.email}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--moss)' }}>
                {loadingStats ? '...' : stats.donationsCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Items Donated</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--moss)' }}>
                {loadingStats ? '...' : stats.claimsCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Items Requested</div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0' }} />

          {/* Edit Name */}
          <form onSubmit={handleUpdateName} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '14px' }}>Display Name</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13.5px' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={savingName || name === user?.name}>
                {savingName ? 'Saving...' : 'Save'}
              </button>
            </div>
            {nameSuccess && <span style={{ color: 'var(--moss)', fontSize: '12.5px' }}>✓ {nameSuccess}</span>}
            {nameError && <span className="field-error">{nameError}</span>}
          </form>

          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0' }} />

          {/* Change Password */}
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '14px' }}>Change Password</h4>
            <label className="field" style={{ gap: '4px' }}>
              <span className="field-label" style={{ fontSize: '12.5px' }}>Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </label>
            <label className="field" style={{ gap: '4px' }}>
              <span className="field-label" style={{ fontSize: '12.5px' }}>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="At least 6 characters"
              />
            </label>
            <button
              type="submit"
              className="btn btn-ghost btn-sm"
              disabled={savingPassword || !currentPassword || !newPassword}
              style={{ alignSelf: 'flex-start', marginTop: '4px' }}
            >
              {savingPassword ? 'Updating...' : 'Update password'}
            </button>
            {passwordSuccess && <span style={{ color: 'var(--moss)', fontSize: '12.5px' }}>✓ {passwordSuccess}</span>}
            {passwordError && <span className="field-error">{passwordError}</span>}
          </form>

          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}