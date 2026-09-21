/**
 * ==========================================================================
 * ENTERPRISE REPORTS & ANALYTICS VIEW
 * File: frontend/js/pages/reports-view.js
 * ==========================================================================
 */

const ReportsView = {
  render() {
    const allRequests = App.getAllRequestsData ? App.getAllRequestsData() : [];
    const container = document.getElementById("reportsContainer");
    if (!container) return;

    // Metrics
    const total = allRequests.length;
    const approved = allRequests.filter(r => r.statusApproval === "Approved").length;
    const rejected = allRequests.filter(r => r.statusApproval === "Rejected").length;
    const revision = allRequests.filter(r => r.statusApproval === "Need Revision").length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    // Breakdown by template
    const templateCounts = {};
    allRequests.forEach(r => {
      const type = r.jenisApproval || "Lainnya";
      templateCounts[type] = (templateCounts[type] || 0) + 1;
    });

    // Breakdown by technician
    const techStats = {};
    allRequests.forEach(r => {
      const tech = r.teknisiPemohon || "Tidak Diketahui";
      if (!techStats[tech]) {
        techStats[tech] = { total: 0, approved: 0, rejected: 0, revision: 0 };
      }
      techStats[tech].total++;
      if (r.statusApproval === "Approved") techStats[tech].approved++;
      if (r.statusApproval === "Rejected") techStats[tech].rejected++;
      if (r.statusApproval === "Need Revision") techStats[tech].revision++;
    });

    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card primary">
          <div class="kpi-card-header">
            <span class="kpi-title">Tingkat Persetujuan</span>
            <div class="kpi-icon" style="background: var(--primary-light); color: var(--primary);">📈</div>
          </div>
          <div class="kpi-value">${approvalRate}%</div>
          <div class="kpi-trend positive">${approved} dari ${total} disetujui</div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-card-header">
            <span class="kpi-title">Rasio Revisi Data</span>
            <div class="kpi-icon" style="background: var(--warning-light); color: var(--warning);">🔄</div>
          </div>
          <div class="kpi-value">${total > 0 ? Math.round((revision / total) * 100) : 0}%</div>
          <div class="kpi-trend neutral">${revision} pengajuan butuh perbaikan</div>
        </div>

        <div class="kpi-card danger">
          <div class="kpi-card-header">
            <span class="kpi-title">Rasio Penolakan</span>
            <div class="kpi-icon" style="background: var(--danger-light); color: var(--danger);">❌</div>
          </div>
          <div class="kpi-value">${total > 0 ? Math.round((rejected / total) * 100) : 0}%</div>
          <div class="kpi-trend negative">${rejected} klaim tidak memenuhi syarat</div>
        </div>

        <div class="kpi-card info">
          <div class="kpi-card-header">
            <span class="kpi-title">Rata-Rata SLA Review</span>
            <div class="kpi-icon" style="background: var(--info-light); color: var(--info);">⏱️</div>
          </div>
          <div class="kpi-value">1.8 Jam</div>
          <div class="kpi-trend positive">Standar target &lt; 4 jam</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-top: 20px;">
        <!-- Breakdown by Template -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Distribusi Kategori Technical Approval</h3>
          </div>
          <div class="table-responsive">
            <table class="enterprise-table">
              <thead>
                <tr>
                  <th>Jenis Approval</th>
                  <th style="text-align: right;">Jumlah</th>
                  <th style="text-align: right;">Persentase</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(templateCounts).map(([type, count]) => `
                  <tr>
                    <td style="font-weight: 600;">${type}</td>
                    <td style="text-align: right; font-weight: 700;">${count}</td>
                    <td style="text-align: right; color: var(--text-muted);">${Math.round((count / total) * 100)}%</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Breakdown by Technician -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Performa Pengajuan per Teknisi</h3>
          </div>
          <div class="table-responsive">
            <table class="enterprise-table">
              <thead>
                <tr>
                  <th>Nama Teknisi</th>
                  <th style="text-align: right;">Total</th>
                  <th style="text-align: right;">Approve</th>
                  <th style="text-align: right;">Revisi</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(techStats).map(([name, stat]) => `
                  <tr>
                    <td style="font-weight: 600;">${name}</td>
                    <td style="text-align: right; font-weight: 700;">${stat.total}</td>
                    <td style="text-align: right; color: var(--success); font-weight: 600;">${stat.approved}</td>
                    <td style="text-align: right; color: #B45309; font-weight: 600;">${stat.revision}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
};
