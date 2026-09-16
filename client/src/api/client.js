const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include', // sends/receives the auth cookie
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // some responses (e.g. a plain 405) have no JSON body — fine
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (name, email, password) =>
    request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () => request('/api/auth/logout', { method: 'POST' }),

  me: () => request('/api/auth/me'),

  getItems: () => request('/api/items'),

  createItem: (item) =>
    request('/api/items', { method: 'POST', body: JSON.stringify(item) }),

  createClaim: (itemId, contact, message) =>
    request('/api/claims', { method: 'POST', body: JSON.stringify({ itemId, contact, message }) }),

  getConversations: () => request('/api/conversations'),

  getMessages: (conversationId) => request(`/api/conversations/${conversationId}/messages`),

  sendMessage: (conversationId, content) =>
    request(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};
