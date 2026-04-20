/**
 * FinTrack — API Client
 * All backend communication lives here.
 * Base URL auto-detects: same origin in production, localhost:5000 in dev.
 */

const BASE_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
  ? 'http://127.0.0.1:5000'
  : '';

const API = {
  // ── Transactions ──────────────────────────────────────────────────────────

  async getTransactions(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return _fetch(`/api/transactions${params ? '?' + params : ''}`);
  },

  async addTransaction(data) {
    return _fetch('/api/add-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateTransaction(id, data) {
    return _fetch(`/api/update-transaction/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteTransaction(id) {
    return _fetch(`/api/delete-transaction/${id}`, { method: 'DELETE' });
  },

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getDashboard() {
    return _fetch('/api/dashboard');
  },

  async getMonthlyReport(year, month) {
    return _fetch(`/api/reports/monthly?year=${year}&month=${month}`);
  },

  async getPredictions() {
    return _fetch('/api/predictions');
  },

  // ── Exports ───────────────────────────────────────────────────────────────

  exportCSV(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    window.location.href = `${BASE_URL}/api/export/csv${params ? '?' + params : ''}`;
  },

  exportPDF(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    window.location.href = `${BASE_URL}/api/export/pdf${params ? '?' + params : ''}`;
  },
};

async function _fetch(path, opts = {}) {
  const res = await fetch(BASE_URL + path, opts);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Request failed');
  }
  return json;
}
