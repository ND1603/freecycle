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

// Images uploaded to our own server come back as a relative path like
// "/uploads/abc123.jpg" — this turns that into a full URL the browser
// can actually load. External URLs (picsum, imgur, etc.) pass through
// unchanged since they already start with http.
export function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url}`;
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

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData, // no Content-Type header — browser sets the multipart boundary itself
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Upload failed.');
    return data;
  },

    deleteItem: (id) => request(`/api/items/${id}`, { method: 'DELETE' }),

  reopenItem: (id) => request(`/api/items/${id}/reopen`, { method: 'PATCH' }),

};
