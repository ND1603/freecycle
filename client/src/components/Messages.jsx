import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { markConversationSeen } from '../lib/unread';

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
                  <div>
                    <strong>{otherPerson(thread.conversation)}</strong>
                    <span className="thread-pane-subtitle"> · {thread.conversation.item_title}</span>
                  </div>
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
                <form className="thread-composer" onSubmit={handleSend}>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message..." />
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
