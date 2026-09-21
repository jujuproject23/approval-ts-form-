/**
 * ==========================================================================
 * ENTERPRISE AUDIT TRAIL SERVICE (Activity Logging)
 * File: frontend/js/services/audit-service.js
 * ==========================================================================
 */

const AuditService = {
  STORAGE_KEY: "enterprise_audit_logs",

  getLogs() {
    return StorageService.getItem(this.STORAGE_KEY, [
      {
        id: "AUD-001",
        timestamp: "2026-09-17 09:15:20",
        user: "Budi Santoso (TEK-001)",
        role: "Requester",
        action: "CREATE_REQUEST",
        targetId: "REQ-20260917-0001",
        details: "Pengajuan Technical: Case Battery Kembung (Xiaomi 14 Ultra)"
      },
      {
        id: "AUD-002",
        timestamp: "2026-09-17 13:00:15",
        user: "Agus Salim (TS-001)",
        role: "Approver",
        action: "APPROVE_REQUEST",
        targetId: "REQ-20260917-0002",
        details: "Disetujui: DOA Part (Redmi Note 13 Pro 5G)"
      },
      {
        id: "AUD-003",
        timestamp: "2026-08-21 08:45:10",
        user: "Budi Santoso (TEK-001)",
        role: "Requester",
        action: "SUBMIT_INBOUND_QC",
        targetId: "QC-20260821-0001",
        details: "Inbound QC ASID230726000002 dengan dual ttd Teknisi A & Customer"
      },
      {
        id: "AUD-004",
        timestamp: "2026-08-21 11:10:05",
        user: "Siti Rahma (TEK-002)",
        role: "Requester",
        action: "SUBMIT_OUTBOUND_QC",
        targetId: "QC-20260821-0001",
        details: "Outbound QC lolos 4 checklist dan verifikasi silang selesai"
      }
    ]);
  },

  log(action, targetId, details) {
    const user = Auth.getCurrentUser();
    const newEntry = {
      id: "AUD-" + Date.now().toString().slice(-6),
      timestamp: new Date().toLocaleString("id-ID"),
      user: user ? `${user.namaLengkap} (${user.userId})` : "Anonymous",
      role: user ? user.role : "Guest",
      action,
      targetId: targetId || "-",
      details: details || ""
    };

    const logs = this.getLogs();
    logs.unshift(newEntry);
    StorageService.setItem(this.STORAGE_KEY, logs);

    // If live API configured, send asynchronously without blocking
    if (!CONFIG.USE_MOCK && CONFIG.APPS_SCRIPT_URL) {
      try {
        fetch(CONFIG.APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "log_audit",
            ...newEntry
          })
        }).catch(err => console.warn("Live audit log failed:", err));
      } catch (e) {
        // ignore
      }
    }
  }
};
