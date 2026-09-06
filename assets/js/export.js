// export.js — CSV export, JSON backup export/import (Admin only).

function exportCSV() {
  const headers = ['Date Given', 'Person Name', 'Principal', 'Rate %', 'Interest Amount', 'Total Due', 'Due Date', 'Months', 'Status', 'Cleared Date', 'Total Paid Amount', 'Interest Paid', 'Interest Pending', 'Pending Months', 'Contact', 'Comments'];
  const rows = entries.map(e => {
    const b = loanBreakdown(e);
    return [
      e.dateGiven, e.name, e.principal, e.rate, b.c.interest.toFixed(2), b.c.totalDue.toFixed(2),
      b.isCleared ? '' : e.dueDate, b.c.months.toFixed(2), e.status || '',
      b.isCleared ? (e.clearedDate || '') : '', b.isCleared ? b.totalPaidAmount.toFixed(2) : '',
      b.interestPaidShown.toFixed(2), b.pending.toFixed(2), b.pendingMonths.toFixed(1), e.contact || '', e.comments || ''
    ];
  });
  const escapeCsv = v => {
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = [headers, ...rows].map(r => r.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lending_ledger_${todayStr()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportBackup() {
  const json = JSON.stringify(entries, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lending_ledger_backup_${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    let imported;
    try {
      imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error('Not an array');
    } catch (err) {
      alert('That file doesn\'t look like a valid backup (expected JSON array of entries).');
      event.target.value = '';
      return;
    }

    const validEntries = imported.filter(e => e && e.dateGiven && e.name);
    if (validEntries.length === 0) {
      alert('No valid entries found in that file.');
      event.target.value = '';
      return;
    }

    if (!confirm(`This will REPLACE all ${entries.length} current entries with ${validEntries.length} entries from the backup file. This cannot be undone. Continue?`)) {
      event.target.value = '';
      return;
    }
    const pw = prompt('Enter the delete password to confirm this import (it overwrites existing data):');
    if (pw === null) { event.target.value = ''; return; }
    const check = await apiVerifyDeletePassword(pw);
    if (!check.success) {
      alert('Incorrect password. Import cancelled.');
      event.target.value = '';
      return;
    }

    entries = validEntries;
    await persist();
    render();
    event.target.value = '';
    alert(`Import complete — ${validEntries.length} entries loaded.`);
  };
  reader.readAsText(file);
}
