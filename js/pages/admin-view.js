/**
 * ==========================================================================
 * ENTERPRISE ADMIN MANAGEMENT VIEW (Users, Roles, Departments, Matrix)
 * File: frontend/js/pages/admin-view.js
 * ==========================================================================
 */

const AdminView = {
  render() {
    const container = document.getElementById("adminContainer");
    if (!container) return;

    const users = CONFIG.MOCK_DATA.USERS;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">👥 Manajemen Akun Pengguna &amp; Peran Enterprise</h2>
            <p class="hint-text">Kelola hak akses 6 peran enterprise (Administrator, Supervisor, Manager, Requester, Approver, Viewer).</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AdminView.openAddUserModal()">
            ➕ Tambah Pengguna Baru
          </button>
        </div>

        <div class="table-responsive">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Nama Lengkap</th>
                <th>Username</th>
                <th>Peran (Role)</th>
                <th>Departemen</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${users.map((u, idx) => `
                <tr>
                  <td style="font-family: var(--font-mono); font-weight: 600;">${u.userId}</td>
                  <td style="font-weight: 600;">${u.namaLengkap}</td>
                  <td>${u.username}</td>
                  <td>
                    <span class="badge ${u.role === 'Administrator' ? 'badge-danger' : (u.role.includes('TS') || u.role === 'Approver' ? 'badge-primary' : 'badge-secondary')}">
                      ${u.role}
                    </span>
                  </td>
                  <td>${u.department || 'Technical Support'}</td>
                  <td>
                    <span class="badge ${u.status === 'Aktif' ? 'badge-success' : 'badge-danger'}">${u.status}</span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-ghost" onclick="AdminView.toggleUserStatus(${idx})" title="Ubah Status">
                      ${u.status === 'Aktif' ? '🔴 Nonaktifkan' : '🟢 Aktifkan'}
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Workflow Approval Matrix Card -->
      <div class="card" style="margin-top: 24px;">
        <div class="card-header">
          <div>
            <h2 class="card-title">⚙️ Matriks Alur Persetujuan Bertingkat (Workflow Matrix)</h2>
            <p class="hint-text">Konfigurasi hierarki persetujuan otomatis berdasarkan jenis pengajuan dan estimasi biaya.</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>Jenis Approval / Kategori</th>
                <th>Tahap 1 (Pemohon)</th>
                <th>Tahap 2 (Review Awal)</th>
                <th>Tahap 3 (Final Otorisasi)</th>
                <th>SLA Target</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 600;">DOA Part (Standard)</td>
                <td>Teknisi / Requester</td>
                <td>Tim TS (Approver)</td>
                <td>Otomatis Disetujui</td>
                <td>&lt; 2 Jam</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">DOA Part Mainboard (Tukar IMEI)</td>
                <td>Teknisi / Requester</td>
                <td>Supervisor Service</td>
                <td>Manager Operasional</td>
                <td>&lt; 4 Jam</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">PPI (Product Problem / Tukar Unit)</td>
                <td>Teknisi / Requester</td>
                <td>Supervisor Service</td>
                <td>Manager Operasional + TS Lead</td>
                <td>&lt; 24 Jam</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Case Battery Kembung (Hazmat)</td>
                <td>Teknisi / Requester</td>
                <td>Tim TS (Approver)</td>
                <td>Supervisor Safety</td>
                <td>&lt; 2 Jam</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">SOP QC Physical Check (Inbound/Outbound)</td>
                <td>Teknisi A (Repair) + Customer</td>
                <td>Teknisi B (QC Cross-Check)</td>
                <td>Lolos Standar Syarat RRR</td>
                <td>&lt; 1 Jam</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  toggleUserStatus(idx) {
    const user = CONFIG.MOCK_DATA.USERS[idx];
    if (user) {
      user.status = user.status === "Aktif" ? "Non-Aktif" : "Aktif";
      AuditService.log("USER_STATUS_CHANGE", user.userId, `Status diubah menjadi ${user.status}`);
      NotificationService.showToast(`Status ${user.namaLengkap} diubah menjadi ${user.status}`, "info");
      this.render();
    }
  },

  openAddUserModal() {
    const nama = prompt("Nama Lengkap Pengguna:");
    if (!nama) return;
    const username = prompt("Username login (contoh: dimas.spv):");
    if (!username) return;
    const role = prompt("Role (Administrator, Supervisor, Manager, Teknisi, Tim_TS, Viewer):", "Teknisi");
    if (!role) return;

    const newUser = {
      userId: "USR-" + Math.floor(100 + Math.random() * 900),
      namaLengkap: nama,
      username: username.toLowerCase().trim(),
      password: "password123",
      role: role,
      department: "Technical Service",
      status: "Aktif"
    };

    CONFIG.MOCK_DATA.USERS.push(newUser);
    AuditService.log("ADD_USER", newUser.userId, `Pengguna baru ditambahkan: ${newUser.namaLengkap} (${newUser.role})`);
    NotificationService.showToast(`Pengguna ${nama} berhasil ditambahkan!`, "success");
    this.render();
  }
};
