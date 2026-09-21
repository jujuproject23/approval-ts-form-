/**
 * ==========================================================================
 * ENTERPRISE THEME MANAGER (Dark & Light Mode Switcher)
 * File: frontend/js/core/theme.js
 * ==========================================================================
 */

const Theme = {
  STORAGE_KEY: "enterprise_app_theme",

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      this.setTheme(saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      this.setTheme(prefersDark ? "dark" : "light");
    }

    // Listen to OS theme changes if user has not explicitly chosen
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.setTheme(e.matches ? "dark" : "light");
        }
      });
    }
  },

  getCurrentTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  },

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.updateToggleIcons(theme);
  },

  toggle() {
    const next = this.getCurrentTheme() === "dark" ? "light" : "dark";
    this.setTheme(next);
  },

  updateToggleIcons(theme) {
    const toggles = document.querySelectorAll(".theme-toggle-btn");
    toggles.forEach(btn => {
      btn.innerHTML = theme === "dark" ? "☀️" : "🌙";
      btn.setAttribute("title", theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode");
    });
  }
};

// Initialize theme on script load
Theme.init();
