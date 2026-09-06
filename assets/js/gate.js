// gate.js — password-protected role selection screen.

async function loadPasswordsForGate() {
  try {
    const saved = await apiGetPasswords();
    if (saved.adminPassword) ADMIN_PASSWORD = saved.adminPassword;
    if (saved.viewPassword) VIEW_PASSWORD = saved.viewPassword;
    if (saved.deletePassword) DELETE_PASSWORD = saved.deletePassword;
  } catch (e) {
    console.error('Could not load saved passwords, using defaults', e);
  }
  passwordsLoaded = true;
  document.getElementById('pwInput').disabled = false;
  document.querySelector('#gate .go').disabled = false;
  document.getElementById('gateError').textContent = '';
}

function selectRole(role) {
  selectedRole = role;
  document.getElementById('roleAdminBtn').classList.toggle('active', role === 'admin');
  document.getElementById('roleViewBtn').classList.toggle('active', role === 'view');
  document.getElementById('gateError').textContent = '';
}

function checkPassword() {
  if (!passwordsLoaded) {
    document.getElementById('gateError').textContent = 'Still loading — try again in a moment.';
    return;
  }
  const input = document.getElementById('pwInput').value;
  const error = document.getElementById('gateError');
  if (!selectedRole) { error.textContent = 'Choose Admin or View Only first.'; return; }
  const correct = selectedRole === 'admin' ? ADMIN_PASSWORD : VIEW_PASSWORD;
  if (input === correct) {
    enterAs(selectedRole);
  } else {
    error.textContent = 'Incorrect password. Try again.';
  }
}

function enterAs(role) {
  currentRole = role;
  document.getElementById('gate').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('roleTag').textContent = currentRole === 'admin' ? 'ADMIN' : 'VIEW ONLY';
  document.body.classList.toggle('role-view', currentRole === 'view');
  document.getElementById('actionsHeader').style.display = '';
  document.getElementById('actionsFootSpacer').style.display = '';
  if (currentRole === 'admin') {
    document.getElementById('adminMenuCard').style.display = 'block';
    document.getElementById('adminToolbarActions').style.display = 'inline-flex';
  }
  init();
}

function logout() {
  currentRole = null;
  selectedRole = null;
  document.body.classList.remove('role-view');
  document.getElementById('roleAdminBtn').classList.remove('active');
  document.getElementById('roleViewBtn').classList.remove('active');
  document.getElementById('pwInput').value = '';
  document.getElementById('gateError').textContent = '';
  document.getElementById('app').style.display = 'none';
  document.getElementById('gate').style.display = 'flex';
}
