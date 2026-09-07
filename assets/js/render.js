// render.js — draws the table, the mobile card list, and the summary chart.

function syncSortControls() {
  const select = document.getElementById('sortSelect');
  const dirBtn = document.getElementById('sortDirBtn');
  select.value = sortColumn || '';
  if (sortColumn) {
    dirBtn.style.display = 'inline-block';
    dirBtn.textContent = sortDirection === 'asc' ? '▲ Asc' : '▼ Desc';
  } else {
    dirBtn.style.display = 'none';
  }
}

function applySortFromDropdown() {
  const val = document.getElementById('sortSelect').value;
  sortColumn = val || null;
  sortDirection = 'asc';
  syncSortControls();
  render();
}

function toggleSortDirection() {
  sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  syncSortControls();
  render();
}

function render() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  let totPrincipal = 0, totInterest = 0, totDue = 0, totPaid = 0, totPending = 0, totClearedAmount = 0, totPendingMonths = 0;

  // Totals & chart always reflect the FULL ledger, regardless of search
  entries.forEach(e => {
    const b = loanBreakdown(e);
    totPrincipal += e.principal;
    totInterest += b.c.interest;
    totDue += b.c.totalDue;
    totPaid += b.interestPaidShown;
    totPending += b.pending;
    totClearedAmount += b.totalPaidAmount;
    totPendingMonths += b.pendingMonths;
  });

  // Build filtered + sorted list for display, keeping original indices for edit/delete
  const searchTerm = (document.getElementById('searchBox').value || '').trim().toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  let rows = entries
    .map((e, i) => ({ e, i, b: loanBreakdown(e) }))
    .filter(({ e }) => !searchTerm || e.name.toLowerCase().includes(searchTerm))
    .filter(({ e }) => !statusFilter || e.status === statusFilter)
    .filter(({ e }) => currentRole === 'admin' || e.status !== 'Cleared');

  if (sortColumn) {
    const valueOf = ({ e, b }) => {
      switch (sortColumn) {
        case 'dateGiven': return e.dateGiven;
        case 'name': return e.name.toLowerCase();
        case 'principal': return e.principal;
        case 'interest': return b.c.interest;
        case 'totalDue': return b.c.totalDue;
        case 'months': return b.c.months;
        case 'status': return e.status || '';
        case 'interestPaid': return b.interestPaidShown;
        case 'pending': return b.pending;
        case 'pendingMonths': return b.pendingMonths;
        default: return '';
      }
    };
    rows.sort((a, b2) => {
      const va = valueOf(a), vb = valueOf(b2);
      let cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }

  document.querySelectorAll('th.sortable .sort-arrow').forEach(el => el.textContent = '');
  if (sortColumn) {
    const activeTh = document.querySelector(`th[data-sort="${sortColumn}"] .sort-arrow`);
    if (activeTh) activeTh.textContent = sortDirection === 'asc' ? '▲' : '▼';
  }

  rows.forEach(({ e, i, b }) => {
    const { isCleared, c, pending, interestPaidShown, totalPaidAmount, pendingMonths } = b;

    const tr = document.createElement('tr');
    if (!isCleared && pendingMonths > 12) tr.classList.add('row-danger');
    else if (!isCleared && pendingMonths >= 9) tr.classList.add('row-warn');

    tr.innerHTML = `
      <td class="col-dateGiven">${escapeHtml(e.dateGiven)}</td>
      <td class="col-name">${escapeHtml(e.name)}</td>
      <td class="num col-principal">${fmt(e.principal)}</td>
      <td class="col-rate">${escapeHtml(e.rate)}%</td>
      <td class="num col-interest">${fmt(c.interest)}</td>
      <td class="num col-totalDue">${fmt(c.totalDue)}</td>
      <td class="num col-months">${c.months.toFixed(2)}</td>
      <td class="col-status ${statusClass(e.status)}">${escapeHtml(e.status || '')}</td>
      <td class="col-clearedDate">${isCleared ? escapeHtml(e.clearedDate || '—') : '—'}</td>
      <td class="num col-totalPaidAmount">${isCleared ? fmt(totalPaidAmount) : '—'}</td>
      <td class="num col-interestPaid">${fmt(interestPaidShown)}</td>
      <td class="num col-pending">${fmt(pending)}</td>
      <td class="num col-pendingMonths">${pendingMonths.toFixed(1)}</td>
      <td class="col-contact">${escapeHtml(e.contact || '—')}</td>
      <td class="comment col-comments">${escapeHtml(e.comments || '')}</td>
      <td class="col-actions">${
        currentRole === 'admin'
          ? `<button class="btn-edit" onclick="editEntry(${i})">Edit</button>${(!isCleared && pending > 0) ? `<button class="btn-remind" onclick="sendReminder(${i})">Remind</button>` : ''}<button class="btn-danger" onclick="deleteEntry(${i})">Delete</button>`
          : ((!isCleared && pending > 0) ? `<button class="btn-remind" onclick="sendReminder(${i})">Remind</button>` : '')
      }</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('totPrincipal').textContent = fmt(totPrincipal);
  document.getElementById('totInterest').textContent = fmt(totInterest);
  document.getElementById('totDue').textContent = fmt(totDue);
  document.getElementById('totClearedAmount').textContent = fmt(totClearedAmount);
  document.getElementById('totPaid').textContent = fmt(totPaid);
  document.getElementById('totPending').textContent = fmt(totPending);
  document.getElementById('totPendingMonths').textContent = totPendingMonths.toFixed(1);

  renderCards(rows);
  renderChart(totPrincipal, totInterest, totPaid, totPending);
}

function renderCards(rows) {
  const wrap = document.getElementById('cardWrap');
  const isView = currentRole !== 'admin';

  wrap.innerHTML = rows.map(({ e, i, b }) => {
    const { isCleared, c, pending, interestPaidShown, pendingMonths } = b;
    let cardClass = '';
    if (!isCleared && pendingMonths > 12) cardClass = 'card-danger';
    else if (!isCleared && pendingMonths >= 9) cardClass = 'card-warn';

    const rowsHtml = [
      ['Principal', `₹${fmt(e.principal)}`],
      !isView ? ['Rate', `${escapeHtml(e.rate)}%`] : null,
      !isView ? ['Interest', `₹${fmt(c.interest)}`] : null,
      !isView ? ['Total Due', `₹${fmt(c.totalDue)}`] : null,
      !isView ? ['Months', c.months.toFixed(2)] : null,
      ['Interest Pending', `₹${fmt(pending)}`],
      ['Pending Months', pendingMonths.toFixed(1)],
      !isView ? ['Interest Paid', `₹${fmt(interestPaidShown)}`] : null,
      e.contact ? ['Contact', escapeHtml(e.contact)] : null,
      e.comments ? ['Remarks / Comments', escapeHtml(e.comments)] : null,
    ].filter(Boolean);

    const canRemind = !isCleared && pending > 0;
    const actions = currentRole === 'admin' ? `
      <div class="card-actions">
        <button class="btn-edit" onclick="editEntry(${i})">Edit</button>
        ${canRemind ? `<button class="btn-remind" onclick="sendReminder(${i})">Remind</button>` : ''}
        <button class="btn-danger" onclick="deleteEntry(${i})">Delete</button>
      </div>` : (canRemind ? `
      <div class="card-actions">
        <button class="btn-remind" onclick="sendReminder(${i})">Remind</button>
      </div>` : '');

    return `
      <div class="entry-card ${cardClass}">
        <div class="card-top">
          <span class="card-name">${escapeHtml(e.name)}</span>
          <span class="card-status ${statusClass(e.status)}">${escapeHtml(e.status || '')}</span>
        </div>
        <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">Given: ${escapeHtml(e.dateGiven)}</div>
        ${rowsHtml.map(([k, v]) => `<div class="card-row"><span class="k">${k}</span><span>${v}</span></div>`).join('')}
        ${actions}
      </div>`;
  }).join('') || '<span style="color:#6b7280;font-size:13px;">No entries found.</span>';
}

function renderChart(totPrincipal, totInterest, totPaid, totPending) {
  // Stat cards
  const stats = document.getElementById('statCards');
  stats.innerHTML = `
    <div class="stat-card principal"><span class="icon">💰</span><div><div class="label">Total Principal Out</div><div class="value">₹${fmt(totPrincipal)}</div></div></div>
    <div class="stat-card interest"><span class="icon">📈</span><div><div class="label">Total Interest Accrued</div><div class="value">₹${fmt(totInterest)}</div></div></div>
    <div class="stat-card paid"><span class="icon">✅</span><div><div class="label">Total Interest Paid</div><div class="value">₹${fmt(totPaid)}</div></div></div>
    <div class="stat-card pending"><span class="icon">⏳</span><div><div class="label">Total Interest Pending</div><div class="value">₹${fmt(totPending)}</div></div></div>
  `;

  // One bar per loan (all non-cleared entries), broken into months paid vs months pending
  const loans = entries
    .filter(e => e.status !== 'Cleared')
    .map(e => {
      const c = calc(e);
      const monthlyInterest = e.principal * (e.rate / 100);
      let paidMonths = monthlyInterest > 0 ? (e.interestPaid || 0) / monthlyInterest : 0;
      paidMonths = Math.max(0, Math.min(paidMonths, c.months));
      const pendingMonths = Math.max(c.months - paidMonths, 0);
      return {
        label: `${escapeHtml(e.name)} (${escapeHtml(e.dateGiven)})`,
        totalMonths: c.months,
        paidMonths,
        pendingMonths,
        pendingAmount: c.pending
      };
    })
    .filter(l => l.totalMonths > 0)
    .sort((a, b) => b.pendingMonths - a.pendingMonths);

  const maxMonths = Math.max(...loans.map(l => l.totalMonths), 1);

  const container = document.getElementById('chartContainer');
  let html = `<div class="chart-legend">
      <span><span class="swatch" style="background:#059669;"></span> Months Paid</span>
      <span><span class="swatch" style="background:#f59e0b;"></span> Months Pending (within 1 year)</span>
      <span><span class="swatch" style="background:#dc2626;"></span> Months Pending (over 1 year)</span>
    </div>`;
  loans.forEach(l => {
    const paidPct = (l.paidMonths / maxMonths) * 100;
    const pendingPct = (l.pendingMonths / maxMonths) * 100;
    const pendingColor = l.pendingMonths > 12 ? '#dc2626' : '#f59e0b';
    const pendingLabel = l.pendingMonths > 0
      ? `${l.pendingMonths.toFixed(1)} mo pending · ₹${fmt(l.pendingAmount)}`
      : 'Fully paid to date';
    html += `
      <div class="bar-row">
        <div class="bar-label" title="${l.label}">${l.label}</div>
        <div class="bar-track">
          <div class="bar-fill-paid" style="width:${paidPct}%"></div>
          <div class="bar-fill-pending" style="width:${pendingPct}%; background:${pendingColor};"></div>
        </div>
        <div class="bar-value">${pendingLabel}</div>
      </div>`;
  });
  container.innerHTML = html || '<span style="color:#6b7280;font-size:13px;">No data yet.</span>';
}
