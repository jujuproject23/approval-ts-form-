/**
 * ==========================================================================
 * ENTERPRISE DATA TABLE COMPONENT (Sorting, Filter, Pagination, Export)
 * File: frontend/js/components/datatable.js
 * ==========================================================================
 */

class EnterpriseDataTable {
  constructor(containerId, options = {}) {
    this.container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    this.columns = options.columns || [];
    this.data = options.data || [];
    this.pageSize = options.pageSize || 10;
    this.currentPage = 1;
    this.sortColumn = options.defaultSort || null;
    this.sortDirection = options.defaultSortDir || "asc";
    this.searchQuery = "";
    this.statusFilter = "ALL";
    this.selectedIds = new Set();
    this.onRowClick = options.onRowClick || null;
    this.idField = options.idField || "id";
    this.exportFilename = options.exportFilename || "table-data.csv";

    this.render();
  }

  setData(newData) {
    this.data = newData || [];
    this.currentPage = 1;
    this.selectedIds.clear();
    this.render();
  }

  getFilteredData() {
    return this.data.filter(row => {
      // Status Filter
      if (this.statusFilter !== "ALL") {
        const rowStatus = row.statusApproval || row.statusQc || row.status;
        if (rowStatus !== this.statusFilter) return false;
      }

      // Search Query Filter across all fields
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const match = Object.values(row).some(val => {
          if (val === null || val === undefined) return false;
          if (typeof val === "object") return JSON.stringify(val).toLowerCase().includes(q);
          return String(val).toLowerCase().includes(q);
        });
        if (!match) return false;
      }

      return true;
    });
  }

  getSortedData() {
    const filtered = this.getFilteredData();
    if (!this.sortColumn) return filtered;

    return [...filtered].sort((a, b) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return this.sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return this.sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  getPaginatedData() {
    const sorted = this.getSortedData();
    const start = (this.currentPage - 1) * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
  }

  render() {
    if (!this.container) return;

    const filtered = this.getFilteredData();
    const paginated = this.getPaginatedData();
    const totalPages = Math.ceil(filtered.length / this.pageSize) || 1;

    let html = `
      <div class="datatable-wrapper">
        <!-- Toolbar -->
        <div class="datatable-toolbar">
          <div class="datatable-search-box">
            <span class="datatable-search-icon">🔍</span>
            <input type="text" placeholder="Cari data..." value="${this.searchQuery}" class="dt-search-input">
          </div>

          <div class="datatable-actions">
            <select class="datatable-filter-select dt-status-filter">
              <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>Semua Status</option>
              <option value="Pending" ${this.statusFilter === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Approved" ${this.statusFilter === 'Approved' ? 'selected' : ''}>Approved</option>
              <option value="Rejected" ${this.statusFilter === 'Rejected' ? 'selected' : ''}>Rejected</option>
              <option value="Need Revision" ${this.statusFilter === 'Need Revision' ? 'selected' : ''}>Need Revision</option>
              <option value="QC_Passed" ${this.statusFilter === 'QC_Passed' ? 'selected' : ''}>QC Passed</option>
            </select>

            <button class="btn btn-secondary btn-sm dt-btn-export" title="Unduh ke Excel (.csv)">
              📊 Export Excel
            </button>
            <button class="btn btn-secondary btn-sm dt-btn-print" title="Cetak / Print PDF">
              🖨️ Print
            </button>
          </div>
        </div>

        <!-- Bulk Selection Banner -->
        <div class="datatable-bulk-banner ${this.selectedIds.size > 0 ? 'active' : ''}">
          <span>${this.selectedIds.size} baris terpilih</span>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-sm btn-secondary dt-bulk-clear">Batal Pilih</button>
          </div>
        </div>

        <!-- Table Container -->
        <div class="datatable-container">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">
                  <input type="checkbox" class="table-checkbox dt-select-all" ${this.selectedIds.size > 0 && this.selectedIds.size === paginated.length ? 'checked' : ''}>
                </th>
                ${this.columns.map(col => `
                  <th class="${col.sortable !== false ? 'sortable' : ''}" data-col-key="${col.key}">
                    ${col.label}
                    ${col.sortable !== false ? `
                      <span class="sort-indicator">
                        ${this.sortColumn === col.key ? (this.sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    ` : ''}
                  </th>
                `).join("")}
              </tr>
            </thead>
            <tbody>
              ${paginated.length ? paginated.map(row => {
                const rowId = row[this.idField];
                const isSelected = this.selectedIds.has(rowId);
                return `
                  <tr class="${isSelected ? 'selected' : ''}" data-row-id="${rowId}">
                    <td style="text-align: center;" onclick="event.stopPropagation()">
                      <input type="checkbox" class="table-checkbox dt-row-select" data-id="${rowId}" ${isSelected ? 'checked' : ''}>
                    </td>
                    ${this.columns.map(col => `
                      <td>${col.render ? col.render(row[col.key], row) : (row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '-')}</td>
                    `).join("")}
                  </tr>
                `;
              }).join("") : `
                <tr>
                  <td colspan="${this.columns.length + 1}">
                    <div class="empty-state">
                      <div class="empty-state-icon">📋</div>
                      <div class="empty-state-title">Tidak ada data ditemukan</div>
                      <p class="empty-state-desc">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
                    </div>
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div class="datatable-pagination">
          <div class="page-size-selector">
            <span>Tampilkan</span>
            <select class="datatable-filter-select dt-page-size" style="padding: 4px 8px;">
              <option value="10" ${this.pageSize === 10 ? 'selected' : ''}>10</option>
              <option value="25" ${this.pageSize === 25 ? 'selected' : ''}>25</option>
              <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${this.pageSize === 100 ? 'selected' : ''}>100</option>
            </select>
            <span>baris per halaman (Total ${filtered.length} entri)</span>
          </div>

          <div class="pagination-controls">
            <button class="pagination-btn dt-page-prev" ${this.currentPage <= 1 ? 'disabled' : ''}>&larr; Prev</button>
            <span style="font-weight: 600; padding: 0 8px;">Halaman ${this.currentPage} dari ${totalPages}</span>
            <button class="pagination-btn dt-page-next" ${this.currentPage >= totalPages ? 'disabled' : ''}>Next &rarr;</button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    const root = this.container;

    // Search input
    const searchInput = root.querySelector(".dt-search-input");
    searchInput?.addEventListener("input", (e) => {
      this.searchQuery = e.target.value;
      this.currentPage = 1;
      this.render();
      const updatedInput = root.querySelector(".dt-search-input");
      if (updatedInput) {
        updatedInput.focus();
        updatedInput.setSelectionRange(this.searchQuery.length, this.searchQuery.length);
      }
    });

    // Status filter
    const statusSelect = root.querySelector(".dt-status-filter");
    statusSelect?.addEventListener("change", (e) => {
      this.statusFilter = e.target.value;
      this.currentPage = 1;
      this.render();
    });

    // Export button
    root.querySelector(".dt-btn-export")?.addEventListener("click", () => {
      const exportData = this.getFilteredData().map(row => {
        const item = {};
        this.columns.forEach(col => {
          item[col.label] = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : "";
        });
        return item;
      });
      ExportService.exportToCSV(exportData, this.exportFilename);
    });

    // Print button
    root.querySelector(".dt-btn-print")?.addEventListener("click", () => {
      ExportService.print();
    });

    // Sort headers
    root.querySelectorAll("th.sortable").forEach(th => {
      th.addEventListener("click", () => {
        const key = th.getAttribute("data-col-key");
        if (this.sortColumn === key) {
          this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
        } else {
          this.sortColumn = key;
          this.sortDirection = "asc";
        }
        this.render();
      });
    });

    // Page size
    root.querySelector(".dt-page-size")?.addEventListener("change", (e) => {
      this.pageSize = parseInt(e.target.value, 10);
      this.currentPage = 1;
      this.render();
    });

    // Pagination buttons
    root.querySelector(".dt-page-prev")?.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.render();
      }
    });

    root.querySelector(".dt-page-next")?.addEventListener("click", () => {
      const totalPages = Math.ceil(this.getFilteredData().length / this.pageSize) || 1;
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.render();
      }
    });

    // Select all
    root.querySelector(".dt-select-all")?.addEventListener("change", (e) => {
      const paginated = this.getPaginatedData();
      if (e.target.checked) {
        paginated.forEach(r => this.selectedIds.add(r[this.idField]));
      } else {
        paginated.forEach(r => this.selectedIds.delete(r[this.idField]));
      }
      this.render();
    });

    // Row selection checkboxes
    root.querySelectorAll(".dt-row-select").forEach(chk => {
      chk.addEventListener("change", (e) => {
        const id = chk.getAttribute("data-id");
        if (e.target.checked) {
          this.selectedIds.add(id);
        } else {
          this.selectedIds.delete(id);
        }
        this.render();
      });
    });

    // Clear bulk selection
    root.querySelector(".dt-bulk-clear")?.addEventListener("click", () => {
      this.selectedIds.clear();
      this.render();
    });
  }
}
