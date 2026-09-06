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

  if (!next || next.length < 4) {
    alert('New password must be at least 4 characters.');
    return;
  }
  if (next !== confirmPw) {
    alert('New password and confirmation do not match.');
    return;
  }

  try {
    const result = await apiChangePassword(which, current, next);
    if (!result.success) {
      alert(result.error || 'Current password is incorrect.');
      return;
    }
    alert('Password updated successfully.');
    backToMenu();
  } catch (e) {
    alert('Could not save the new password — please try again.');
  }
}
