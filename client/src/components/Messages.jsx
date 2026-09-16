import { useState, useEffect, useCallback, useRef } from 'react';
import { api, resolveImageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { markConversationSeen } from '../lib/unread';
import StatusStamp from './StatusStamp';

const MESSAGE_POLL_MS = 4000;
const LIST_POLL_MS = 10000;

export default function Messages({ initialConversationId, onClose, onConversationsChange }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(initialConversationId || null);
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
      onConversationsChange?.(data);
    } catch (err) {
      setError(err.message);
    }
  }, [onConversationsChange]);

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
    markConversationSeen(activeId);
    loadThread(activeId);
    const t = setInterval(() => {
      loadThread(activeId);
      markConversationSeen(activeId);
    }, MESSAGE_POLL_MS);
    return () => clearInterval(t);
  }, [activeId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages?.length]);

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

  const handleReopenFromChat = async (itemId) => {
    try {
      await api.reopenItem(itemId);
      loadThread(activeId);
      loadConversations();
    } catch (err) {
      setError(err.message);
    }
  };

  const otherPerson = (c) => (c.donor_id === user.id ? c.claimant_name : c.donor_name);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="messages-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Messages</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={`messages-body ${activeId ? 'messages-body-thread-active' : ''}`}>
          <div className="conversation-list">
            {conversations.length === 0 && (
              <p className="messages-empty-note">No conversations yet.</p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                className={`conversation-row ${activeId === c.id ? 'conversation-row-active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <span className="conversation-row-text">
                  <span className="conversation-row-title">{otherPerson(c)}</span>
                  <span className="conversation-row-item">{c.item_title}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="thread-pane">
            {!activeId ? (
              <div className="thread-placeholder"><p>Pick a conversation on the left.</p></div>
            ) : !thread ? (
              <div className="thread-placeholder"><p>Loading...</p></div>
            ) : (
              <>
                <div className="thread-pane-header">
                  <button className="icon-btn thread-back" onClick={() => setActiveId(null)} aria-label="Back">←</button>
                  <div style={{ flex: 1 }}>
                    <strong>{otherPerson(thread.conversation)}</strong>
                    <span className="thread-pane-subtitle"> · {thread.conversation.item_title}</span>
                  </div>
                </div>

                {/* Item Context Banner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 16px',
                  background: 'var(--bg)',
                  borderBottom: '1px solid var(--line)',
                  fontSize: '13px'
                }}>
                  <img
                    src={resolveImageUrl(thread.conversation.item_image_url) || `https://picsum.photos/seed/${thread.conversation.item_id}/80/80`}
                    alt=""
                    style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {thread.conversation.item_title}
                    </div>
                    <div style={{ color: 'var(--ink-soft)', fontSize: '12px' }}>
                      📍 {thread.conversation.item_location}
                    </div>
                  </div>
                  <StatusStamp status={thread.conversation.item_status || 'Claimed'} />

                  {user.id === thread.conversation.donor_id && thread.conversation.item_status !== 'Available' && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11.5px', padding: '4px 8px' }}
                      title="Make available if claimant cannot pick it up"
                      onClick={() => handleReopenFromChat(thread.conversation.item_id)}
                    >
                      Reopen
                    </button>
                  )}
                </div>

                <div className="thread-messages">
                  {thread.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`thread-bubble ${m.sender_id === user.id ? 'thread-bubble-mine' : 'thread-bubble-theirs'}`}
                    >
                      <p>{m.content}</p>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {error && <p className="field-error thread-error">{error}</p>}

                {/* Quick helper buttons */}
                <div style={{ padding: '4px 12px', display: 'flex', gap: '8px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--moss)', fontSize: '12px', cursor: 'pointer', padding: '4px 0' }}
                    onClick={() => setDraft(`Hi! Are you still able to pick this up at ${thread.conversation.item_location}? What time works best?`)}
                  >
                    📍 Ask pickup time
                  </button>
                </div>

                <form className="thread-composer" onSubmit={handleSend}>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message..."
                  />
                  <button type="submit" className="btn btn-primary btn-sm">Send</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}