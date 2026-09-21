/**
 * ==========================================================================
 * ENTERPRISE SIDEBAR NAVIGATION COMPONENT
 * File: frontend/js/components/sidebar.js
 * ==========================================================================
 */

const SidebarComponent = {
  activeView: "dashboard",

  init() {
    this.bindEvents();
    this.renderMenuByRole();
  },

  bindEvents() {
    // Desktop Collapse/Expand Toggle
    document.getElementById("btnSidebarCollapse")?.addEventListener("click", () => {
      const sidebar = document.getElementById("appSidebar");
      sidebar?.classList.toggle("collapsed");
      const isCollapsed = sidebar?.classList.contains("collapsed");
      document.getElementById("btnSidebarCollapse").innerHTML = isCollapsed ? "➡️" : "⬅️";
    });

    // Mobile Menu Toggle
    document.getElementById("btnMobileMenuToggle")?.addEventListener("click", () => {
      document.getElementById("appSidebar")?.classList.add("mobile-open");
      document.getElementById("sidebarBackdrop")?.classList.add("show");
    });

    // Mobile Backdrop Close
    document.getElementById("sidebarBackdrop")?.addEventListener("click", () => {
      document.getElementById("appSidebar")?.classList.remove("mobile-open");
      document.getElementById("sidebarBackdrop")?.classList.remove("show");
    });

    // Menu Item Click Handlers
    document.querySelectorAll("[data-nav-view]").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const viewName = item.getAttribute("data-nav-view");
        this.navigate(viewName);

        // Auto close mobile drawer
        document.getElementById("appSidebar")?.classList.remove("mobile-open");
        document.getElementById("sidebarBackdrop")?.classList.remove("show");
      });
    });
  },

  renderMenuByRole() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Admin-only menu items
    const adminNav = document.querySelectorAll(".nav-admin-only");
    adminNav.forEach(el => {
      el.style.display = Auth.isAdmin() ? "flex" : "none";
    });

    // Reports / Management menu items
    const reportsNav = document.querySelectorAll(".nav-management-only");
    reportsNav.forEach(el => {
      const isMgmt = [Auth.ROLES.ADMINISTRATOR, Auth.ROLES.MANAGER, Auth.ROLES.SUPERVISOR, Auth.ROLES.VIEWER].includes(user.role);
      el.style.display = isMgmt ? "flex" : "none";
    });
  },

  navigate(viewName) {
    this.activeView = viewName;

    // Update active class in sidebar
    document.querySelectorAll("[data-nav-view]").forEach(item => {
      if (item.getAttribute("data-nav-view") === viewName) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Hide all view containers
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.style.display = "none";
    });

    // Show selected view container
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.style.display = "block";
    }

    // Trigger page-specific view load
    if (viewName === "dashboard" && window.DashboardView) {
      DashboardView.render();
    } else if (viewName === "qc-module" && window.App) {
      App.initQCModule();
    } else if (viewName === "tech-approval" && window.App) {
      App.initTechModule(Auth.getCurrentUser());
    } else if (viewName === "all-requests" && window.RequestListView) {
      RequestListView.render();
    } else if (viewName === "reports" && window.ReportsView) {
      ReportsView.render();
    } else if (viewName === "admin" && window.AdminView) {
      AdminView.render();
    } else if (viewName === "profile" && window.ProfileView) {
      ProfileView.render();
    }
  }
};
