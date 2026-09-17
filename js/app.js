/**
 * ==========================================================================
 * XIAOMI SERVICE CENTER APPROVAL & QC SYSTEM - MAIN APP LOGIC
 * File: js/app.js
 * ==========================================================================
 * Mengatur alur kerja:
 * 1. Modul QC Physical Check (SOP Xiaomi Inbound & Outbound)
 * 2. Modul Technical Approval (5 Jenis Approval Part/Problem)
 */

const App = {
  activeModule: "qc", // 'qc' atau 'tech'
  activeRequestDetail: null,
  activeOutboundQcItem: null,
  uploadedEvidenceImages: [], // Array of { base64Data, mimeType, name }

  signPadA: null,
  signPadCustomer: null,
  signPadB: null,

  init() {
    this.setupGlobalEvents();
    this.checkSessionAndRoute();
  },

  // ========================================================================
  // 1. SESI DAN ROUTING UTAMA
  // ========================================================================
  checkSessionAndRoute() {
    const user = Auth.getCurrentUser();
    const loginView = document.getElementById("loginView");
    const appHeader = document.getElementById("appHeader");
    const moduleNav = document.getElementById("moduleNav");
    const qcModuleView = document.getElementById("qcModuleView");
    const techModuleView = document.getElementById("techModuleView");

    loginView.style.display = "none";
    appHeader.style.display = "none";
    moduleNav.style.display = "none";
    qcModuleView.style.display = "none";
    techModuleView.style.display = "none";

    if (!user) {
      loginView.style.display = "block";
      this.updateModeBadge();
      return;
    }

    // Tampilkan Header & Switcher Modul
    appHeader.style.display = "block";
    moduleNav.style.display = "flex";
    document.getElementById("navUserName").textContent = user.namaLengkap;
    document.getElementById("navUserRole").textContent = user.role;

    // Aktifkan modul terpilih
    this.switchMainModule(this.activeModule);
    this.updateModeBadge();
  },

  switchMainModule(moduleName) {
    this.activeModule = moduleName;
    const user = Auth.getCurrentUser();
    const btnQC = document.getElementById("btnModuleQC");
    const btnTech = document.getElementById("btnModuleTech");
    const qcView = document.getElementById("qcModuleView");
    const techView = document.getElementById("techModuleView");

    if (moduleName === "qc") {
      btnQC.classList.add("active");
      btnTech.classList.remove("active");
      qcView.style.display = "block";
      techView.style.display = "none";
      this.initQCModule();
    } else {
      btnTech.classList.add("active");
      btnQC.classList.remove("active");
      qcView.style.display = "none";
      techView.style.display = "block";
      this.initTechModule(user);
    }
  },

  updateModeBadge() {
    const badges = document.querySelectorAll(".mode-indicator");
    const isMock = CONFIG.USE_MOCK;
    badges.forEach(b => {
      b.textContent = isMock ? "Mode: DEMO / OFFLINE" : "Mode: LIVE GOOGLE APPS SCRIPT";
      b.style.background = isMock ? "#FEF3C7" : "#D1FAE5";
      b.style.color = isMock ? "#92400E" : "#065F46";
    });
  },

  // ========================================================================
  // 2. MODUL KHUSUS: QC PHYSICAL CHECK (SOP UNICOM XIAOMI)
  // ========================================================================
  initQCModule() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Set nama Teknisi A di form Inbound
    const fieldTekA = document.getElementById("qcTeknisiA");
    if (fieldTekA) {
      fieldTekA.value = `${user.namaLengkap} (${user.userId})`;
    }

    // Inisialisasi Canvas Sketsa Inbound & Dua Signature Pad (Teknisi A & Customer)
    setTimeout(() => {
      SketchCanvas.init("sketchCanvas");
      if (!this.signPadA) {
        this.signPadA = new DigitalSignaturePad("signCanvasA");
      }
      if (!this.signPadCustomer) {
        this.signPadCustomer = new DigitalSignaturePad("signCanvasCustomer");
      }
    }, 100);

    this.loadPendingOutboundQC();
    this.loadAllQCLogs();
  },

  // Submit Tahap 1: Inbound Physical Check (Teknisi A & End User)
  async submitInboundQC() {
    const user = Auth.getCurrentUser();
    const asid = document.getElementById("qcAsid").value.trim();
    const model = document.getElementById("qcModel").value.trim();
    const imeiSn = document.getElementById("qcImeiSn").value.trim();
    const namaCustomer = document.getElementById("qcNamaCustomer") ? document.getElementById("qcNamaCustomer").value.trim() : "";
    const catatanAwal = document.getElementById("qcCatatanAwal").value.trim();

    if (!asid || !model || !imeiSn || !namaCustomer) {
      this.showToast("Lengkapi ASID, Model, IMEI/SN, dan Nama Customer!", "error");
      return;
    }

    if (!this.signPadA || this.signPadA.isEmpty()) {
      this.showToast("Wajib membubuhkan tanda tangan Teknisi A (Engineers Repair)!", "error");
      return;
    }

    if (!this.signPadCustomer || this.signPadCustomer.isEmpty()) {
      this.showToast("Wajib membubuhkan tanda tangan Konsumen / End User!", "error");
      return;
    }

    const sketchBase64 = SketchCanvas.getBase64Image();
    const signABase64 = this.signPadA.getBase64PNG();
    const signCustomerBase64 = this.signPadCustomer.getBase64PNG();

    const payload = {
      action: "submit_inbound_qc",
      asid: asid,
      model: model,
      imei_sn: imeiSn,
      nama_customer: namaCustomer,
      teknisi_a: `${user.namaLengkap} (${user.userId})`,
      catatan_cacat: catatanAwal,
      sketsa_base64: sketchBase64,
      sign_teknisi_a_base64: signABase64,
      sign_customer_base64: signCustomerBase64
    };

    if (CONFIG.USE_MOCK) {
      // Simpan ke Mock Storage
      const allQC = this.getMockQCLogs();
      const newQcId = `QC-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${("000" + (allQC.length + 1)).slice(-4)}`;
      const newRecord = {
        qcId: newQcId,
        tanggalInbound: new Date().toLocaleString("id-ID"),
        asid: asid,
        model: model,
        imeiSn: imeiSn,
        namaCustomer: namaCustomer,
        teknisiA: payload.teknisi_a,
        inboundData: {
          catatan_cacat_awal: catatanAwal,
          sketsa_image_url: sketchBase64,
          nama_customer: namaCustomer
        },
        signTeknisiA: signABase64,
        signCustomer: signCustomerBase64,
        teknisiB: "",
        outboundChecklist: {},
        dateQc: "",
        signTeknisiB: "",
        statusQc: "Inbound_Completed",
        pdfQcUrl: ""
      };
      allQC.unshift(newRecord);
      this.saveMockQCLogs(allQC);

      this.showToast(`Inbound QC untuk ${asid} berhasil disimpan dengan tanda tangan Teknisi A dan End User!`, "success");
      this.resetInboundForm();
      this.loadPendingOutboundQC();
      this.loadAllQCLogs();
      return;
    }

    // Kirim ke Live Apps Script API
    try {
      this.showToast("Menyimpan Inbound QC & tanda tangan ke Drive...", "info");
      const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      const res = await resp.json();
      if (res.success) {
        this.showToast(`Berhasil! Nomor QC: ${res.qcId}. Siap lanjut ke perbaikan.`, "success");
        this.resetInboundForm();
        this.loadPendingOutboundQC();
        this.loadAllQCLogs();
      } else {
        this.showToast("Gagal menyimpan: " + res.message, "error");
      }
    } catch (err) {
      this.showToast("Error koneksi: " + err.message, "error");
    }
  },

  resetInboundForm() {
    document.getElementById("qcAsid").value = "";
    document.getElementById("qcModel").value = "";
    document.getElementById("qcImeiSn").value = "";
    if (document.getElementById("qcNamaCustomer")) document.getElementById("qcNamaCustomer").value = "";
    document.getElementById("qcCatatanAwal").value = "";
    SketchCanvas.clear();
    if (this.signPadA) this.signPadA.clear();
    if (this.signPadCustomer) this.signPadCustomer.clear();
  },

  clearSignA() {
    if (this.signPadA) this.signPadA.clear();
  },

  clearSignCustomer() {
    if (this.signPadCustomer) this.signPadCustomer.clear();
  },

  // Ambil Antrean Outbound QC
  async loadPendingOutboundQC() {
    const tbody = document.getElementById("outboundPendingTableBody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Memuat antrean...</td></tr>`;

    let list = [];
    if (CONFIG.USE_MOCK) {
      list = this.getMockQCLogs().filter(q => q.statusQc === "Inbound_Completed");
    } else {
      try {
        const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "get_pending_outbound_qc" })
        });
        const res = await resp.json();
        list = res.data || [];
      } catch (e) {
        this.showToast("Gagal memuat antrean QC: " + e.message, "error");
      }
    }

    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#888;">Tidak ada antrean unit yang menunggu Outbound QC.</td></tr>`;
      return;
    }

    let html = "";
    list.forEach(item => {
      html += `
        <tr>
          <td><strong>${item.qcId}</strong></td>
          <td><small style="color:#718096;">${item.tanggalInbound}</small></td>
          <td><span style="font-weight:bold; color:#C53030;">${item.asid}</span></td>
          <td>${item.model}</td>
          <td><code>${item.imeiSn}</code></td>
          <td>${item.teknisiA}</td>
          <td>
            <button type="button" class="btn btn-sm btn-primary" style="background:#059669;" onclick="App.openOutboundModal('${item.qcId}')">
              🔬 Proses Outbound QC
            </button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  },

  // Modal Outbound QC (Teknisi B)
  openOutboundModal(qcId) {
    const user = Auth.getCurrentUser();
    let item;
    if (CONFIG.USE_MOCK) {
      item = this.getMockQCLogs().find(q => q.qcId === qcId);
    } else {
      item = this.currentPendingQCList?.find(q => q.qcId === qcId);
    }

    if (!item) {
      this.showToast("Data QC tidak ditemukan.", "error");
      return;
    }

    // Peringatan SOP: Verifikasi Silang
    const tekAName = item.teknisiA || "";
    if (tekAName.toLowerCase().includes(user.userId.toLowerCase()) || tekAName.toLowerCase().includes(user.namaLengkap.toLowerCase())) {
      this.showToast(`⚠️ Peringatan SOP: Anda tercatat sebagai Teknisi Repair (Teknisi A: ${tekAName}). Sesuai SOP, QC Outbound wajib dilakukan oleh teknisi yang BERBEDA (Teknisi B)!`, "error");
    }

    this.activeOutboundQcItem = item;

    document.getElementById("outboundModalQcId").textContent = item.qcId;
    document.getElementById("outboundModalAsid").textContent = item.asid;
    document.getElementById("outboundModalModel").textContent = item.model;
    document.getElementById("outboundModalImei").textContent = item.imeiSn;
    const custElem = document.getElementById("outboundModalCustomer");
    if (custElem) custElem.textContent = item.namaCustomer || "Customer";
    document.getElementById("outboundModalTekA").textContent = item.teknisiA;

    // Tampilkan sketsa Inbound
    const imgBox = document.getElementById("outboundModalSketchImg");
    const sketchUrl = item.inboundData?.sketsa_image_url || "";
    if (sketchUrl) {
      imgBox.innerHTML = `<img src="${sketchUrl}" style="max-width:100%; border:1px solid #ddd; border-radius:6px;" alt="Sketsa Inbound">`;
    } else {
      imgBox.innerHTML = `<div style="padding:20px; color:#888;">(Tidak ada lampiran gambar sketsa)</div>`;
    }

    document.getElementById("outboundModalCatatanAwal").textContent = 
      item.inboundData?.catatan_cacat_awal ? `Catatan Cacat Awal: "${item.inboundData.catatan_cacat_awal}"` : "";

    // Reset Checklist
    document.getElementById("chkBackCover").checked = false;
    document.getElementById("chkKameraBelakang").checked = false;
    document.getElementById("chkKameraDepan").checked = false;
    document.getElementById("chkFisikHp").checked = false;

    // Date QC default hari ini (YYYY-MM-DD)
    document.getElementById("outboundDateQc").value = new Date().toISOString().slice(0, 10);

    // Init Signature Pad B
    document.getElementById("outboundQcModal").classList.add("show");
    setTimeout(() => {
      if (!this.signPadB) {
        this.signPadB = new DigitalSignaturePad("signCanvasB");
      } else {
        this.signPadB.clear();
      }
    }, 150);
  },

  closeOutboundModal() {
    document.getElementById("outboundQcModal").classList.remove("show");
    this.activeOutboundQcItem = null;
  },

  clearSignB() {
    if (this.signPadB) this.signPadB.clear();
  },

  // Submit Tahap 2: Outbound QC Selesai
  async submitOutboundQC() {
    if (!this.activeOutboundQcItem) return;

    const user = Auth.getCurrentUser();
    const item = this.activeOutboundQcItem;

    // ATURAN KETAT SOP: Teknisi B != Teknisi A
    const tekAName = item.teknisiA || "";
    if (tekAName.toLowerCase().includes(user.userId.toLowerCase()) || tekAName.toLowerCase().includes(user.namaLengkap.toLowerCase())) {
      alert(`PELANGGARAN SOP: Anda (${user.namaLengkap}) tidak boleh melakukan QC pada unit yang Anda servis sendiri sebagai Teknisi A! SOP Xiaomi mewajibkan verifikasi silang oleh 2 teknisi berbeda.`);
      return;
    }

    // Validasi 4 Checklist Wajib Centang
    const chk1 = document.getElementById("chkBackCover").checked;
    const chk2 = document.getElementById("chkKameraBelakang").checked;
    const chk3 = document.getElementById("chkKameraDepan").checked;
    const chk4 = document.getElementById("chkFisikHp").checked;

    if (!chk1 || !chk2 || !chk3 || !chk4) {
      this.showToast("Seluruh 4 butir checklist fisik wajib memenuhi standar (dicentang)!", "error");
      return;
    }

    if (!this.signPadB || this.signPadB.isEmpty()) {
      this.showToast("Wajib membubuhkan tanda tangan Teknisi B (Engineers QC)!", "error");
      return;
    }

    const dateQc = document.getElementById("outboundDateQc").value;
    const signBBase64 = this.signPadB.getBase64PNG();

    const payload = {
      action: "submit_outbound_qc",
      qc_id: item.qcId,
      teknisi_b: `${user.namaLengkap} (${user.userId})`,
      checklist: {
        back_cover_lem_rapat: chk1,
        kamera_belakang_bersih: chk2,
        kamera_depan_bersih: chk3,
        fisik_hp_bersih: chk4
      },
      date_qc: dateQc,
      sign_teknisi_b_base64: signBBase64
    };

    if (CONFIG.USE_MOCK) {
      const allQC = this.getMockQCLogs();
      const target = allQC.find(q => q.qcId === item.qcId);
      if (target) {
        target.teknisiB = payload.teknisi_b;
        target.outboundChecklist = payload.checklist;
        target.dateQc = dateQc;
        target.signTeknisiB = signBBase64;
        target.statusQc = "QC_Passed";
        target.pdfQcUrl = "https://drive.google.com/file/d/mock-sop-qc-passed-pdf/view";
        this.saveMockQCLogs(allQC);
      }

      this.showToast(`Outbound QC untuk ${item.asid} selesai! Formulir resmi siap digunakan untuk Approve RRR.`, "success");
      this.closeOutboundModal();
      this.loadPendingOutboundQC();
      this.loadAllQCLogs();
      return;
    }

    // Kirim ke Live Apps Script API
    try {
      this.showToast("Menyimpan hasil QC dan men-generate dokumen resmi...", "info");
      const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      const res = await resp.json();
      if (res.success) {
        this.showToast(res.message, "success");
        this.closeOutboundModal();
        this.loadPendingOutboundQC();
        this.loadAllQCLogs();
      } else {
        this.showToast("Gagal: " + res.message, "error");
      }
    } catch (err) {
      this.showToast("Error server: " + err.message, "error");
    }
  },

  // Riwayat Dokumen QC
  async loadAllQCLogs() {
    const tbody = document.getElementById("historyQcTableBody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Memuat riwayat arsip...</td></tr>`;

    let list = [];
    if (CONFIG.USE_MOCK) {
      list = this.getMockQCLogs();
    } else {
      try {
        const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "get_all_qc_logs" })
        });
        const res = await resp.json();
        list = res.data || [];
      } catch (e) {
        this.showToast("Gagal memuat arsip: " + e.message, "error");
      }
    }

    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#888;">Belum ada dokumen QC tercatat.</td></tr>`;
      return;
    }

    let html = "";
    list.forEach(q => {
      const isPassed = q.statusQc === "QC_Passed";
      const badgeClass = isPassed ? "badge-approved" : "badge-pending";
      const statusLabel = isPassed ? "QC PASSED (Lolos RRR)" : "Menunggu QC Outbound";

      const pdfLink = q.pdfQcUrl ? 
        `<a href="${q.pdfQcUrl}" target="_blank" class="btn btn-sm btn-success">📄 Formulir Resmi</a>` :
        `<span style="font-size:11px; color:#999;">Belum Tersedia</span>`;

      html += `
        <tr>
          <td><strong>${q.qcId}</strong></td>
          <td><strong style="color:#C53030;">${q.asid}</strong><br><small style="color:#4A5568;">👤 ${q.namaCustomer || 'Customer'}</small></td>
          <td>${q.model}<br><small style="color:#718096;">${q.imeiSn}</small></td>
          <td>${q.teknisiA}</td>
          <td>${q.teknisiB || "<span style='color:#C53030;'>- Belum QC -</span>"}</td>
          <td>${q.dateQc || "-"}</td>
          <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
          <td>${pdfLink}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  },

  // Mock Helpers QC
  getMockQCLogs() {
    const raw = localStorage.getItem("mi_local_qc_logs");
    if (!raw) {
      this.saveMockQCLogs(CONFIG.MOCK_DATA.INITIAL_QC_LOGS);
      return CONFIG.MOCK_DATA.INITIAL_QC_LOGS;
    }
    return JSON.parse(raw);
  },

  saveMockQCLogs(arr) {
    localStorage.setItem("mi_local_qc_logs", JSON.stringify(arr));
  },

  // ========================================================================
  // 3. MODUL TECHNICAL APPROVAL (5 JENIS APPROVAL XIAOMI)
  // ========================================================================
  initTechModule(user) {
    const teknisiView = document.getElementById("teknisiView");
    const tsView = document.getElementById("tsView");

    teknisiView.style.display = "none";
    tsView.style.display = "none";

    if (user.role === "Teknisi") {
      teknisiView.style.display = "block";
      this.initTeknisiPortal();
    } else if (user.role === "Tim_TS") {
      tsView.style.display = "block";
      this.initTsPortal();
    }
  },

  initTeknisiPortal() {
    const user = Auth.getCurrentUser();
    document.getElementById("formTeknisiName").value = `${user.namaLengkap} (${user.userId})`;

    const selectJenis = document.getElementById("formJenisApproval");
    selectJenis.addEventListener("change", (e) => {
      FormTemplates.render(e.target.value, document.getElementById("dynamicTemplateContainer"));
    });
    FormTemplates.render(selectJenis.value, document.getElementById("dynamicTemplateContainer"));

    this.loadTeknisiHistory();
  },

  async loadTeknisiHistory() {
    const user = Auth.getCurrentUser();
    const container = document.getElementById("teknisiHistoryTableBody");
    container.innerHTML = `<tr><td colspan="6" style="text-align:center;">Memuat data...</td></tr>`;

    let list = [];
    if (CONFIG.USE_MOCK) {
      list = this.getMockRequests().filter(r => 
        r.teknisiPemohon.toLowerCase().includes(user.namaLengkap.toLowerCase()) ||
        r.teknisiPemohon.toLowerCase().includes(user.userId.toLowerCase())
      );
    } else {
      try {
        const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "get_teknisi_requests",
            teknisi_id: user.userId
          })
        });
        const res = await resp.json();
        list = res.data || [];
      } catch (e) {
        this.showToast("Gagal memuat riwayat pengajuan: " + e.message, "error");
      }
    }

    if (!list || list.length === 0) {
      container.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#888;">Belum ada riwayat pengajuan.</td></tr>`;
      return;
    }

    let rowsHtml = "";
    list.forEach(req => {
      const badgeClass = req.statusApproval === "Approved" ? "badge-approved" :
                         req.statusApproval === "Rejected" ? "badge-rejected" :
                         req.statusApproval === "Partially_Approved" ? "badge-partial" : "badge-pending";

      const pdfBtn = req.pdfReportUrl && req.pdfReportUrl !== "" ?
        `<a href="${req.pdfReportUrl}" target="_blank" class="btn btn-sm btn-success">📄 Unduh PDF</a>` :
        `<span style="color:#999; font-size:11px;">Belum Tersedia</span>`;

      rowsHtml += `
        <tr>
          <td><strong>${req.requestId}</strong><br><small style="color:#718096;">${req.tanggalPengajuan}</small></td>
          <td>${req.srNumber}</td>
          <td>${req.modelType}<br><small style="color:#718096;">${req.imei}</small></td>
          <td>${req.jenisApproval}</td>
          <td><span class="badge ${badgeClass}">${req.statusApproval}</span></td>
          <td>${pdfBtn}</td>
        </tr>
      `;
    });
    container.innerHTML = rowsHtml;
  },

  initTsPortal() {
    this.loadPendingApprovals();
  },

  async loadPendingApprovals() {
    const container = document.getElementById("tsPendingTableBody");
    container.innerHTML = `<tr><td colspan="7" style="text-align:center;">Memuat antrean pending...</td></tr>`;

    let list = [];
    if (CONFIG.USE_MOCK) {
      list = this.getMockRequests().filter(r => r.statusApproval === "Pending" || r.statusApproval === "Partially_Approved");
    } else {
      try {
        const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "get_pending_approvals" })
        });
        const res = await resp.json();
        list = res.data || [];
      } catch (e) {
        this.showToast("Gagal memuat antrean pending: " + e.message, "error");
      }
    }

    document.getElementById("pendingCountBadge").textContent = `${list.length} Request`;

    if (!list || list.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#888;">Tidak ada antrean approval pending saat ini.</td></tr>`;
      return;
    }

    let rows = "";
    list.forEach(item => {
      const badgeClass = item.statusApproval === "Partially_Approved" ? "badge-partial" : "badge-pending";
      rows += `
        <tr>
          <td><strong>${item.requestId}</strong><br><small style="color:#718096;">${item.tanggalPengajuan}</small></td>
          <td>${item.srNumber}</td>
          <td>${item.modelType}<br><small style="color:#718096;">${item.imei}</small></td>
          <td><span style="font-weight:600; color:var(--primary);">${item.jenisApproval}</span></td>
          <td>${item.teknisiPemohon}</td>
          <td><span class="badge ${badgeClass}">${item.statusApproval}</span></td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="App.openReviewModal('${item.requestId}')">🔍 Tinjau &amp; Putuskan</button>
          </td>
        </tr>
      `;
    });
    container.innerHTML = rows;
  },

  openReviewModal(requestId) {
    let req;
    if (CONFIG.USE_MOCK) {
      req = this.getMockRequests().find(r => r.requestId === requestId);
    } else {
      req = this.currentPendingList?.find(r => r.requestId === requestId);
    }

    if (!req) {
      this.showToast("Data pengajuan tidak ditemukan.", "error");
      return;
    }

    this.activeRequestDetail = req;

    document.getElementById("modalReqId").textContent = req.requestId;
    document.getElementById("modalSrNumber").textContent = req.srNumber;
    document.getElementById("modalImei").textContent = req.imei;
    document.getElementById("modalModel").textContent = req.modelType;
    document.getElementById("modalJenis").textContent = req.jenisApproval;
    document.getElementById("modalTeknisi").textContent = req.teknisiPemohon;

    const jsonContainer = document.getElementById("modalAnalisaContent");
    jsonContainer.textContent = JSON.stringify(req.detailAnalisa, null, 2);

    const imgContainer = document.getElementById("modalEvidencePreview");
    imgContainer.innerHTML = "";
    if (req.detailAnalisa?.evidence_drive_urls && req.detailAnalisa.evidence_drive_urls.length > 0) {
      req.detailAnalisa.evidence_drive_urls.forEach((url, i) => {
        imgContainer.innerHTML += `
          <a href="${url}" target="_blank" class="btn btn-sm btn-secondary" style="margin-right:6px; margin-bottom:6px;">
            Bukti Foto #${i + 1}
          </a>
        `;
      });
    }

    document.getElementById("approvalModal").classList.add("show");
  },

  closeReviewModal() {
    document.getElementById("approvalModal").classList.remove("show");
    this.activeRequestDetail = null;
  },

  async executeApprovalDecision(decision) {
    if (!this.activeRequestDetail) return;

    const notes = document.getElementById("modalApproverNotes").value.trim();
    if (decision === "Rejected" && !notes) {
      this.showToast("Wajib mengisi alasan/catatan penolakan!", "error");
      return;
    }

    const user = Auth.getCurrentUser();
    const requestId = this.activeRequestDetail.requestId;

    if (CONFIG.USE_MOCK) {
      const all = this.getMockRequests();
      const target = all.find(r => r.requestId === requestId);
      if (target) {
        const timestamp = new Date().toLocaleString("id-ID");
        target.approverList.push({
          approver_id: user.userId,
          approver_name: user.namaLengkap,
          level: "Tim TS Specialist",
          decision: decision,
          notes: notes,
          timestamp: timestamp
        });

        target.statusApproval = decision === "Approved" ? "Approved" : "Rejected";
        if (decision === "Approved") {
          target.timestampApproved = timestamp;
          target.pdfReportUrl = "https://drive.google.com/file/d/mock-pdf-approved-download/view";
        }
        this.saveMockRequests(all);
      }

      this.showToast(`Request ${requestId} berhasil di-${decision}!`, "success");
      this.closeReviewModal();
      this.loadPendingApprovals();
      return;
    }

    try {
      this.showToast("Memproses keputusan approval...", "info");
      const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "process_approval",
          request_id: requestId,
          approver_id: user.userId,
          approver_name: user.namaLengkap,
          approver_level: "Tim TS Specialist",
          decision: decision,
          notes: notes
        })
      });

      const res = await resp.json();
      if (res.success) {
        this.showToast(res.message, "success");
        this.closeReviewModal();
        this.loadPendingApprovals();
      } else {
        this.showToast("Gagal memproses: " + res.message, "error");
      }
    } catch (err) {
      this.showToast("Error koneksi server: " + err.message, "error");
    }
  },

  async submitNewRequest() {
    const user = Auth.getCurrentUser();
    const srNumber = document.getElementById("formSrNumber").value.trim();
    const imei = document.getElementById("formImei").value.trim();
    const model = document.getElementById("formModel").value.trim();
    const jenis = document.getElementById("formJenisApproval").value;

    if (!srNumber || !imei || !model) {
      this.showToast("Mohon lengkapi No. SR, IMEI, dan Model Unit!", "error");
      return;
    }

    const detailData = FormTemplates.extract(jenis);

    const payload = {
      action: "submit_request",
      sr_number: srNumber,
      imei: imei,
      model_type: model,
      jenis_approval: jenis,
      teknisi_pemohon: `${user.namaLengkap} (${user.userId})`,
      detail_analisa: detailData,
      images_base64: this.uploadedEvidenceImages
    };

    if (CONFIG.USE_MOCK) {
      const all = this.getMockRequests();
      const newReqId = `REQ-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${("000" + (all.length + 1)).slice(-4)}`;
      const newReq = {
        requestId: newReqId,
        tanggalPengajuan: new Date().toLocaleString("id-ID"),
        srNumber: srNumber,
        imei: imei,
        modelType: model,
        jenisApproval: jenis,
        teknisiPemohon: payload.teknisi_pemohon,
        detailAnalisa: detailData,
        statusApproval: "Pending",
        approverList: [],
        timestampApproved: "",
        pdfReportUrl: ""
      };
      all.unshift(newReq);
      this.saveMockRequests(all);

      this.showToast(`Pengajuan ${newReqId} berhasil dikirim ke antrean Tim TS!`, "success");
      this.resetTeknisiForm();
      this.loadTeknisiHistory();
      return;
    }

    try {
      this.showToast("Mengunggah data pengajuan...", "info");
      const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      const res = await resp.json();
      if (res.success) {
        this.showToast(`Berhasil! Nomor Request: ${res.requestId}`, "success");
        this.resetTeknisiForm();
        this.loadTeknisiHistory();
      } else {
        this.showToast("Gagal submit: " + res.message, "error");
      }
    } catch (err) {
      this.showToast("Error koneksi: " + err.message, "error");
    }
  },

  resetTeknisiForm() {
    document.getElementById("formSrNumber").value = "";
    document.getElementById("formImei").value = "";
    document.getElementById("formModel").value = "";
    this.uploadedEvidenceImages = [];
    document.getElementById("evidencePreviewContainer").innerHTML = "";
    FormTemplates.render(document.getElementById("formJenisApproval").value, document.getElementById("dynamicTemplateContainer"));
  },

  // ========================================================================
  // 4. GLOBAL EVENTS & UTILITIES
  // ========================================================================
  setupGlobalEvents() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const u = document.getElementById("loginUsername").value;
        const p = document.getElementById("loginPassword").value;
        const res = await Auth.login(u, p);
        if (res.success) {
          this.showToast("Selamat datang, " + res.data.namaLengkap, "success");
          this.checkSessionAndRoute();
        } else {
          this.showToast(res.message, "error");
        }
      });
    }

    // Quick Login Demo Buttons
    document.getElementById("quickLoginTeknisi")?.addEventListener("click", async () => {
      document.getElementById("loginUsername").value = "budi.teknisi";
      document.getElementById("loginPassword").value = "password123";
      await Auth.login("budi.teknisi", "password123");
      this.checkSessionAndRoute();
    });

    document.getElementById("quickLoginTeknisiB")?.addEventListener("click", async () => {
      document.getElementById("loginUsername").value = "siti.teknisi";
      document.getElementById("loginPassword").value = "password123";
      // Ensure siti is in mock users
      if (!CONFIG.MOCK_DATA.USERS.find(u => u.username === "siti.teknisi")) {
        CONFIG.MOCK_DATA.USERS.push({
          userId: "TEK-002",
          namaLengkap: "Siti Rahma",
          username: "siti.teknisi",
          password: "password123",
          role: "Teknisi",
          status: "Aktif"
        });
      }
      await Auth.login("siti.teknisi", "password123");
      this.checkSessionAndRoute();
    });

    document.getElementById("quickLoginTs")?.addEventListener("click", async () => {
      document.getElementById("loginUsername").value = "agus.ts";
      document.getElementById("loginPassword").value = "password123";
      await Auth.login("agus.ts", "password123");
      this.checkSessionAndRoute();
    });

    // Logout
    document.getElementById("btnLogout")?.addEventListener("click", () => Auth.logout());

    // Switcher Tab QC Module (data-qctab)
    document.querySelectorAll("[data-qctab]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const targetTab = e.target.dataset.qctab;
        document.querySelectorAll("[data-qctab]").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");

        document.querySelectorAll("#qcModuleView .tab-panel").forEach(p => p.style.display = "none");
        const panel = document.getElementById(targetTab);
        if (panel) panel.style.display = "block";

        if (targetTab === "panelInboundQC") {
          setTimeout(() => SketchCanvas.init("sketchCanvas"), 50);
        }
      });
    });

    // Switcher Tab Technical Module (data-tab)
    document.querySelectorAll("[data-tab]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tab = e.target.dataset.tab;
        document.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");

        document.querySelectorAll("#techModuleView .tab-panel").forEach(p => p.style.display = "none");
        const activePanel = document.getElementById(tab);
        if (activePanel) activePanel.style.display = "block";
      });
    });

    // Evidence Image Upload Handler
    const imageInput = document.getElementById("evidenceImageInput");
    if (imageInput) {
      imageInput.addEventListener("change", (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (re) => {
            this.uploadedEvidenceImages.push({
              base64Data: re.target.result,
              mimeType: file.type,
              name: file.name
            });
            this.renderEvidencePreviews();
          };
          reader.readAsDataURL(file);
        });
      });
    }

    // Config Endpoint Settings Modal
    document.getElementById("btnOpenSettings")?.addEventListener("click", () => {
      document.getElementById("inputAppsScriptUrl").value = CONFIG.APPS_SCRIPT_URL;
      document.getElementById("settingsModal").classList.add("show");
    });
    document.getElementById("btnCloseSettings")?.addEventListener("click", () => {
      document.getElementById("settingsModal").classList.remove("show");
    });
    document.getElementById("btnSaveSettings")?.addEventListener("click", () => {
      const url = document.getElementById("inputAppsScriptUrl").value.trim();
      localStorage.setItem("MI_APPS_SCRIPT_URL", url);
      CONFIG.APPS_SCRIPT_URL = url;
      this.updateModeBadge();
      document.getElementById("settingsModal").classList.remove("show");
      this.showToast("Pengaturan URL Apps Script berhasil disimpan!", "success");
    });
  },

  renderEvidencePreviews() {
    const container = document.getElementById("evidencePreviewContainer");
    if (!container) return;
    container.innerHTML = "";
    this.uploadedEvidenceImages.forEach((img, idx) => {
      container.innerHTML += `
        <div class="preview-thumb">
          <img src="${img.base64Data}" alt="Evidence">
          <button class="remove-img" onclick="App.removeEvidenceImage(${idx})">&times;</button>
        </div>
      `;
    });
  },

  removeEvidenceImage(idx) {
    this.uploadedEvidenceImages.splice(idx, 1);
    this.renderEvidencePreviews();
  },

  // Mock Storage Helpers Technical
  getMockRequests() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.LOCAL_REQUESTS);
    if (!raw) {
      this.saveMockRequests(CONFIG.MOCK_DATA.INITIAL_REQUESTS);
      return CONFIG.MOCK_DATA.INITIAL_REQUESTS;
    }
    return JSON.parse(raw);
  },

  saveMockRequests(arr) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.LOCAL_REQUESTS, JSON.stringify(arr));
  },

  showToast(msg, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
