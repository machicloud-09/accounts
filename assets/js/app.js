// app.js — small bootstrap that starts the login gate.
// Loaded last, after all other modules, with `defer` so the DOM is ready.

document.getElementById('pwInput').addEventListener('keyup', function (e) {
  if (e.key === 'Enter') checkPassword();
});

restoreSession();
