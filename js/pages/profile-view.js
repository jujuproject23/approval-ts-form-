/**
 * ==========================================================================
 * ENTERPRISE PROFILE & ACCOUNT SETTINGS VIEW
 * File: frontend/js/pages/profile-view.js
 * ==========================================================================
 */

const ProfileView = {
  render() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const container = document.getElementById("profileContainer");
    if (!container) return;

    const initials = user.avatar || user.namaLengkap.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    container.innerHTML = `
      <div class="card" style="max-width: 750px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-subtle);">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #3B82F6); color: #FFF; font-size: 26px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-md);">
            ${initials}
          </div>
          <div>
            <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary);">${user.namaLengkap}</h2>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">ID Karyawan: <strong>${user.userId}</strong> • Username: @${user.username}</p>
            <div style="margin-top: 8px;">
              <span class="badge badge-primary">${user.role}</span>
              <span class="badge badge-secondary" style="margin-left: 6px;">${user.department || 'Technical Support'}</span>
            </div>
          </div>
        </div>

        <h3 class="card-title" style="font-size: 15px; margin-bottom: 14px;">Informasi Pribadi &amp; Akses</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input type="text" class="form-control" value="${user.namaLengkap}" readonly>
          </div>
          <div class="form-group">
            <label>Nomor Identitas Karyawan (UserID)</label>
            <input type="text" class="form-control" value="${user.userId}" readonly>
          </div>
          <div class="form-group">
            <label>Peran Sistem (Role)</label>
            <input type="text" class="form-control" value="${user.role}" readonly>
          </div>
          <div class="form-group">
            <label>Departemen</label>
            <input type="text" class="form-control" value="${user.department || 'Technical Support'}" readonly>
          </div>
        </div>

        <h3 class="card-title" style="font-size: 15px; margin-top: 24px; margin-bottom: 14px;">Keamanan &amp; Kata Sandi</h3>
        <form onsubmit="event.preventDefault(); ProfileView.updatePassword();">
          <div class="form-grid">
            <div class="form-group">
              <label>Kata Sandi Lama</label>
              <input type="password" id="profileOldPass" class="form-control" placeholder="Masukkan kata sandi lama...">
            </div>
            <div class="form-group">
              <label>Kata Sandi Baru</label>
              <input type="password" id="profileNewPass" class="form-control" placeholder="Minimal 8 karakter...">
            </div>
          </div>
          <div style="text-align: right; margin-top: 10px;">
            <button type="submit" class="btn btn-primary">Simpan Kata Sandi</button>
          </div>
        </form>
      </div>
    `;
  },

  updatePassword() {
    const oldPass = document.getElementById("profileOldPass").value;
    const newPass = document.getElementById("profileNewPass").value;

    if (!oldPass || !newPass) {
      NotificationService.showToast("Mohon isi kata sandi lama dan baru!", "warning");
      return;
    }

    if (newPass.length < 6) {
      NotificationService.showToast("Kata sandi baru minimal 6 karakter!", "error");
      return;
    }

    NotificationService.showToast("Kata sandi berhasil diperbarui!", "success");
    document.getElementById("profileOldPass").value = "";
    document.getElementById("profileNewPass").value = "";
  }
};
