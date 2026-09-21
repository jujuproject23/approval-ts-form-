/**
 * ==========================================================================
 * ENTERPRISE FORM TEMPLATES & DRAFT ENGINE (5 Technical Templates)
 * File: frontend/js/templates.js
 * ==========================================================================
 */

const FormTemplates = {
  /**
   * Auto-generate enterprise standard request ID: TS-YYYY-XXXXXX
   */
  generateRequestId() {
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    return `TS-${year}-${randomSeq}`;
  },

  // 1. Render Form Field sesuai Jenis Approval yang dipilih
  render(templateName, container) {
    if (!container) return;

    let html = "";
    switch (templateName) {
      case "DOA Part":
        html = `
          <div class="card" style="background: var(--bg-surface); border-left: 4px solid var(--primary); margin-top: 16px;">
            <div class="card-header">
              <h4 class="card-title" style="font-size: 14px; color: var(--primary);">
                📦 Spesifikasi Form: DOA Part Baru (Dead on Arrival)
              </h4>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Nomor Part (Part Number) <span class="required">*</span></label>
                <input type="text" id="tpl_part_number" class="form-control" placeholder="Contoh: 508000012900" required>
              </div>
              <div class="form-group">
                <label>Deskripsi Sparepart</label>
                <input type="text" id="tpl_part_desc" class="form-control" placeholder="Contoh: SUB_BOARD_FPC_CHARGING">
              </div>
              <div class="form-group">
                <label>Nomor Batch / Lot</label>
                <input type="text" id="tpl_lot_number" class="form-control" placeholder="Contoh: LOT-2026-08A">
              </div>
              <div class="form-group">
                <label>Kondisi Segel Part Baru</label>
                <select id="tpl_segel_status" class="form-control">
                  <option value="Utuh Segel Pabrik">Utuh Segel Pabrik</option>
                  <option value="Sudah Terbuka">Sudah Terbuka saat Diterima</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Detail Gejala Kerusakan Part Baru <span class="required">*</span></label>
              <textarea id="tpl_gejala_doa" class="form-control" placeholder="Jelaskan cacat fisik / elektrikal part saat pertama kali dibuka..." required></textarea>
            </div>
          </div>
        `;
        break;

      case "DOA Part Mainboard":
        html = `
          <div class="card" style="background: var(--bg-surface); border-left: 4px solid var(--primary); margin-top: 16px;">
            <div class="card-header">
              <h4 class="card-title" style="font-size: 14px; color: var(--primary);">
                ⚡ Spesifikasi Form: Penggantian Motherboard (DOA Mainboard &amp; IMEI)
              </h4>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>IMEI Board Baru <span class="required">*</span></label>
                <input type="text" id="tpl_imei_baru" class="form-control" placeholder="15 digit IMEI motherboard baru" required>
              </div>
              <div class="form-group">
                <label>Serial Number (SN) Board Baru</label>
                <input type="text" id="tpl_sn_baru" class="form-control" placeholder="Contoh: 31245/B0098765">
              </div>
              <div class="form-group">
                <label>Diagnosa Konsumsi Arus (Power Supply)</label>
                <input type="text" id="tpl_arus" class="form-control" placeholder="Contoh: Short 0.00A / No Power">
              </div>
              <div class="form-group">
                <label>Status CIT Hardware Test</label>
                <select id="tpl_cit_test" class="form-control">
                  <option value="PASS (Lulus Pengujian)">PASS (Lulus Pengujian)</option>
                  <option value="FAIL (Gagal Sebagian)">FAIL (Gagal Sebagian)</option>
                  <option value="NOT_TESTED (Mati Total)">NOT_TESTED (Mati Total)</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Analisa Kerusakan Motherboard Lama <span class="required">*</span></label>
              <textarea id="tpl_gejala_mb" class="form-control" placeholder="Jelaskan titik short circuit, IC rusak, atau status unbootable..." required></textarea>
            </div>
          </div>
        `;
        break;

      case "PPI":
        html = `
          <div class="card" style="background: var(--bg-surface); border-left: 4px solid var(--primary); margin-top: 16px;">
            <div class="card-header">
              <h4 class="card-title" style="font-size: 14px; color: var(--primary);">
                🔄 Spesifikasi Form: Product Problem Inspection (Tukar Unit Baru)
              </h4>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Tanggal Pembelian Konsumen <span class="required">*</span></label>
                <input type="date" id="tpl_tgl_beli" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Nama Toko / Store Resmi Xiaomi</label>
                <input type="text" id="tpl_store" class="form-control" placeholder="Contoh: Xiaomi Store Central Park">
              </div>
              <div class="form-group">
                <label>Nomor Faktur / Nota Invoice</label>
                <input type="text" id="tpl_invoice" class="form-control" placeholder="Contoh: INV-XMI-2026-091">
              </div>
              <div class="form-group">
                <label>Status Masa Garansi PPI</label>
                <select id="tpl_garansi" class="form-control">
                  <option value="< 7 Hari (DOA Replacement Claim)">&lt; 7 Hari (DOA Replacement Claim)</option>
                  <option value="< 14 Hari (Special Escalation)">&lt; 14 Hari (Special Escalation)</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Keluhan Cacat Bawaan Pabrik dari Konsumen <span class="required">*</span></label>
              <textarea id="tpl_keluhan_ppi" class="form-control" placeholder="Deskripsikan cacat fungsi sejak pertama unboxing..." required></textarea>
            </div>
          </div>
        `;
        break;

      case "Case/Problem":
        html = `
          <div class="card" style="background: var(--bg-surface); border-left: 4px solid var(--primary); margin-top: 16px;">
            <div class="card-header">
              <h4 class="card-title" style="font-size: 14px; color: var(--primary);">
                ⚠️ Spesifikasi Form: Case / Problem Abnormal (Eskalasi Kasus Khusus)
              </h4>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Versi OS / HyperOS Perangkat</label>
                <input type="text" id="tpl_os_ver" class="form-control" placeholder="Contoh: HyperOS 2.0.12.0.UNLIDXM">
              </div>
              <div class="form-group">
                <label>Suhu Maksimal Tercatat (°C)</label>
                <input type="number" id="tpl_suhu" class="form-control" placeholder="Contoh: 51.5" step="0.1">
              </div>
            </div>
            <div class="form-group">
              <label>Gejala Kerusakan Abnormal <span class="required">*</span></label>
              <input type="text" id="tpl_gejala_abnormal" class="form-control" placeholder="Contoh: Reboot loop acak hanya saat terkoneksi 5G" required>
            </div>
            <div class="form-group">
              <label>Langkah Reproduksi Masalah <span class="required">*</span></label>
              <textarea id="tpl_repro_steps" class="form-control" placeholder="Tuliskan step-by-step teknisi mereproduksi masalah..." required></textarea>
            </div>
          </div>
        `;
        break;

      case "Case Battery Kembung":
        html = `
          <div class="card" style="background: var(--bg-surface); border-left: 4px solid var(--primary); margin-top: 16px;">
            <div class="card-header">
              <h4 class="card-title" style="font-size: 14px; color: var(--primary);">
                🔋 Spesifikasi Form: Case Baterai Kembung (Hazmat Safe Handling)
              </h4>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Ketebalan Baterai Aktual (mm) <span class="required">*</span></label>
                <input type="number" id="tpl_tebal_aktual" class="form-control" placeholder="Contoh: 6.2" step="0.1" required>
              </div>
              <div class="form-group">
                <label>Ketebalan Standar Pabrik (mm)</label>
                <input type="number" id="tpl_tebal_std" class="form-control" value="4.1" step="0.1">
              </div>
              <div class="form-group">
                <label>Indikator Cairan (LCI)</label>
                <select id="tpl_lci" class="form-control">
                  <option value="White (Normal / Bebas Cairan)">White (Normal / Bebas Cairan)</option>
                  <option value="Red/Pink (Terkena Cairan)">Red/Pink (Terkena Cairan)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Kondisi Kulit Baterai</label>
                <select id="tpl_kulit" class="form-control">
                  <option value="Utuh Tegang (Tidak Bocor)">Utuh Tegang (Tidak Bocor)</option>
                  <option value="Puncture / Ada Kebocoran">Puncture / Ada Kebocoran</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Catatan Inspeksi Fisik Baterai</label>
              <textarea id="tpl_catatan_baterai" class="form-control" placeholder="Contoh: Backdoor terdorong renggang 2mm, LCD masih bebas distorsi..."></textarea>
            </div>
          </div>
        `;
        break;

      default:
        html = `<p class="hint-text">Pilih jenis approval di atas untuk memuat formulir spesifik.</p>`;
    }

    container.innerHTML = html;

    // Attach auto-save listener
    container.querySelectorAll("input, select, textarea").forEach(input => {
      input.addEventListener("input", () => {
        if (window.App && App.triggerFormAutoSave) {
          App.triggerFormAutoSave();
        }
      });
    });
  },

  // 2. Ekstrak Nilai Inputan Menjadi Objek JSON Terstruktur
  extract(templateName) {
    const data = { template: templateName };

    switch (templateName) {
      case "DOA Part":
        data.part_number = document.getElementById("tpl_part_number")?.value.trim() || "";
        data.part_description = document.getElementById("tpl_part_desc")?.value.trim() || "";
        data.batch_lot_number = document.getElementById("tpl_lot_number")?.value.trim() || "";
        data.kondisi_segel = document.getElementById("tpl_segel_status")?.value || "";
        data.gejala_doa = document.getElementById("tpl_gejala_doa")?.value.trim() || "";
        break;

      case "DOA Part Mainboard":
        data.imei_baru_1 = document.getElementById("tpl_imei_baru")?.value.trim() || "";
        data.sn_baru = document.getElementById("tpl_sn_baru")?.value.trim() || "";
        data.konsumsi_arus = document.getElementById("tpl_arus")?.value.trim() || "";
        data.cit_hardware_test = document.getElementById("tpl_cit_test")?.value || "";
        data.gejala_motherboard = document.getElementById("tpl_gejala_mb")?.value.trim() || "";
        break;

      case "PPI":
        data.tanggal_invoice = document.getElementById("tpl_tgl_beli")?.value || "";
        data.nama_store_mitra = document.getElementById("tpl_store")?.value.trim() || "";
        data.nomor_invoice = document.getElementById("tpl_invoice")?.value.trim() || "";
        data.status_garansi = document.getElementById("tpl_garansi")?.value || "";
        data.keluhan_konsumen = document.getElementById("tpl_keluhan_ppi")?.value.trim() || "";
        break;

      case "Case/Problem":
        data.os_version = document.getElementById("tpl_os_ver")?.value.trim() || "";
        data.suhu_maksimal_celsius = document.getElementById("tpl_suhu")?.value || "";
        data.gejala_abnormal = document.getElementById("tpl_gejala_abnormal")?.value.trim() || "";
        data.langkah_reproduksi = document.getElementById("tpl_repro_steps")?.value.trim() || "";
        break;

      case "Case Battery Kembung":
        data.ketebalan_aktual_mm = document.getElementById("tpl_tebal_aktual")?.value || "";
        data.ketebalan_standar_mm = document.getElementById("tpl_tebal_std")?.value || "";
        data.liquid_indicator_lci = document.getElementById("tpl_lci")?.value || "";
        data.kondisi_kulit_baterai = document.getElementById("tpl_kulit")?.value || "";
        data.catatan_baterai = document.getElementById("tpl_catatan_baterai")?.value.trim() || "";
        break;
    }

    return data;
  }
};
