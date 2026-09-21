/**
 * ==========================================================================
 * ENTERPRISE AUTHENTICATION & RBAC MODULE
 * File: frontend/js/auth.js
 * ==========================================================================
 * Mendukung 6 Peran Enterprise:
 * 1. Administrator (Akses penuh ke seluruh modul & admin settings)
 * 2. Supervisor    (Review level 1 / persetujuan awal)
 * 3. Manager       (Review level 2 / eskalasi & biaya tinggi)
 * 4. Requester     (Mengajukan form teknis & Inbound QC - kompatibel Teknisi)
 * 5. Approver      (Verifikasi teknis - kompatibel Tim_TS)
 * 6. Viewer        (Read-only laporan & audit trail)
 */

const Auth = {
  // 6 Definisi Role Enterprise
  ROLES: {
    ADMINISTRATOR: "Administrator",
    SUPERVISOR: "Supervisor",
    MANAGER: "Manager",
    REQUESTER: "Requester",
    APPROVER: "Approver",
    VIEWER: "Viewer",

    // Backward compatibility aliases
    TEKNISI: "Teknisi",
    TIM_TS: "Tim_TS"
  },

  getCurrentUser() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_USER) || sessionStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(userObj, rememberMe = true) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(userObj));
  },

  clearSession() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_USER);
    sessionStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_USER);
  },

  isAuthenticated() {
    return this.getCurrentUser() !== null;
  },

  // Role Checking Helpers
  hasRole(allowedRoles) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === this.ROLES.ADMINISTRATOR) return true; // Super admin always has access
    return allowedRoles.includes(user.role);
  },

  isRequester() {
    const user = this.getCurrentUser();
    if (!user) return false;
    return [this.ROLES.REQUESTER, this.ROLES.TEKNISI, this.ROLES.ADMINISTRATOR].includes(user.role);
  },

  isApprover() {
    const user = this.getCurrentUser();
    if (!user) return false;
    return [this.ROLES.APPROVER, this.ROLES.SUPERVISOR, this.ROLES.MANAGER, this.ROLES.TIM_TS, this.ROLES.ADMINISTRATOR].includes(user.role);
  },

  isAdmin() {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.role === this.ROLES.ADMINISTRATOR;
  },

  // Login handler
  async login(username, password, rememberMe = true) {
    if (CONFIG.USE_MOCK) {
      // Mock Login
      const user = CONFIG.MOCK_DATA.USERS.find(
        u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password
      );

      if (!user) {
        return {
          success: false,
          message: "Username atau password salah! Demo: budi.teknisi, agus.ts, atau admin dengan password: password123"
        };
      }

      // Normalize role
      let normalizedRole = user.role;
      if (user.role === "Teknisi") normalizedRole = this.ROLES.REQUESTER;
      if (user.role === "Tim_TS") normalizedRole = this.ROLES.APPROVER;

      const userData = {
        userId: user.userId,
        namaLengkap: user.namaLengkap,
        username: user.username,
        role: user.role, // preserve original
        enterpriseRole: normalizedRole,
        department: user.department || "Technical Support",
        avatar: user.avatar || user.namaLengkap.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
      };

      this.setCurrentUser(userData, rememberMe);
      AuditService.log("LOGIN", userData.userId, `Login sukses sebagai ${userData.role}`);
      return { success: true, data: userData };
    }

    // Live Apps Script Login
    try {
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "login",
          username: username,
          password: password,
          client_ip: "Browser_Enterprise"
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        let normalizedRole = resJson.data.role;
        if (resJson.data.role === "Teknisi") normalizedRole = this.ROLES.REQUESTER;
        if (resJson.data.role === "Tim_TS") normalizedRole = this.ROLES.APPROVER;

        resJson.data.enterpriseRole = normalizedRole;
        resJson.data.avatar = resJson.data.namaLengkap.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
        this.setCurrentUser(resJson.data, rememberMe);
        AuditService.log("LOGIN", resJson.data.userId, `Login sukses sebagai ${resJson.data.role}`);
      }
      return resJson;
    } catch (err) {
      console.error("Login API Error:", err);
      return { success: false, message: "Gagal terhubung ke Google Apps Script: " + err.message };
    }
  },

  logout() {
    const user = this.getCurrentUser();
    if (user) {
      AuditService.log("LOGOUT", user.userId, "Pengguna keluar dari aplikasi");
    }
    this.clearSession();
    window.location.reload();
  }
};
