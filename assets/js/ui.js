// ui.js — toast notifications and a promise-based modal dialog, replacing
// native alert()/confirm()/prompt() so messages match the app's styling and
// don't block the page.

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 200);
  }, 4000);
}

// type: 'confirm' (OK/Cancel, resolves true/false) or 'prompt' (adds a text
// input, resolves the entered string or null on cancel).
function showModal({ message, type = 'confirm', inputType = 'text', confirmLabel = 'OK', cancelLabel = 'Cancel', danger = false }) {
  return new Promise(resolve => {
    const overlay = document.getElementById('modalOverlay');
    const messageEl = document.getElementById('modalMessage');
    const inputWrap = document.getElementById('modalInputWrap');
    const input = document.getElementById('modalInput');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const isPrompt = type === 'prompt';

    messageEl.textContent = message;
    confirmBtn.textContent = confirmLabel;
    confirmBtn.className = danger ? 'btn-danger' : 'btn-primary';
    cancelBtn.textContent = cancelLabel;
    inputWrap.style.display = isPrompt ? 'block' : 'none';
    if (isPrompt) {
      input.type = inputType;
      input.value = '';
    }

    function cleanup(result) {
      overlay.style.display = 'none';
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      overlay.onkeydown = null;
      resolve(result);
    }

    confirmBtn.onclick = () => cleanup(isPrompt ? input.value : true);
    cancelBtn.onclick = () => cleanup(isPrompt ? null : false);
    overlay.onkeydown = e => {
      if (e.key === 'Enter') { e.preventDefault(); confirmBtn.click(); }
      if (e.key === 'Escape') cancelBtn.click();
    };

    overlay.style.display = 'flex';
    (isPrompt ? input : confirmBtn).focus();
  });
}

function showConfirm(message, opts = {}) {
  return showModal({ message, type: 'confirm', ...opts });
}

function showPrompt(message, opts = {}) {
  return showModal({ message, type: 'prompt', ...opts });
}
