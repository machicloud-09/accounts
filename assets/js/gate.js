// gate.js — password-protected role selection screen.
// Login is verified server-side (api/login.php); the session cookie it sets
// is what actually gates api/data.php and api/passwords.php.

async function restoreSession() {
  try {
    const { role, expiresIn } = await apiGetSession();
    if (role) {
      enterAs(role, expiresIn);
      return;
    }
  } catch (e) {
    console.error('Could not check session', e);
  }
  document.getElementById('pwInput').disabled = false;
  document.querySelector('#gate .go').disabled = false;
}

function selectRole(role) {
  selectedRole = role;
  document.getElementById('roleAdminBtn').classList.toggle('active', role === 'admin');
  document.getElementById('roleViewBtn').classList.toggle('active', role === 'view');
  document.getElementById('gateError').textContent = '';
}

async function checkPassword() {
  const input = document.getElementById('pwInput').value;
  const error = document.getElementById('gateError');
  if (!selectedRole) { error.textContent = 'Choose Admin or View Only first.'; return; }
  try {
    const result = await apiLogin(selectedRole, input);
    if (result.success) {
      enterAs(result.role, result.expiresIn);
    } else {
      error.textContent = 'Incorrect password. Try again.';
    }
  } catch (e) {
    error.textContent = 'Could not reach the server. Try again.';
  }
}

function enterAs(role, expiresIn) {
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
  startSessionTimer(expiresIn);
  init();
}

async function logout() {
  stopSessionTimer();
  try { await apiLogout(); } catch (e) { console.error(e); }
  currentRole = null;
  selectedRole = null;
  document.body.classList.remove('role-view');
  document.getElementById('roleAdminBtn').classList.remove('active');
  document.getElementById('roleViewBtn').classList.remove('active');
  document.getElementById('pwInput').value = '';
  document.getElementById('gateError').textContent = '';
  document.getElementById('sessionTimer').textContent = '';
  document.getElementById('app').style.display = 'none';
  document.getElementById('gate').style.display = 'flex';
}
