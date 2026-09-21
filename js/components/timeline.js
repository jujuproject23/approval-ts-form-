/**
 * ==========================================================================
 * ENTERPRISE MULTI-LEVEL APPROVAL TIMELINE COMPONENT
 * File: frontend/js/components/timeline.js
 * ==========================================================================
 */

const TimelineComponent = {
  /**
   * Render multi-level approval history timeline
   * @param {string|HTMLElement} container
   * @param {Object} requestItem
   */
  render(container, requestItem) {
    const el = typeof container === "string" ? document.getElementById(container) : container;
    if (!el || !requestItem) return;

    const approverList = requestItem.approverList || [];
    const status = requestItem.statusApproval || "Pending";

    let itemsHtml = "";

    // 1. Initial Submission by Requester
    itemsHtml += `
      <div class="timeline-item">
        <div class="timeline-dot approved"></div>
        <div class="timeline-card">
          <div class="timeline-header">
            <span class="timeline-role">📝 Tahap 1: Pengajuan Dibuat</span>
            <span class="badge badge-primary">Submitted</span>
          </div>
          <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">
            ${requestItem.teknisiPemohon || "Teknisi"}
          </div>
          <div class="timeline-time">${requestItem.tanggalPengajuan || "-"}</div>
        </div>
      </div>
    `;

    // 2. Approver Steps (Supervisor / Manager / Tim TS)
    if (approverList.length > 0) {
      approverList.forEach((appr, idx) => {
        const decision = appr.decision || "Approved";
        let dotClass = "approved";
        let badgeClass = "badge-success";

        if (decision === "Rejected") {
          dotClass = "rejected";
          badgeClass = "badge-danger";
        } else if (decision === "Need Revision") {
          dotClass = "revision";
          badgeClass = "badge-revision";
        }

        itemsHtml += `
          <div class="timeline-item">
            <div class="timeline-dot ${dotClass}"></div>
            <div class="timeline-card">
              <div class="timeline-header">
                <span class="timeline-role">🔍 Review: ${appr.level || `Approver ${idx + 1}`}</span>
                <span class="badge ${badgeClass}">${decision}</span>
              </div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">
                ${appr.approver_name || appr.approver_id || "Approver"}
              </div>
              <div class="timeline-time">${appr.timestamp || "-"}</div>
              ${appr.notes ? `<div class="timeline-comment">💬 "${appr.notes}"</div>` : ''}
            </div>
          </div>
        `;
      });
    }

    // 3. Current / Next Stage Status
    if (status === "Pending") {
      itemsHtml += `
        <div class="timeline-item">
          <div class="timeline-dot pending"></div>
          <div class="timeline-card" style="border-style: dashed;">
            <div class="timeline-header">
              <span class="timeline-role">⏳ Menunggu Tinjauan Tim TS / Supervisor</span>
              <span class="badge badge-warning">In Review</span>
            </div>
            <div class="hint-text">Menunggu evaluasi teknis dan keputusan otorisasi klaim.</div>
          </div>
        </div>
      `;
    } else if (status === "Approved") {
      itemsHtml += `
        <div class="timeline-item">
          <div class="timeline-dot approved" style="background: var(--success);"></div>
          <div class="timeline-card" style="border-color: rgba(34, 197, 94, 0.3); background: var(--success-light);">
            <div class="timeline-header">
              <span class="timeline-role" style="color: var(--success-text);">🎉 Proses Selesai (Final Approved)</span>
              <span class="badge badge-success">Approved</span>
            </div>
            <div style="font-size: 12px; color: var(--success-text);">
              Pengajuan telah sah dan siap diproses di ISP System Xiaomi.
            </div>
          </div>
        </div>
      `;
    }

    el.innerHTML = `<div class="timeline-container">${itemsHtml}</div>`;
  }
};
