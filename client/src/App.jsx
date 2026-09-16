import { useState, useEffect } from 'react';
import { api } from './api/client';
import { useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import AddItemForm from './components/AddItemForm';
import ClaimForm from './components/ClaimForm';
import Messages from './components/Messages';
import './App.css';

function App() {
  const { user, checking, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messagesInitialId, setMessagesInitialId] = useState(null);

  useEffect(() => {
    api.getItems()
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleItemAdded = (newItem) => {
    setItems((prevItems) => [newItem, ...prevItems]);
  };

  const handleClaimed = (itemId, conversationId) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, status: 'Claimed' } : it)));
    setClaimingId(null);
    setMessagesInitialId(conversationId);
    setMessagesOpen(true);
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>♻️ Freecycle - Community Recycling</h1>
        {!checking && user && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px' }}>
            <button onClick={() => { setMessagesInitialId(null); setMessagesOpen(true); }}>
              💬 Messages
            </button>
            <span>Signed in as <strong>{user.name}</strong></span>
            <button onClick={logout}>Sign out</button>
          </div>
        )}
      </div>

      {!checking && !user && <AuthForm />}

      {!checking && user && <AddItemForm onItemAdded={handleItemAdded} />}

      {messagesOpen && (
        <Messages
          initialConversationId={messagesInitialId}
          onClose={() => setMessagesOpen(false)}
        />
      )}

      <hr style={{ margin: '20px 0' }} />

      <h2>Available Donations</h2>

      {loading && <p>Loading items...</p>}

      <div style={{ display: 'grid', gap: '15px' }}>
        {items.map((item) => {
          const isOwn = user?.id === item.donor_id;
          const isClaimable = item.status === 'Available' && !isOwn;
          return (
            <div key={item.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h3>{item.title} {item.status === 'Claimed' && <span style={{ fontSize: '12px', color: '#999' }}>(Claimed)</span>}</h3>
              <p>{item.description}</p>
              <small>📍 {item.location} | 🏷️ {item.category} | Condition: {item.condition} | Posted by {item.donor_name}</small>

              {user && isClaimable && claimingId !== item.id && (
                <div style={{ marginTop: '10px' }}>
                  <button onClick={() => setClaimingId(item.id)}>Request this item</button>
                </div>
              )}
              {isOwn && <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>This is your donation</p>}
              {!user && item.status === 'Available' && (
                <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>Sign in to request this item</p>
              )}

              {claimingId === item.id && (
                <ClaimForm
                  item={item}
                  onClose={() => setClaimingId(null)}
                  onClaimed={handleClaimed}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
