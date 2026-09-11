// calc.js — pure helper functions: date math, interest math, formatting.

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function monthsBetween(d1, d2) {
  const a = new Date(d1), b = new Date(d2);
  const diffDays = (b - a) / (1000 * 60 * 60 * 24);
  return diffDays / 30;
}

function calc(entry) {
  // "As of" date: frozen at clearedDate once a loan is Cleared, otherwise
  // always today — interest keeps accruing live, no due date to maintain.
  const asOfDate = (entry.status === 'Cleared' && entry.clearedDate) ? entry.clearedDate : todayStr();
  const months = monthsBetween(entry.dateGiven, asOfDate);
  const interest = entry.principal * (entry.rate / 100) * months;
  const totalDue = entry.principal + interest;
  const pending = Math.max(interest - (entry.interestPaid || 0), 0);
  return { months, interest, totalDue, pending, asOfDate };
}

// Shared breakdown used by both the table and the chart
function loanBreakdown(e) {
  const isCleared = e.status === 'Cleared';
  const c = calc(e);
  const pending = isCleared ? 0 : c.pending;
  const interestPaidShown = isCleared ? c.interest : (e.interestPaid || 0);
  const totalPaidAmount = isCleared ? (e.principal + c.interest) : 0;
  const monthlyInterest = e.principal * (e.rate / 100);
  let paidMonths = monthlyInterest > 0 ? (e.interestPaid || 0) / monthlyInterest : 0;
  paidMonths = Math.max(0, Math.min(paidMonths, c.months));
  const pendingMonths = isCleared ? 0 : Math.max(c.months - paidMonths, 0);
  return { isCleared, c, pending, interestPaidShown, totalPaidAmount, paidMonths, pendingMonths };
}

function fmt(n) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusClass(s) {
  if (s === 'Cleared') return 'status-cleared';
  if (s === 'Pending') return 'status-pending';
  if (s === '1 Year') return 'status-partial';
  return '';
}

// Entries are rendered via innerHTML for table/card layout, and the
// backend never validates their field types/content — so any string field
// (name, comments, contact, dates, status, rate) must be escaped before
// being interpolated into HTML, or a saved/imported entry could inject a
// script that runs in every viewer's authenticated session.
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function cleanPhoneForWhatsApp(raw) {
  let digits = (raw || '').replace(/[^\d]/g, '');
  if (!digits) return null;
  if (digits.length === 10) digits = '91' + digits;               // assume India if no country code
  else if (digits.length === 11 && digits.startsWith('0')) digits = '91' + digits.slice(1);
  return digits;
}
