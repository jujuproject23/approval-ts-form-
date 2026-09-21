/**
 * ==========================================================================
 * ENTERPRISE REQUEST LIST VIEW (Global Data Table & Advanced Filters)
 * File: frontend/js/pages/request-list-view.js
 * ==========================================================================
 */

const RequestListView = {
  dataTable: null,

  render() {
    const container = document.getElementById("requestListTableContainer");
    if (!container) return;

    const allRequests = App.getAllRequestsData ? App.getAllRequestsData() : [];

    const columns = [
      {
        key: "requestId",
        label: "No. Request",
        sortable: true,
        render: (val) => `<strong style="color: var(--primary);">${val}</strong>`
      },
      {
        key: "tanggalPengajuan",
        label: "Tanggal Pengajuan",
        sortable: true
      },
      {
        key: "srNumber",
        label: "Nomor SR",
        sortable: true,
        render: (val) => val || "-"
      },
      {
        key: "modelType",
        label: "Model & IMEI",
        sortable: true,
        render: (val, row) => `
          <div>
            <div style="font-weight: 600;">${val || '-'}</div>
            <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${row.imei || '-'}</div>
          </div>
        `
      },
      {
        key: "jenisApproval",
        label: "Jenis Approval",
        sortable: true,
        render: (val) => `<span style="font-weight: 600;">${val}</span>`
      },
      {
        key: "teknisiPemohon",
        label: "Teknisi Pemohon",
        sortable: true,
        render: (val) => val ? val.split("(")[0].trim() : "-"
      },
      {
        key: "statusApproval",
        label: "Status",
        sortable: true,
        render: (val) => {
          const cls = (val || "pending").toLowerCase().replace(/ /g, "-");
          return `<span class="badge badge-${cls}">${val}</span>`;
        }
      },
      {
        key: "actions",
        label: "Aksi",
        sortable: false,
        render: (val, row) => `
          <div class="row-actions">
            <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetail('${row.requestId}')" title="Buka Detail">
              🔍 Detail
            </button>
            ${row.pdfReportUrl ? `
              <a href="${row.pdfReportUrl}" target="_blank" class="btn btn-sm btn-secondary" title="Unduh PDF Resmi">
                📄 PDF
              </a>
            ` : ''}
          </div>
        `
      }
    ];

    if (!this.dataTable) {
      this.dataTable = new EnterpriseDataTable(container, {
        columns: columns,
        data: allRequests,
        idField: "requestId",
        pageSize: 10,
        defaultSort: "tanggalPengajuan",
        defaultSortDir: "desc",
        exportFilename: `Technical-Approval-Requests-${new Date().toISOString().slice(0, 10)}.csv`
      });
    } else {
      this.dataTable.setData(allRequests);
    }
  },

  refresh() {
    if (App.refreshAllData) {
      App.refreshAllData().then(() => this.render());
    } else {
      this.render();
    }
  }
};
