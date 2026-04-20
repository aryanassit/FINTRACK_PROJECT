/**
 * FinTrack — App Logic
 * Page navigation, dashboard, transactions, reports, predictions.
 */

// ── App state ─────────────────────────────────────────────────────────────

const State = {
  transactions: [],
  editingId:    null,
};

// ── Init ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  navigateTo('dashboard');
  setupForm();
  setupFilters();
  setupModal();
  setDefaultDate();
});

// ── Navigation ────────────────────────────────────────────────────────────

function setupNavigation() {
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });
}

function navigateTo(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('[data-page]').forEach(l => l.classList.remove('active'));

  // Show target
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');

  document.querySelectorAll(`[data-page="${pageId}"]`).forEach(l => l.classList.add('active'));

  // Update topbar title
  const titles = {
    dashboard:    'Dashboard',
    add:          'Add Transaction',
    history:      'Transaction History',
    reports:      'Monthly Reports',
    predictions:  'Expense Predictions',
  };
  const el = document.getElementById('topbarTitle');
  if (el) el.textContent = titles[pageId] || 'FinTrack';

  // Load data for page
  switch (pageId) {
    case 'dashboard':   loadDashboard(); break;
    case 'history':     loadHistory();   break;
    case 'reports':     loadReport();    break;
    case 'predictions': loadPredictions(); break;
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────

async function loadDashboard() {
  try {
    showLoading('dashMetrics');
    const data = await API.getDashboard();
    const { summary, trend, categories } = data;

    // Metric cards
    document.getElementById('dashMetrics').innerHTML = `
      <div class="metric-card income">
        <div class="metric-label">💰 Total Income</div>
        <div class="metric-value income">${fmtINR(summary.total_income)}</div>
        <div class="metric-sub">All time</div>
      </div>
      <div class="metric-card expense">
        <div class="metric-label">💸 Total Expenses</div>
        <div class="metric-value expense">${fmtINR(summary.total_expenses)}</div>
        <div class="metric-sub">All time</div>
      </div>
      <div class="metric-card balance">
        <div class="metric-label">🏦 Net Balance</div>
        <div class="metric-value balance ${summary.balance < 0 ? 'expense' : ''}">${fmtINR(summary.balance)}</div>
        <div class="metric-sub">${summary.balance >= 0 ? 'In surplus' : 'In deficit'}</div>
      </div>
      <div class="metric-card count">
        <div class="metric-label">📋 Transactions</div>
        <div class="metric-value count">${summary.total_transactions}</div>
        <div class="metric-sub">Total records</div>
      </div>
    `;

    // Charts
    renderTrendChart(trend.trend);
    renderPieChart(categories.categories);

    // Recent transactions table
    const recent = await API.getTransactions();
    renderRecentTable(recent.transactions.slice(0, 8));

  } catch (err) {
    showError('dashMetrics', err.message);
  }
}

function renderRecentTable(txns) {
  const el = document.getElementById('recentTxns');
  if (!el) return;
  if (!txns.length) {
    el.innerHTML = emptyState('No recent transactions');
    return;
  }
  el.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${txns.map(t => `
            <tr>
              <td class="text-muted fs-13">${fmtDate(t.date)}</td>
              <td>${t.description || '—'}</td>
              <td><span class="cat-badge">${t.category}</span></td>
              <td><span class="badge badge-${t.type}">${t.type}</span></td>
              <td class="amount-cell ${t.type}">${t.type === 'income' ? '+' : '-'}${fmtINR(t.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── Add / Edit Transaction ─────────────────────────────────────────────────

function setupForm() {
  const form = document.getElementById('txnForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    const data = getFormData();

    try {
      if (State.editingId) {
        await API.updateTransaction(State.editingId, data);
        toast('Transaction updated', 'success');
        closeModal();
      } else {
        await API.addTransaction(data);
        toast('Transaction added!', 'success');
        form.reset();
        setDefaultDate();
        selectType('expense');
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = State.editingId ? 'Update Transaction' : 'Save Transaction';
    }
  });

  // Radio type buttons
  document.querySelectorAll('.radio-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.value;
      selectType(val);
    });
  });

  selectType('expense');
}

function getFormData() {
  return {
    amount:      parseFloat(document.getElementById('amount').value),
    type:        document.getElementById('hiddenType').value,
    category:    document.getElementById('category').value,
    date:        document.getElementById('txnDate').value,
    description: document.getElementById('description').value,
  };
}

function selectType(type) {
  document.getElementById('hiddenType').value = type;
  document.querySelectorAll('.radio-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.value === type);
  });
  updateCategoryOptions(type);
}

function updateCategoryOptions(type) {
  const sel = document.getElementById('category');
  const incomeOpts  = ['Salary', 'Freelance', 'Bonus', 'Investment', 'Other Income'];
  const expenseOpts = ['Food', 'Rent', 'Utilities', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Travel', 'Education', 'Other'];
  const opts = type === 'income' ? incomeOpts : expenseOpts;
  sel.innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
}

function setDefaultDate() {
  const input = document.getElementById('txnDate');
  if (input) input.value = new Date().toISOString().split('T')[0];
}

// ── Transaction History ───────────────────────────────────────────────────

async function loadHistory(filters = {}) {
  const tbody = document.getElementById('historyBody');
  const count = document.getElementById('txnCount');
  showLoading('historyBody');

  try {
    const data = await API.getTransactions(filters);
    State.transactions = data.transactions;

    if (count) count.textContent = `${data.count} records`;

    if (!data.transactions.length) {
      tbody.innerHTML = `<tr><td colspan="6">${emptyState('No transactions found')}</td></tr>`;
      return;
    }

    tbody.innerHTML = data.transactions.map(t => `
      <tr id="row-${t.id}">
        <td class="text-muted fs-13">${fmtDate(t.date)}</td>
        <td>${t.description || '—'}</td>
        <td><span class="cat-badge">${t.category}</span></td>
        <td><span class="badge badge-${t.type}">${t.type}</span></td>
        <td class="amount-cell ${t.type}">${t.type === 'income' ? '+' : '-'}${fmtINR(t.amount)}</td>
        <td>
          <div class="flex gap-8">
            <button class="btn-icon" title="Edit" onclick="openEdit(${t.id})">✏️</button>
            <button class="btn-icon" title="Delete" onclick="deleteTransaction(${t.id})" style="color:var(--red)">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">${errorState(err.message)}</td></tr>`;
  }
}

function setupFilters() {
  const form = document.getElementById('filterForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const filters = {};
    const cat      = document.getElementById('filterCat').value;
    const type     = document.getElementById('filterType').value;
    const dateFrom = document.getElementById('filterFrom').value;
    const dateTo   = document.getElementById('filterTo').value;
    if (cat)      filters.category  = cat;
    if (type)     filters.type      = type;
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo)   filters.date_to   = dateTo;
    loadHistory(filters);
  });

  form.querySelector('[data-reset]')?.addEventListener('click', () => {
    form.reset();
    loadHistory();
  });
}

// ── Delete ─────────────────────────────────────────────────────────────────

async function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  try {
    await API.deleteTransaction(id);
    document.getElementById('row-' + id)?.remove();
    toast('Deleted', 'success');
    // Refresh count
    const countEl = document.getElementById('txnCount');
    if (countEl) {
      const current = parseInt(countEl.textContent) || 0;
      countEl.textContent = `${current - 1} records`;
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ── Edit modal ─────────────────────────────────────────────────────────────

function openEdit(id) {
  const txn = State.transactions.find(t => t.id === id);
  if (!txn) return;

  State.editingId = id;

  // Populate form fields in modal
  document.getElementById('editAmount').value      = txn.amount;
  document.getElementById('editCategory').value    = txn.category;
  document.getElementById('editDate').value        = txn.date;
  document.getElementById('editDescription').value = txn.description;
  document.getElementById('editType').value        = txn.type;
  document.getElementById('editTypeLabel').textContent = txn.type.charAt(0).toUpperCase() + txn.type.slice(1);

  openModal('editModal');
}

async function submitEdit() {
  if (!State.editingId) return;
  const data = {
    amount:      parseFloat(document.getElementById('editAmount').value),
    type:        document.getElementById('editType').value,
    category:    document.getElementById('editCategory').value,
    date:        document.getElementById('editDate').value,
    description: document.getElementById('editDescription').value,
  };
  try {
    await API.updateTransaction(State.editingId, data);
    toast('Updated!', 'success');
    closeModal();
    loadHistory();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ── Monthly Report ─────────────────────────────────────────────────────────

async function loadReport() {
  const today = new Date();
  const yearSel  = document.getElementById('reportYear');
  const monthSel = document.getElementById('reportMonth');
  if (!yearSel || !monthSel) return;

  // Populate year options (last 3 years)
  if (!yearSel.options.length) {
    for (let y = today.getFullYear(); y >= today.getFullYear() - 2; y--) {
      yearSel.add(new Option(y, y));
    }
    yearSel.value  = today.getFullYear();
    monthSel.value = today.getMonth() + 1;
  }

  await fetchReport(yearSel.value, monthSel.value);
}

async function fetchReport(year, month) {
  const container = document.getElementById('reportContent');
  showLoading('reportContent');
  try {
    const data = await API.getMonthlyReport(year, month);
    const r    = data.report;

    container.innerHTML = `
      <div class="report-summary-grid">
        <div class="report-stat">
          <div class="report-stat-label">Income</div>
          <div class="report-stat-value text-green">${fmtINR(r.income)}</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-label">Expenses</div>
          <div class="report-stat-value text-red">${fmtINR(r.expenses)}</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-label">Savings</div>
          <div class="report-stat-value ${r.savings >= 0 ? 'text-green' : 'text-red'}">${fmtINR(r.savings)}</div>
        </div>
      </div>

      <div class="card mt-16">
        <div class="flex-between mb-4" style="margin-bottom:12px">
          <div class="card-title">Savings Rate</div>
          <div class="fw-600 fs-14 ${r.savings_rate >= 20 ? 'text-green' : r.savings_rate >= 0 ? 'text-amber' : 'text-red'}">${r.savings_rate}%</div>
        </div>
        <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${Math.min(100, Math.max(0, r.savings_rate))}%;background:${r.savings_rate >= 20 ? 'var(--green)' : r.savings_rate >= 0 ? '#fbbf24' : 'var(--red)'};border-radius:4px;transition:width .5s ease"></div>
        </div>
        <div class="flex-between mt-8" style="margin-top:10px;font-size:12px;color:var(--muted)">
          <span>${r.transaction_count} transactions</span>
          <span>Top category: <strong>${r.top_category}</strong> (${fmtINR(r.top_category_amount)})</span>
        </div>
      </div>

      ${r.by_category.length ? `
      <div class="card mt-16">
        <div class="card-title">Expenses by Category</div>
        ${r.by_category.map(c => `
          <div style="margin-bottom:10px">
            <div class="flex-between" style="margin-bottom:4px">
              <span class="fs-13">${c.category}</span>
              <span class="text-mono fs-13">${fmtINR(c.total)}</span>
            </div>
            <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${((c.total / r.expenses) * 100).toFixed(1)}%;background:${getCategoryColor(c.category)};border-radius:3px"></div>
            </div>
          </div>
        `).join('')}
      </div>` : ''}
    `;
  } catch (err) {
    showError('reportContent', err.message);
  }
}

// ── Predictions ────────────────────────────────────────────────────────────

async function loadPredictions() {
  const grid = document.getElementById('predictionsGrid');
  showLoading('predictionsGrid');
  try {
    const data  = await API.getPredictions();
    const preds = data.predictions;

    if (!preds.length) {
      grid.innerHTML = emptyState('Add more transactions across multiple months for predictions.');
      return;
    }

    grid.innerHTML = preds.map(p => `
      <div class="prediction-card">
        <div class="pred-cat">${p.category}</div>
        <div class="pred-amt">${fmtINR(p.predicted)}</div>
        <div class="pred-avg">3-mo avg: ${fmtINR(p.last_3_avg)}</div>
        <span class="trend-pill trend-${p.trend}">
          ${p.trend === 'up' ? '↑ Rising' : p.trend === 'down' ? '↓ Falling' : '→ Stable'}
        </span>
        <div style="margin-top:8px;font-size:11px;color:var(--muted)">
          History: ${p.history.map(v => fmtINR(v)).join(' → ')}
        </div>
      </div>
    `).join('');
  } catch (err) {
    showError('predictionsGrid', err.message);
  }
}

// ── Exports ────────────────────────────────────────────────────────────────

function exportCSV() {
  const filters = getCurrentFilters();
  API.exportCSV(filters);
  toast('Downloading CSV…', 'info');
}

function exportPDF() {
  const filters = getCurrentFilters();
  API.exportPDF(filters);
  toast('Generating PDF…', 'info');
}

function getCurrentFilters() {
  const cat  = document.getElementById('filterCat')?.value;
  const type = document.getElementById('filterType')?.value;
  const from = document.getElementById('filterFrom')?.value;
  const to   = document.getElementById('filterTo')?.value;
  const f    = {};
  if (cat)  f.category  = cat;
  if (type) f.type      = type;
  if (from) f.date_from = from;
  if (to)   f.date_to   = to;
  return f;
}

// ── Modal ──────────────────────────────────────────────────────────────────

function setupModal() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });
  });
}

function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  State.editingId = null;
}

// ── Toast ──────────────────────────────────────────────────────────────────

function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtINR(val) {
  if (val === undefined || val === null) return '₹0';
  return '₹' + Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showLoading(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="loading-overlay"><div class="spinner"></div> Loading…</div>`;
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="loading-overlay" style="color:var(--red)">⚠️ ${msg}</div>`;
}

function emptyState(msg) {
  return `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">${msg}</div></div>`;
}

function errorState(msg) {
  return `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">${msg}</div></div>`;
}
