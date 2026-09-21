/**
 * ==========================================================================
 * ENTERPRISE STORAGE & AUTO-SAVE SERVICE
 * File: frontend/js/services/storage-service.js
 * ==========================================================================
 */

const StorageService = {
  DRAFT_PREFIX: "draft_form_",

  // Save form draft to localStorage
  saveDraft(formKey, data) {
    try {
      const payload = {
        data: data,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(this.DRAFT_PREFIX + formKey, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.warn("Auto-save draft failed:", e);
      return false;
    }
  },

  // Get form draft
  getDraft(formKey) {
    try {
      const raw = localStorage.getItem(this.DRAFT_PREFIX + formKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  // Clear form draft
  clearDraft(formKey) {
    try {
      localStorage.removeItem(this.DRAFT_PREFIX + formKey);
    } catch (e) {
      console.warn("Clear draft failed:", e);
    }
  },

  // Generic JSON get/set
  getItem(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },

  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  }
};
