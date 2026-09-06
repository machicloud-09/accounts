// timeout.js — inactivity session countdown, shown top-right in the header.
// Mirrors the SESSION_TIMEOUT_SECONDS enforced server-side in api/auth.php.

const SESSION_TIMEOUT_SECONDS = 180;
const ACTIVITY_PING_INTERVAL_MS = 15000; // don't ping the server on every mousemove

let sessionSecondsLeft = SESSION_TIMEOUT_SECONDS;
let sessionTickHandle = null;
let lastActivityPingAt = 0;

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function renderSessionTimer() {
  const el = document.getElementById('sessionTimer');
  if (!el) return;
  el.textContent = currentRole ? `⏱ ${formatTimer(sessionSecondsLeft)}` : '';
}

function startSessionTimer(initialSeconds) {
  stopSessionTimer();
  sessionSecondsLeft = typeof initialSeconds === 'number' ? initialSeconds : SESSION_TIMEOUT_SECONDS;
  renderSessionTimer();
  sessionTickHandle = setInterval(() => {
    sessionSecondsLeft--;
    if (sessionSecondsLeft <= 0) {
      stopSessionTimer();
      onSessionExpired();
      return;
    }
    renderSessionTimer();
  }, 1000);
}

function stopSessionTimer() {
  if (sessionTickHandle) clearInterval(sessionTickHandle);
  sessionTickHandle = null;
}

async function onUserActivity() {
  if (!currentRole) return;
  sessionSecondsLeft = SESSION_TIMEOUT_SECONDS;
  renderSessionTimer();

  const now = Date.now();
  if (now - lastActivityPingAt < ACTIVITY_PING_INTERVAL_MS) return;
  lastActivityPingAt = now;
  try {
    await apiTouch();
  } catch (e) {
    // Network hiccup — the client-side countdown still governs the UI;
    // the next successful ping resyncs the server-side timeout.
  }
}

async function onSessionExpired() {
  if (!currentRole) return;
  stopSessionTimer();
  await logout();
  document.getElementById('gateError').textContent = 'Session timed out due to inactivity. Please log in again.';
}

['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, onUserActivity, { passive: true });
});
