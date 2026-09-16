import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from './api/client';
import { useAuth } from './context/AuthContext';
import { CATEGORIES, CATEGORY_COLORS } from './data/constants';
import { countUnread } from './lib/unread';
import AuthModal from './components/AuthModal';
import PostItemModal from './components/PostItemModal';
import ClaimModal from './components/ClaimModal';
import Messages from './components/Messages';
import ItemCard from './components/ItemCard';
import './App.css';

function App() {
  const { user, checking, logout } = useAuth();

  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const [authOpen, setAuthOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [claimItem, setClaimItem] = useState(null);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messagesInitialId, setMessagesInitialId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchItems = useCallback(() => {
    setLoadingItems(true);
    setLoadError('');
    api.getItems()
      .then(setItems)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoadingItems(false));
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Keep the unread badge current even while the Messages panel is closed
  useEffect(() => {
    if (!user) return;
    const check = () => {
      api.getConversations()
        .then((convos) => setUnreadCount(countUnread(convos, user.id)))
        .catch(() => {});
    };
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, [user]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (onlyAvailable && it.status !== 'Available') return false;
      if (onlyMine && it.donor_id !== user?.id) return false;
      const matchesCategory = activeCategory === 'All' || it.category === activeCategory;
      const matchesQuery =
        !q ||
        it.title.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.location.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [items, query, activeCategory, onlyAvailable, onlyMine, user]);

  const counts = useMemo(() => {
    const c = { All: items.length };
    CATEGORIES.forEach((cat) => { c[cat] = items.filter((i) => i.category === cat).length; });
    return c;
  }, [items]);

  function openPostModal() {
    if (!user) return setAuthOpen(true);
    setPostOpen(true);
  }

  function openClaimModal(item) {
    if (!user) return setAuthOpen(true);
    setClaimItem(item);
  }

  function handleItemAdded(newItem) {
    setItems((prev) => [newItem, ...prev]);
    setPostOpen(false);
  }

  function handleClaimed(itemId, conversationId) {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, status: 'Claimed' } : it)));
    setClaimItem(null);
    setMessagesInitialId(conversationId);
    setMessagesOpen(true);
  }

  function openMessages() {
    setMessagesInitialId(null);
    setMessagesOpen(true);
  }

  async function handleDeleteItem(itemId) {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.deleteItem(itemId);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch (err) {
      alert(err.message || 'Failed to delete item.');
    }
  }

  async function handleReopenItem(itemId) {
    try {
      await api.reopenItem(itemId);
      setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, status: 'Available' } : it)));
    } catch (err) {
      alert(err.message || 'Failed to reopen item.');
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">♻️</span>
          <div>
            <h1>Freecycle</h1>
            <p className="brand-tagline">A community board for things that still have use in them</p>
          </div>
        </div>

        <div className="header-actions">
          {!checking && user && (
            <>
              <button className="btn btn-ghost btn-with-badge" onClick={openMessages}>
                💬 Messages
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>
              <span className="user-chip">
                Signed in as <strong>{user.name}</strong>
                <button className="icon-btn" onClick={logout} aria-label="Sign out" title="Sign out">↪</button>
              </span>
            </>
          )}
          {!checking && !user && (
            <button className="btn btn-ghost" onClick={() => setAuthOpen(true)}>Sign in</button>
          )}
          <button className="btn btn-primary" onClick={openPostModal}>+ Donate an item</button>
        </div>
      </header>

      {/* Toolbar with Search and Filters */}
      <div className="toolbar" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="search-field" style={{ flex: 1, minWidth: '220px' }}>
          🔍
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by item or location"
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          Available only
        </label>
        {user && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />
            My donations
          </label>
        )}
      </div>

      <div className="layout">
        <aside className="sidebar">
          <h2 className="sidebar-heading">Browse by category</h2>
          <nav className="category-list">
            <button
              className={`category-item ${activeCategory === 'All' ? 'category-item-active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              <span>All items</span>
              <span className="category-count">{counts.All}</span>
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-item ${activeCategory === cat ? 'category-item-active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span className="category-item-dot" style={{ '--tag-color': CATEGORY_COLORS[cat] }} />
                <span>{cat}</span>
                <span className="category-count">{counts[cat] || 0}</span>
              </button>
            ))}
          </nav>
          <button className="reset-link" onClick={fetchItems}>↻ Refresh listings</button>
        </aside>

        <main className="feed">
          {loadingItems ? (
            <div className="empty-state"><p>Loading listings...</p></div>
          ) : loadError ? (
            <div className="empty-state"><h3>Couldn't load the board</h3><p>{loadError}</p></div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state"><h3>No matches</h3><p>Try a different category or search.</p></div>
          ) : (
            <div className="item-grid">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isOwn={user?.id === item.donor_id}
                  onRequest={openClaimModal}
                  onReopen={handleReopenItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {postOpen && <PostItemModal onClose={() => setPostOpen(false)} onItemAdded={handleItemAdded} />}
      {claimItem && <ClaimModal item={claimItem} onClose={() => setClaimItem(null)} onClaimed={handleClaimed} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {messagesOpen && (
        <Messages
          initialConversationId={messagesInitialId}
          onClose={() => setMessagesOpen(false)}
          onConversationsChange={(convos) => setUnreadCount(countUnread(convos, user?.id))}
        />
      )}
    </div>
  );
}

export default App;