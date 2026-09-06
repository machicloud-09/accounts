// passwords.js — in-app change-password screen for Admin/View/Delete passwords.

function showChangePassword() {
  hideAllAdminCards();
  document.getElementById('changePasswordCard').style.display = 'block';
  document.getElementById('pw_which').value = 'admin';
  document.getElementById('pw_current').value = '';
  document.getElementById('pw_new').value = '';
  document.getElementById('pw_confirm').value = '';
}

async function changePassword() {
  const which = document.getElementById('pw_which').value;
  const current = document.getElementById('pw_current').value;
  const next = document.getElementById('pw_new').value;
  const confirmPw = document.getElementById('pw_confirm').value;

  const currentCorrect = which === 'admin' ? ADMIN_PASSWORD : which === 'view' ? VIEW_PASSWORD : DELETE_PASSWORD;
  if (current !== currentCorrect) {
    alert('Current password is incorrect.');
    return;
  }
  if (!next || next.length < 4) {
    alert('New password must be at least 4 characters.');
    return;
  }
  if (next !== confirmPw) {
    alert('New password and confirmation do not match.');
    return;
  }

  if (which === 'admin') ADMIN_PASSWORD = next;
  else if (which === 'view') VIEW_PASSWORD = next;
  else DELETE_PASSWORD = next;

  try {
    await apiSavePasswords({
      adminPassword: ADMIN_PASSWORD,
      viewPassword: VIEW_PASSWORD,
      deletePassword: DELETE_PASSWORD
    });
    alert('Password updated successfully.');
    backToMenu();
  } catch (e) {
    alert('Could not save the new password — please try again.');
  }
}
