/**
 * ==========================================================================
 * ENTERPRISE DASHBOARD VIEW (Executive & Operational KPIs, Charts, Tasks)
 * File: frontend/js/pages/dashboard-view.js
 * ==========================================================================
 */

const DashboardView = {
  render() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const allRequests = App.getAllRequestsData ? App.getAllRequestsData() : [];
    const allQc = App.getAllQcData ? App.getAllQcData() : [];

    // Calculate KPI metrics
    const totalRequests = allRequests.length;
    const waitingApproval = allRequests.filter(r => r.statusApproval === "Pending").length;
    const approvedRequests = allRequests.filter(r => r.statusApproval === "Approved").length;
    const rejectedRequests = allRequests.filter(r => r.statusApproval === "Rejected").length;
    const needRevision = allRequests.filter(r => r.statusApproval === "Need Revision").length;
    const totalQc = allQc.length;

    // Render KPI Metrics
    const kpiContainer = document.getElementById("dashboardKpiContainer");
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="kpi-card primary">
          <div class="kpi-card-header">
            <span class="kpi-title">Total Pengajuan</span>
            <div class="kpi-icon" style="background: var(--primary-light); color: var(--primary);">📋</div>
          </div>
          <div class="kpi-value">${totalRequests}</div>
          <div class="kpi-trend positive">↑ Aktif di sistem</div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-card-header">
            <span class="kpi-title">Menunggu Approval</span>
            <div class="kpi-icon" style="background: var(--warning-light); color: var(--warning);">⏳</div>
          </div>
          <div class="kpi-value">${waitingApproval}</div>
          <div class="kpi-trend neutral">Memerlukan aksi</div>
        </div>

        <div class="kpi-card success">
          <div class="kpi-card-header">
            <span class="kpi-title">Disetujui (Approved)</span>
            <div class="kpi-icon" style="background: var(--success-light); color: var(--success);">✅</div>
          </div>
          <div class="kpi-value">${approvedRequests}</div>
          <div class="kpi-trend positive">Siap klaim ISP</div>
        </div>

        <div class="kpi-card danger">
          <div class="kpi-card-header">
            <span class="kpi-title">Ditolak / Revisi</span>
            <div class="kpi-icon" style="background: var(--danger-light); color: var(--danger);">⚠️</div>
          </div>
          <div class="kpi-value">${rejectedRequests + needRevision}</div>
          <div class="kpi-trend negative">${needRevision} Perlu Revisi</div>
        </div>

        <div class="kpi-card info">
          <div class="kpi-card-header">
            <span class="kpi-title">SOP QC Physical</span>
            <div class="kpi-icon" style="background: var(--info-light); color: var(--info);">🔍</div>
          </div>
          <div class="kpi-value">${totalQc}</div>
          <div class="kpi-trend positive">Dokumen RRR</div>
        </div>
      `;
    }

    // Render Charts
    ChartComponent.renderMonthlyTrendChart("dashboardTrendChart");
    ChartComponent.renderProgressFunnel("dashboardProgressFunnel", {
      approved: approvedRequests,
      pending: waitingApproval,
      rejected: rejectedRequests,
      revision: needRevision
    });

    // Render Recent Activities (Audit Trail)
    this.renderRecentActivities();

    // Render Pending Action Tasks for Current User
    this.renderPendingTasks(user, allRequests);
  },

  renderRecentActivities() {
    const listEl = document.getElementById("dashboardActivityList");
    if (!listEl) return;

    const logs = AuditService.getLogs().slice(0, 6);
    if (!logs.length) {
      listEl.innerHTML = `<div class="hint-text">Belum ada aktivitas tercatat.</div>`;
      return;
    }

    listEl.innerHTML = logs.map(log => `
      <div style="display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
        <div style="font-size: 18px;">🔹</div>
        <div style="flex: 1;">
          <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">
            ${log.user} <span style="font-weight: 400; color: var(--text-muted);">(${log.action})</span>
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
            ${log.details}
          </div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">
            ${log.timestamp} • Target: ${log.targetId}
          </div>
        </div>
      </div>
    `).join("");
  },

  renderPendingTasks(user, allRequests) {
    const tableBody = document.getElementById("dashboardPendingTableBody");
    if (!tableBody) return;

    let pendingList = [];
    if (Auth.isApprover()) {
      // Approver sees all pending requests
      pendingList = allRequests.filter(r => r.statusApproval === "Pending").slice(0, 5);
    } else {
      // Requester sees their own pending or need revision requests
      pendingList = allRequests.filter(r => 
        (r.statusApproval === "Pending" || r.statusApproval === "Need Revision") &&
        r.teknisiPemohon && r.teknisiPemohon.includes(user.userId)
      ).slice(0, 5);
    }

    if (!pendingList.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
            🎉 Tidak ada tugas tertunda saat ini.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = pendingList.map(r => `
      <tr>
        <td style="font-weight: 600;">${r.requestId}</td>
        <td>${r.srNumber || '-'}</td>
        <td>${r.modelType} <span style="font-size: 11px; color: var(--text-muted);">(${r.jenisApproval})</span></td>
        <td><span class="badge badge-${r.statusApproval.toLowerCase().replace(/ /g, '-')}">${r.statusApproval}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetail('${r.requestId}')">
            🔍 Buka
          </button>
        </td>
      </tr>
    `).join("");
  }
};
