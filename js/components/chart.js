/**
 * ==========================================================================
 * ENTERPRISE LIGHTWEIGHT SVG CHARTS & DASHBOARD VISUALIZATIONS
 * File: frontend/js/components/chart.js
 * ==========================================================================
 */

const ChartComponent = {
  /**
   * Render modern SVG Bar / Trend Chart
   * @param {string|HTMLElement} container
   * @param {Array<{ label: string, value: number }>} data
   */
  renderMonthlyTrendChart(container, data) {
    const el = typeof container === "string" ? document.getElementById(container) : container;
    if (!el) return;

    const items = data && data.length ? data : [
      { label: "Apr", value: 18 },
      { label: "Mei", value: 24 },
      { label: "Jun", value: 32 },
      { label: "Jul", value: 28 },
      { label: "Agu", value: 45 },
      { label: "Sep", value: 52 }
    ];

    const maxVal = Math.max(...items.map(d => d.value), 10);
    const height = 180;
    const width = 500;
    const barWidth = 36;
    const gap = (width - items.length * barWidth) / (items.length + 1);

    let barsSvg = "";
    items.forEach((item, index) => {
      const x = gap + index * (barWidth + gap);
      const barHeight = (item.value / maxVal) * (height - 50);
      const y = height - 30 - barHeight;

      barsSvg += `
        <g class="chart-bar-group">
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="var(--primary)" opacity="0.85">
            <title>${item.label}: ${item.value} Pengajuan</title>
          </rect>
          <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text-primary)">
            ${item.value}
          </text>
          <text x="${x + barWidth / 2}" y="${height - 10}" text-anchor="middle" font-size="11" font-weight="500" fill="var(--text-muted)">
            ${item.label}
          </text>
        </g>
      `;
    });

    el.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;">
        <line x1="0" y1="${height - 28}" x2="${width}" y2="${height - 28}" stroke="var(--border-default)" stroke-width="1" />
        ${barsSvg}
      </svg>
    `;
  },

  /**
   * Render Status Funnel / Progress Distribution
   * @param {string|HTMLElement} container
   * @param {{ approved: number, pending: number, rejected: number, revision: number }} counts
   */
  renderProgressFunnel(container, counts) {
    const el = typeof container === "string" ? document.getElementById(container) : container;
    if (!el) return;

    const total = (counts.approved || 0) + (counts.pending || 0) + (counts.rejected || 0) + (counts.revision || 0) || 1;
    const pApproved = Math.round(((counts.approved || 0) / total) * 100);
    const pPending = Math.round(((counts.pending || 0) / total) * 100);
    const pRevision = Math.round(((counts.revision || 0) / total) * 100);
    const pRejected = Math.round(((counts.rejected || 0) / total) * 100);

    el.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span style="font-weight: 600; color: var(--success);">Disetujui (Approved)</span>
            <span style="font-weight: 700;">${counts.approved || 0} (${pApproved}%)</span>
          </div>
          <div style="height: 8px; background: var(--bg-surface-hover); border-radius: 4px; overflow: hidden;">
            <div style="width: ${pApproved}%; height: 100%; background: var(--success); border-radius: 4px; transition: width 0.6s ease;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span style="font-weight: 600; color: var(--warning);">Menunggu Approval (Pending)</span>
            <span style="font-weight: 700;">${counts.pending || 0} (${pPending}%)</span>
          </div>
          <div style="height: 8px; background: var(--bg-surface-hover); border-radius: 4px; overflow: hidden;">
            <div style="width: ${pPending}%; height: 100%; background: var(--warning); border-radius: 4px; transition: width 0.6s ease;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span style="font-weight: 600; color: #854D0E;">Perlu Revisi (Need Revision)</span>
            <span style="font-weight: 700;">${counts.revision || 0} (${pRevision}%)</span>
          </div>
          <div style="height: 8px; background: var(--bg-surface-hover); border-radius: 4px; overflow: hidden;">
            <div style="width: ${pRevision}%; height: 100%; background: #FACC15; border-radius: 4px; transition: width 0.6s ease;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span style="font-weight: 600; color: var(--danger);">Ditolak (Rejected)</span>
            <span style="font-weight: 700;">${counts.rejected || 0} (${pRejected}%)</span>
          </div>
          <div style="height: 8px; background: var(--bg-surface-hover); border-radius: 4px; overflow: hidden;">
            <div style="width: ${pRejected}%; height: 100%; background: var(--danger); border-radius: 4px; transition: width 0.6s ease;"></div>
          </div>
        </div>
      </div>
    `;
  }
};
