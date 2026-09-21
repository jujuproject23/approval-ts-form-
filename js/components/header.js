/**
 * ==========================================================================
 * ENTERPRISE HEADER COMPONENT (Global Search, Notifications, Theme, Profile)
 * File: frontend/js/components/header.js
 * ==========================================================================
 */

const HeaderComponent = {
  init() {
    this.bindEvents();
    this.renderUserInfo();
  },

  bindEvents() {
    // Keyboard shortcut for Global Search (Ctrl+K / Cmd+K)
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        this.openSearchModal();
      }
      if (e.key === "Escape") {
        this.closeSearchModal();
        this.closeProfileMenu();
        NotificationService.closeDrawer();
      }
    });

    // Global Search Triggers
    document.getElementById("btnGlobalSearch")?.addEventListener("click", () => this.openSearchModal());
    document.getElementById("btnSearchModalClose")?.addEventListener("click", () => this.closeSearchModal());
    document.getElementById("globalSearchBackdrop")?.addEventListener("click", (e) => {
      if (e.target.id === "globalSearchBackdrop") this.closeSearchModal();
    });

    // Theme Toggle Button
    document.getElementById("btnThemeToggle")?.addEventListener("click", () => {
      Theme.toggle();
    });

    // Notification Bell Trigger
    document.getElementById("btnNotificationBell")?.addEventListener("click", (e) => {
      e.stopPropagation();
      NotificationService.toggleDrawer();
    });
    document.getElementById("btnCloseNotificationDrawer")?.addEventListener("click", () => {
      NotificationService.closeDrawer();
    });
    document.getElementById("btnMarkAllNotifsRead")?.addEventListener("click", () => {
      NotificationService.markAllAsRead();
    });

    // Profile Dropdown Trigger
    const profileTrigger = document.getElementById("userProfileTrigger");
    const profileMenu = document.getElementById("userProfileMenu");

    profileTrigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu?.classList.toggle("show");
    });

    // Close menus on click outside
    document.addEventListener("click", (e) => {
      if (!profileTrigger?.contains(e.target) && !profileMenu?.contains(e.target)) {
        this.closeProfileMenu();
      }
      const notifDrawer = document.getElementById("notificationDrawer");
      const notifBell = document.getElementById("btnNotificationBell");
      if (notifDrawer?.classList.contains("open") && !notifDrawer.contains(e.target) && !notifBell?.contains(e.target)) {
        NotificationService.closeDrawer();
      }
    });

    // Search Input Field
    const searchInput = document.getElementById("globalSearchInput");
    searchInput?.addEventListener("input", (e) => {
      this.handleSearchInput(e.target.value);
    });
  },

  renderUserInfo() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const avatarEl = document.getElementById("headerUserAvatar");
    const nameEl = document.getElementById("headerUserName");
    const roleEl = document.getElementById("headerUserRole");
    const dropdownNameEl = document.getElementById("dropdownUserName");
    const dropdownRoleEl = document.getElementById("dropdownUserRole");

    const initials = user.avatar || user.namaLengkap.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = user.namaLengkap;
    if (roleEl) roleEl.textContent = user.role;
    if (dropdownNameEl) dropdownNameEl.textContent = user.namaLengkap;
    if (dropdownRoleEl) dropdownRoleEl.textContent = `${user.role} • ${user.department || 'Xiaomi'}`;
  },

  closeProfileMenu() {
    document.getElementById("userProfileMenu")?.classList.remove("show");
  },

  openSearchModal() {
    const backdrop = document.getElementById("globalSearchBackdrop");
    const input = document.getElementById("globalSearchInput");
    if (backdrop) {
      backdrop.classList.add("show");
      setTimeout(() => input?.focus(), 50);
      this.handleSearchInput(input ? input.value : "");
    }
  },

  closeSearchModal() {
    document.getElementById("globalSearchBackdrop")?.classList.remove("show");
  },

  handleSearchInput(query) {
    const resultsContainer = document.getElementById("globalSearchResults");
    if (!resultsContainer) return;

    const q = (query || "").trim().toLowerCase();
    const allRequests = App.getAllRequestsData ? App.getAllRequestsData() : [];
    const allQc = App.getAllQcData ? App.getAllQcData() : [];

    let filteredReq = allRequests.filter(r => 
      r.requestId.toLowerCase().includes(q) ||
      (r.srNumber && r.srNumber.toLowerCase().includes(q)) ||
      (r.modelType && r.modelType.toLowerCase().includes(q)) ||
      (r.imei && r.imei.includes(q)) ||
      (r.teknisiPemohon && r.teknisiPemohon.toLowerCase().includes(q))
    ).slice(0, 5);

    let filteredQc = allQc.filter(qc =>
      qc.qcId.toLowerCase().includes(q) ||
      qc.asid.toLowerCase().includes(q) ||
      qc.model.toLowerCase().includes(q) ||
      qc.namaCustomer.toLowerCase().includes(q)
    ).slice(0, 5);

    if (!filteredReq.length && !filteredQc.length) {
      resultsContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
          Tidak ditemukan hasil untuk "<strong>${query}</strong>"
        </div>
      `;
      return;
    }

    let html = "";
    if (filteredReq.length) {
      html += `<div style="font-size: 11px; font-weight: 700; color: var(--text-muted); padding: 6px 12px; text-transform: uppercase;">Technical Requests</div>`;
      filteredReq.forEach(r => {
        html += `
          <div class="search-result-item" onclick="HeaderComponent.onSelectSearchResult('request', '${r.requestId}')">
            <div>
              <div style="font-weight: 600; font-size: 13px;">${r.requestId} <span style="font-size: 11px; color: var(--text-muted);">(${r.srNumber || '-'})</span></div>
              <div style="font-size: 11px; color: var(--text-muted);">${r.modelType} • ${r.jenisApproval}</div>
            </div>
            <span class="badge badge-${r.statusApproval.toLowerCase().replace(/ /g, '-')}">${r.statusApproval}</span>
          </div>
        `;
      });
    }

    if (filteredQc.length) {
      html += `<div style="font-size: 11px; font-weight: 700; color: var(--text-muted); padding: 10px 12px 6px; text-transform: uppercase;">SOP QC Physical Logs</div>`;
      filteredQc.forEach(qc => {
        html += `
          <div class="search-result-item" onclick="HeaderComponent.onSelectSearchResult('qc', '${qc.qcId}')">
            <div>
              <div style="font-weight: 600; font-size: 13px;">${qc.qcId} <span style="font-size: 11px; color: #C53030;">[${qc.asid}]</span></div>
              <div style="font-size: 11px; color: var(--text-muted);">${qc.model} • Cust: ${qc.namaCustomer}</div>
            </div>
            <span class="badge ${qc.statusQc === 'QC_Passed' ? 'badge-success' : 'badge-warning'}">${qc.statusQc}</span>
          </div>
        `;
      });
    }

    resultsContainer.innerHTML = html;
  },

  onSelectSearchResult(type, id) {
    this.closeSearchModal();
    if (type === "request") {
      SidebarComponent.navigate("all-requests");
      setTimeout(() => {
        const searchInput = document.querySelector("#allRequestsTable input");
        if (searchInput) {
          searchInput.value = id;
          searchInput.dispatchEvent(new Event("input"));
        }
      }, 100);
    } else if (type === "qc") {
      SidebarComponent.navigate("qc-module");
    }
  }
};
