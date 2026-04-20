/**
 * FinTrack — Charts
 * Manages Chart.js instances for trend line and category pie.
 */

// ── Color palette ──────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  'Food':         '#f59e0b',
  'Rent':         '#f87171',
  'Transport':    '#60a5fa',
  'Shopping':     '#a78bfa',
  'Entertainment':'#f472b6',
  'Health':       '#34d399',
  'Travel':       '#38bdf8',
  'Utilities':    '#fb923c',
  'Salary':       '#4ade80',
  'Freelance':    '#86efac',
  'Bonus':        '#6ee7b7',
  'Investment':   '#5eead4',
  'Education':    '#c084fc',
  'Other Income': '#a3e635',
  'Other':        '#94a3b8',
};

function getCatColor(cat) {
  return CATEGORY_COLORS[cat] || '#94a3b8';
}

// ── Shared Chart.js defaults ───────────────────────────────────────────────

Chart.defaults.color           = '#7b82a8';
Chart.defaults.borderColor     = '#2d3150';
Chart.defaults.font.family     = "'Inter', sans-serif";
Chart.defaults.font.size       = 12;

// ── Line / bar trend chart ─────────────────────────────────────────────────

let trendChartInst = null;

function renderTrendChart(trendData) {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;

  const labels   = trendData.map(d => d.label);
  const incomes  = trendData.map(d => d.income);
  const expenses = trendData.map(d => d.expenses);
  const savings  = trendData.map(d => d.savings);

  if (trendChartInst) trendChartInst.destroy();

  trendChartInst = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label:           'Income',
          data:            incomes,
          backgroundColor: 'rgba(74, 222, 128, 0.25)',
          borderColor:     '#4ade80',
          borderWidth:     1.5,
          borderRadius:    4,
          borderSkipped:   false,
        },
        {
          label:           'Expenses',
          data:            expenses,
          backgroundColor: 'rgba(248, 113, 113, 0.25)',
          borderColor:     '#f87171',
          borderWidth:     1.5,
          borderRadius:    4,
          borderSkipped:   false,
        },
        {
          label:       'Savings',
          data:        savings,
          type:        'line',
          borderColor: '#60a5fa',
          borderWidth: 2,
          pointBackgroundColor: '#60a5fa',
          pointRadius: 4,
          tension:     0.35,
          fill:        false,
        },
      ],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction:         { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#20243a',
          borderColor:     '#2d3150',
          borderWidth:     1,
          padding:         12,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${fmtINR(ctx.raw)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(45,49,80,0.5)' },
          ticks: { autoSkip: false, maxRotation: 30 },
        },
        y: {
          grid: { color: 'rgba(45,49,80,0.5)' },
          ticks: {
            callback: v => v >= 1000 ? '₹' + (v / 1000).toFixed(0) + 'k' : '₹' + v,
          },
        },
      },
    },
  });

  // Update custom legend
  renderChartLegend('trendLegend', [
    { label: 'Income',   color: '#4ade80' },
    { label: 'Expenses', color: '#f87171' },
    { label: 'Savings',  color: '#60a5fa' },
  ]);
}

// ── Doughnut / pie chart ───────────────────────────────────────────────────

let pieChartInst = null;

function renderPieChart(catData) {
  const canvas = document.getElementById('pieChart');
  if (!canvas || !catData.length) return;

  const labels = catData.map(d => d.category);
  const values = catData.map(d => d.total);
  const colors = labels.map(getCatColor);

  if (pieChartInst) pieChartInst.destroy();

  pieChartInst = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data:            values,
        backgroundColor: colors.map(c => c + '99'),  // 60% opacity fills
        borderColor:     colors,
        borderWidth:     1.5,
        hoverOffset:     6,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      cutout:              '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#20243a',
          borderColor:     '#2d3150',
          borderWidth:     1,
          padding:         12,
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((ctx.raw / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${fmtINR(ctx.raw)} (${pct}%)`;
            },
          },
        },
      },
    },
  });

  // Update custom legend
  renderChartLegend('pieLegend', labels.map((l, i) => ({ label: l, color: colors[i] })));
}

// ── Custom legend ──────────────────────────────────────────────────────────

function renderChartLegend(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map(({ label, color }) =>
    `<div class="legend-item">
       <div class="legend-dot" style="background:${color}"></div>
       <span>${label}</span>
     </div>`
  ).join('');
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtINR(val) {
  if (val === undefined || val === null) return '₹0';
  return '₹' + Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getCategoryColor(cat) { return getCatColor(cat); }
