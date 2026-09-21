/**
 * ==========================================================================
 * ENTERPRISE EXPORT SERVICE (Excel/CSV & PDF/Print)
 * File: frontend/js/services/export-service.js
 * ==========================================================================
 */

const ExportService = {
  /**
   * Export an array of objects to Excel-compatible CSV file
   * @param {Array<Object>} data
   * @param {string} filename
   * @param {Array<string>} headers
   */
  exportToCSV(data, filename = "export-data.csv", headers = null) {
    if (!data || !data.length) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    const columnKeys = headers || Object.keys(data[0]);
    let csvContent = "\uFEFF"; // UTF-8 BOM for Microsoft Excel compatibility

    // Header row
    csvContent += columnKeys.map(k => `"${k.replace(/"/g, '""')}"`).join(",") + "\r\n";

    // Data rows
    data.forEach(row => {
      const line = columnKeys.map(key => {
        let val = row[key];
        if (val === undefined || val === null) {
          val = "";
        } else if (typeof val === "object") {
          val = JSON.stringify(val);
        } else {
          val = String(val);
        }
        return `"${val.replace(/"/g, '""')}"`;
      }).join(",");
      csvContent += line + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Print preview formatted document
   */
  print() {
    window.print();
  }
};
