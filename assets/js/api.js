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

async function apiGetPasswords() {
  const res = await fetch('api/passwords.php', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load passwords');
  return res.json();
}

async function apiSavePasswords(obj) {
  const res = await fetch('api/passwords.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  });
  if (!res.ok) throw new Error('Failed to save passwords');
  return res.json();
}
