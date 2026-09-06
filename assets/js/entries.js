// entries.js — loading data, CRUD forms, delete/remind actions.

async function init() {
  try {
    entries = await apiGetEntries();
  } catch (e) {
    console.error(e);
    entries = [];
    alert('Could not load ledger data from the server. Check that api/data.php is reachable and the data/ folder is writable.');
  }
  document.getElementById('loadingMsg').style.display = 'none';
  document.getElementById('toolbar').style.display = 'flex';
  document.getElementById('tableWrap').style.display = 'block';
  document.getElementById('chartCard').style.display = 'block';
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      if (sortColumn === col) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = col;
        sortDirection = 'asc';
      }
      syncSortControls();
      render();
    });
  });
  render();
}

async function persist() {
  try {
    await apiSaveEntries(entries);
  } catch (e) {
    console.error('Save error', e);
    alert('Could not save — please try again.');
  }
}

function hideAllAdminCards() {
  document.getElementById('adminMenuCard').style.display = 'none';
  document.getElementById('adminFormCard').style.display = 'none';
  document.getElementById('modifyListCard').style.display = 'none';
  document.getElementById('changePasswordCard').style.display = 'none';
}

function backToMenu() {
  hideAllAdminCards();
  document.getElementById('adminMenuCard').style.display = 'block';
}

function onStatusChange() {
  toggleClearedDate();
  autoFillOneYearInterest();
}

// "1 Year" status = 12 months paid at the loan's monthly rate: principal × rate% × 12
function autoFillOneYearInterest() {
  const status = document.getElementById('f_status').value;
  if (status !== '1 Year') return;
  const principal = parseFloat(document.getElementById('f_principal').value) || 0;
  const rate = parseFloat(document.getElementById('f_rate').value) || 0;
  const oneYearInterest = principal * (rate / 100) * 12;
  document.getElementById('f_interestPaid').value = oneYearInterest.toFixed(2);
}

function toggleClearedDate() {
  const isCleared = document.getElementById('f_status').value === 'Cleared';
  document.getElementById('clearedDateField').style.display = isCleared ? 'block' : 'none';
  if (isCleared && !document.getElementById('f_clearedDate').value) {
    const dueVal = document.getElementById('f_dueDate').value;
    document.getElementById('f_clearedDate').value = dueVal || todayStr();
  }
}

function showAddForm() {
  editIndex = null;
  hideAllAdminCards();
  document.getElementById('adminFormCard').style.display = 'block';
  document.getElementById('formTitle').textContent = 'Add New Entry';
  document.getElementById('formHint').style.display = 'block';
  document.getElementById('interestPaidField').style.display = 'none';
  document.getElementById('f_dateGiven').value = todayStr();
  document.getElementById('f_name').value = '';
  document.getElementById('f_principal').value = '';
  document.getElementById('f_rate').value = 2;
  document.getElementById('f_dueDate').value = todayStr();
  document.getElementById('f_status').value = 'Pending';
  document.getElementById('f_interestPaid').value = 0;
  document.getElementById('f_clearedDate').value = '';
  document.getElementById('f_contact').value = '';
  document.getElementById('f_comments').value = '';
  toggleClearedDate();
}

function showModifyList() {
  hideAllAdminCards();
  document.getElementById('modifyListCard').style.display = 'block';
  const list = document.getElementById('modifyList');
  list.innerHTML = '';
  entries.forEach((e, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid #e5e7eb;border-radius:6px;';
    row.innerHTML = `<span>${e.name} <span style="color:#6b7280;font-size:12px;">(${e.dateGiven}, ₹${fmt(e.principal)})</span></span>
      <span><button class="btn-edit" onclick="editEntry(${i})">Edit</button><button class="btn-danger" onclick="deleteEntry(${i})">Delete</button></span>`;
    list.appendChild(row);
  });
  if (entries.length === 0) list.innerHTML = '<span style="color:#6b7280;font-size:13px;">No entries yet.</span>';
}

function resetForm() {
  backToMenu();
}

function editEntry(i) {
  editIndex = i;
  const e = entries[i];
  hideAllAdminCards();
  document.getElementById('adminFormCard').style.display = 'block';
  document.getElementById('formTitle').textContent = 'Edit Entry: ' + e.name;
  document.getElementById('formHint').style.display = 'none';
  document.getElementById('interestPaidField').style.display = 'block';
  document.getElementById('f_dateGiven').value = e.dateGiven;
  document.getElementById('f_name').value = e.name;
  document.getElementById('f_principal').value = e.principal;
  document.getElementById('f_rate').value = e.rate;
  document.getElementById('f_dueDate').value = e.dueDate;
  document.getElementById('f_status').value = e.status || '';
  document.getElementById('f_interestPaid').value = e.interestPaid || 0;
  document.getElementById('f_clearedDate').value = e.clearedDate || '';
  document.getElementById('f_contact').value = e.contact || '';
  document.getElementById('f_comments').value = e.comments || '';
  toggleClearedDate();
  window.scrollTo(0, 0);
}

function sendReminder(i) {
  const e = entries[i];
  const phone = cleanPhoneForWhatsApp(e.contact);
  if (!phone) {
    alert(`No contact number saved for ${e.name}. Add one via Edit first.`);
    return;
  }
  const b = loanBreakdown(e);
  const message =
    `Hi ${e.name}, this is a reminder regarding your loan of ₹${fmt(e.principal)} taken on ${e.dateGiven}. ` +
    `Interest pending: ₹${fmt(b.pending)} (${b.pendingMonths.toFixed(1)} months). ` +
    `Kindly clear at your earliest convenience. Thank you.`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

async function deleteEntry(i) {
  const name = entries[i].name;
  if (!confirm(`Are you sure you would like to delete the entry for "${name}"? This cannot be undone.`)) return;
  const pw = prompt('Enter the delete password to confirm:');
  if (pw === null) return;
  const check = await apiVerifyDeletePassword(pw);
  if (!check.success) {
    alert('Incorrect password. Entry was not deleted.');
    return;
  }
  entries.splice(i, 1);
  await persist();
  render();
  if (document.getElementById('modifyListCard').style.display !== 'none') {
    showModifyList();
  }
}

async function saveEntry() {
  const dateGiven = document.getElementById('f_dateGiven').value;
  const name = document.getElementById('f_name').value.trim();
  const principal = parseFloat(document.getElementById('f_principal').value);
  const rate = parseFloat(document.getElementById('f_rate').value);
  const dueDate = document.getElementById('f_dueDate').value;
  const status = document.getElementById('f_status').value;
  const interestPaid = parseFloat(document.getElementById('f_interestPaid').value) || 0;
  const clearedDate = document.getElementById('f_clearedDate').value;
  const contact = document.getElementById('f_contact').value.trim();
  const comments = document.getElementById('f_comments').value.trim();

  if (!dateGiven || !name) {
    alert('Please fill in Date Given and Person Name.');
    return;
  }

  if (!isNaN(principal) && principal < 0) {
    alert('Principal cannot be negative.');
    return;
  }

  if (dueDate && dueDate < dateGiven) {
    alert('Due Date cannot be earlier than Date Given. Please check the dates.');
    return;
  }

  const isDuplicate = entries.some((existing, idx) =>
    idx !== editIndex &&
    existing.name.trim().toLowerCase() === name.toLowerCase() &&
    existing.dateGiven === dateGiven
  );
  if (isDuplicate) {
    if (!confirm(`An entry for "${name}" on ${dateGiven} already exists. Add this anyway?`)) return;
  }

  if (editIndex !== null) {
    if (!confirm(`Are you sure you would like to modify the entry for "${name}"?`)) return;
  }

  const entry = {
    dateGiven,
    name,
    principal: principal || 0,
    rate: rate || 2,
    dueDate: dueDate || todayStr(),
    status: status || 'Pending',
    interestPaid,
    clearedDate: status === 'Cleared' ? clearedDate : '',
    contact,
    comments
  };

  if (editIndex !== null) {
    entries[editIndex] = entry;
  } else {
    entries.push(entry);
  }
  await persist();
  render();
  backToMenu();
}
