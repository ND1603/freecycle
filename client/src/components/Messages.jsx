import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const MESSAGE_POLL_MS = 4000;
const LIST_POLL_MS = 10000;

export default function Messages({ initialConversationId, onClose }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(initialConversationId || null);
  const [thread, setThread] = useState(null); // { conversation, messages }
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadThread = useCallback(async (id) => {
    try {
      const data = await api.getMessages(id);
      setThread(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, LIST_POLL_MS);
    return () => clearInterval(t);
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) {
      setThread(null);
      return;
    }
    loadThread(activeId);
    const t = setInterval(() => loadThread(activeId), MESSAGE_POLL_MS);
    return () => clearInterval(t);
  }, [activeId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [thread]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      await api.sendMessage(activeId, draft.trim());
      setDraft('');
      loadThread(activeId);
      loadConversations();
    } catch (err) {
      setError(err.message);
    }
  };

  const otherPerson = (c) => (c.donor_id === user.id ? c.claimant_name : c.donor_name);

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', marginBottom: '30px', display: 'flex', maxHeight: '420px' }}>
      <div style={{ width: '220px', borderRight: '1px solid #eee', overflowY: 'auto', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <strong>Messages</strong>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        {conversations.length === 0 && (
          <p style={{ fontSize: '13px', color: '#888' }}>No conversations yet.</p>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveId(c.id)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: activeId === c.id ? '#eef6ee' : 'transparent',
              marginBottom: '4px',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px' }}>{otherPerson(c)}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>{c.item_title}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!activeId ? (
          <p style={{ padding: '16px', color: '#888' }}>Pick a conversation on the left.</p>
        ) : !thread ? (
          <p style={{ padding: '16px', color: '#888' }}>Loading...</p>
        ) : (
          <>
            <div style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '13px' }}>
              <strong>{otherPerson(thread.conversation)}</strong> · {thread.conversation.item_title}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {thread.messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.sender_id === user.id ? 'flex-end' : 'flex-start',
                    background: m.sender_id === user.id ? '#3f6b4a' : '#f0f0f0',
                    color: m.sender_id === user.id ? '#fff' : '#000',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    maxWidth: '75%',
                    fontSize: '13px',
                  }}
                >
                  {m.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            {error && <p style={{ color: 'red', padding: '0 10px' }}>{error}</p>}
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '6px', padding: '10px', borderTop: '1px solid #eee' }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message..."
                style={{ flex: 1 }}
              />
              <button type="submit">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
