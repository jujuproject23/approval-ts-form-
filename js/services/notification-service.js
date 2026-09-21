/**
 * ==========================================================================
 * ENTERPRISE NOTIFICATION SERVICE (Toast & In-App Notification Center)
 * File: frontend/js/services/notification-service.js
 * ==========================================================================
 */

const NotificationService = {
  STORAGE_KEY: "enterprise_notifications",
  notifications: [],

  init() {
    this.notifications = StorageService.getItem(this.STORAGE_KEY, [
      {
        id: "notif-1",
        title: "Pengajuan Disetujui",
        message: "Request REQ-20260917-0002 telah disetujui oleh TS Specialist Agus Salim.",
        time: "10 menit lalu",
        read: false,
        type: "success"
      },
      {
        id: "notif-2",
        title: "Tugas QC Baru",
        message: "Unit ASID230726000099 telah selesai repair dan menunggu verifikasi Outbound QC.",
        time: "1 jam lalu",
        read: false,
        type: "warning"
      },
      {
        id: "notif-3",
        title: "SOP QC Diperbarui",
        message: "Format QC Physical Check versi Unicom 21 Agustus 2026 aktif digunakan.",
        time: "1 hari lalu",
        read: true,
        type: "info"
      }
    ]);

    this.updateBadge();
    this.renderDrawer();
  },

  showToast(message, type = "info", duration = 4000) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "warning") icon = "⚠️";

    toast.innerHTML = `
      <span style="font-size: 16px;">${icon}</span>
      <span style="flex: 1;">${message}</span>
      <button style="background:none; border:none; color:inherit; cursor:pointer; font-size:16px; opacity:0.6;" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = "toast-out 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards";
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  },

  addNotification(title, message, type = "info") {
    const newNotif = {
      id: "notif-" + Date.now(),
      title,
      message,
      time: "Baru saja",
      read: false,
      type
    };
    this.notifications.unshift(newNotif);
    this.save();
    this.updateBadge();
    this.renderDrawer();
  },

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.save();
    this.updateBadge();
    this.renderDrawer();
  },

  updateBadge() {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    const badge = document.getElementById("headerNotifBadge");
    if (badge) {
      if (unreadCount > 0) {
        badge.style.display = "block";
      } else {
        badge.style.display = "none";
      }
    }
  },

  renderDrawer() {
    const body = document.getElementById("notificationDrawerBody");
    if (!body) return;

    if (!this.notifications.length) {
      body.innerHTML = `
        <div class="empty-state" style="padding: 30px 10px;">
          <div class="empty-state-icon">🔔</div>
          <div class="empty-state-title">Tidak ada notifikasi</div>
          <p class="empty-state-desc">Semua update aktivitas terbaru akan tampil di sini.</p>
        </div>
      `;
      return;
    }

    body.innerHTML = this.notifications.map(n => `
      <div class="notification-item ${n.read ? '' : 'unread'}" onclick="NotificationService.markAsRead('${n.id}')">
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-message">${n.message}</div>
          <div class="notification-time">${n.time}</div>
        </div>
      </div>
    `).join("");
  },

  markAsRead(id) {
    const item = this.notifications.find(n => n.id === id);
    if (item && !item.read) {
      item.read = true;
      this.save();
      this.updateBadge();
      this.renderDrawer();
    }
  },

  save() {
    StorageService.setItem(this.STORAGE_KEY, this.notifications);
  },

  toggleDrawer() {
    const drawer = document.getElementById("notificationDrawer");
    if (drawer) {
      drawer.classList.toggle("open");
    }
  },

  closeDrawer() {
    const drawer = document.getElementById("notificationDrawer");
    if (drawer) {
      drawer.classList.remove("open");
    }
  }
};
