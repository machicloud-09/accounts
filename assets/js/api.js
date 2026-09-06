// api.js — talks to the PHP backend (api/data.php, api/passwords.php).

async function apiGetEntries() {
  const res = await fetch('api/data.php', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load entries');
  return res.json();
}

async function apiSaveEntries(entriesArr) {
  const res = await fetch('api/data.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entriesArr)
  });
  if (!res.ok) throw new Error('Failed to save entries');
  return res.json();
}

async function apiLogin(role, password) {
  const res = await fetch('api/login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, password })
  });
  return res.json();
}

async function apiLogout() {
  const res = await fetch('api/logout.php', { method: 'POST' });
  return res.json();
}

async function apiGetSession() {
  const res = await fetch('api/session.php', { cache: 'no-store' });
  return res.json();
}

async function apiVerifyDeletePassword(password) {
  const res = await fetch('api/verify-delete.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  return res.json();
}

async function apiChangePassword(which, currentPassword, newPassword) {
  const res = await fetch('api/passwords.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ which, currentPassword, newPassword })
  });
  return res.json();
}
