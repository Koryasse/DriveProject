const BASE_URL = "http://10.5.40.250:8000";

function getToken() {
  return localStorage.getItem("token");
}

export function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function isLoggedIn() {
  return !!getToken();
}

// Requête authentifiée générique
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res;
}

export const api = {
  login: (email, password) =>
    fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    }),

  register: (email, username, password) =>
    fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password })
    }),

  getFiles: () => apiFetch("/api/files"),

  upload: (formData) =>
    apiFetch("/api/upload", { method: "POST", body: formData }),

  delete: (filename) =>
    apiFetch(`/api/files/${filename}`, { method: "DELETE" }),

  rename: (oldName, newName) =>
    apiFetch(`/api/files/rename?old_name=${oldName}&new_name=${newName}`, { method: "PUT" }),

  download: (filename) => {
    const token = getToken();
    window.open(`${BASE_URL}/api/files/download/${filename}?token=${token}`, "_blank");
  },

  getStorage: () => apiFetch("/api/storage"),
};