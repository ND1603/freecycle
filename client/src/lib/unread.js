const STORAGE_KEY = 'freecycle_last_seen';

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable (private browsing, etc.) — fine, badge
    // just won't persist across reloads in that case.
  }
}

export function markConversationSeen(conversationId) {
  const store = readStore();
  store[conversationId] = new Date().toISOString();
  writeStore(store);
}

// Counts conversations with a message newer than the last time the user
// opened them — skipping ones where the user sent that last message
// themselves, since there's nothing new for them to see.
export function countUnread(conversations, userId) {
  const store = readStore();
  return conversations.filter((c) => {
    if (!c.last_message_at) return false;
    if (c.last_message_sender_id === userId) return false;
    const lastSeen = store[c.id];
    if (!lastSeen) return true; // never opened, and there's a message waiting
    return new Date(c.last_message_at) > new Date(lastSeen);
  }).length;
}
