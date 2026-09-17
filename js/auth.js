/**
 * ==========================================================================
 * XIAOMI SERVICE CENTER APPROVAL SYSTEM - AUTHENTICATION MODULE
 * File: js/auth.js
 * ==========================================================================
 */

const Auth = {
  getCurrentUser() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(userObj) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(userObj));
  },

  clearSession() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_USER);
  },

  isAuthenticated() {
    return this.getCurrentUser() !== null;
  },

  async login(username, password) {
    if (CONFIG.USE_MOCK) {
      // Login Simulasi Cepat (Mock Mode)
      const user = CONFIG.MOCK_DATA.USERS.find(
        u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password
      );

      if (!user) {
        return { success: false, message: "Username atau password salah (Mock Mode: gunakan budi.teknisi atau agus.ts dengan password: password123)" };
      }

      const userData = {
        userId: user.userId,
        namaLengkap: user.namaLengkap,
        username: user.username,
        role: user.role,
        dashboardTarget: user.role === "Teknisi" ? "TECHNICIAN_PORTAL" : "TIM_TS_PORTAL"
      };

      this.setCurrentUser(userData);
      return { success: true, data: userData };
    }

    // Login Live ke Google Apps Script Web App
    try {
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // text/plain menghindari preflight CORS di Apps Script
        body: JSON.stringify({
          action: "login",
          username: username,
          password: password,
          client_ip: "Browser_Client"
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        this.setCurrentUser(resJson.data);
      }
      return resJson;
    } catch (err) {
      console.error("Login API Error:", err);
      return { success: false, message: "Gagal terhubung ke Google Apps Script: " + err.message };
    }
  },

  logout() {
    this.clearSession();
    window.location.reload();
  }
};
