// api.js — talks to the PHP backend (api/data.php, api/passwords.php, etc.).

async function apiFetch(url, options) {
  const res = await fetch(url, options);
  let body = null;
  try { body = await res.json(); } catch (e) { body = null; }
  if (res.status === 401 && body && body.error === 'Authentication required' && typeof onSessionExpired === 'function') {
    onSessionExpired();
  }
  return { res, body };
}

async function apiGetEntries() {
  const { res, body } = await apiFetch('api/data.php', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load entries');
  return body;
}

async function apiSaveEntries(entriesArr) {
  const { res, body } = await apiFetch('api/data.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entriesArr)
  });
  if (!res.ok) throw new Error('Failed to save entries');
  return body;
}

async function apiLogin(role, password) {
  const { body } = await apiFetch('api/login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, password })
  });
  return body;
}

async function apiLogout() {
  const { body } = await apiFetch('api/logout.php', { method: 'POST' });
  return body;
}

async function apiGetSession() {
  const { body } = await apiFetch('api/session.php', { cache: 'no-store' });
  return body;
}

async function apiTouch() {
  const { body } = await apiFetch('api/touch.php', { method: 'POST' });
  return body;
}

async function apiVerifyDeletePassword(password) {
  const { body } = await apiFetch('api/verify-delete.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  return body;
}

async function apiChangePassword(which, currentPassword, newPassword) {
  const { body } = await apiFetch('api/passwords.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ which, currentPassword, newPassword })
  });
  return body;
}
