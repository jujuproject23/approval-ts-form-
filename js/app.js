/**
 * ==========================================================================
 * XIAOMI SERVICE CENTER APPROVAL & QC SYSTEM - ENTERPRISE ORCHESTRATOR
 * File: frontend/js/app.js
 * ==========================================================================
 * Mengorkestrasikan:
 * 1. Modul SOP QC Physical Check (Inbound Dual-Sign & Outbound Cross-Verification)
 * 2. Modul Technical Approval (5 Templates: DOA Part, Mainboard, PPI, Case, Battery)
 * 3. 6 Role RBAC, Auto-Save Draft, Drag & Drop Upload, Multi-Level Approval Timeline
 */

const App = {
  activeRequestDetail: null,
  activeOutboundQcItem: null,
  uploadedEvidenceImages: [], // Array of { base64Data, mimeType, name }

  signPadA: null,
  signPadCustomer: null,
  signPadB: null,

  autoSaveTimer: null,

  init() {
    // Check saved GAS URL in localStorage
    const savedUrl = localStorage.getItem("MI_APPS_SCRIPT_URL");
    if (savedUrl !== null) {
      CONFIG.APPS_SCRIPT_URL = savedUrl;
    }

    this.setupGlobalEvents();
    this.setupDragAndDrop();
    NotificationService.init();
    this.checkSessionAndRoute();
  },

  // ========================================================================
  // 1. SESI DAN ROUTING UTAMA
  // ========================================================================
  checkSessionAndRoute() {
    const user = Auth.getCurrentUser();
    const loginView = document.getElementById("loginView");
    const appShell = document.getElementById("appShell");

    if (!user) {
      if (loginView) loginView.style.display = "flex";
      if (appShell) appShell.style.display = "none";
      this.updateModeBadge();
      return;
    }

    // User is logged in
    if (loginView) loginView.style.display = "none";
    if (appShell) appShell.style.display = "flex";

    // Initialize UI Components
    HeaderComponent.init();
    SidebarComponent.init();

    this.updateModeBadge();

    // Default view navigation based on role
    SidebarComponent.navigate("dashboard");

    // Initialize modules
    this.initQCModule();
    this.initTechModule(user);
    this.restoreFormDraft();
  },

  updateModeBadge() {
    const badges = document.querySelectorAll(".mode-indicator");
    const isMock = CONFIG.USE_MOCK;
    badges.forEach(b => {
      b.textContent = isMock ? "Mode: DEMO / OFFLINE" : "Mode: LIVE GOOGLE APPS SCRIPT";
      b.style.backgroundColor = isMock ? "var(--warning-light)" : "var(--success-light)";
      b.style.color = isMock ? "var(--warning-text)" : "var(--success-text)";
      b.style.border = isMock ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(34, 197, 94, 0.3)";
    });
  },

  // ========================================================================
  // 2. MODUL KHUSUS: SOP QC PHYSICAL CHECK (UNICOM XIAOMI)
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
    }, 150);

    this.loadPendingOutboundQC();
    this.loadAllQCLogs();
  },

  // Submit Tahap 1: Inbound Physical Check (Teknisi A & End User)
  async submitInboundQC() {
    const user = Auth.getCurrentUser();
    const asid = document.getElementById("qcAsid")?.value.trim();
    const model = document.getElementById("qcModel")?.value.trim();
    const imeiSn = document.getElementById("qcImeiSn")?.value.trim();
    const namaCustomer = document.getElementById("qcNamaCustomer") ? document.getElementById("qcNamaCustomer").value.trim() : "";
    const catatanAwal = document.getElementById("qcCatatanAwal")?.value.trim() || "";

    if (!asid || !model || !imeiSn || !namaCustomer) {
      NotificationService.showToast("Lengkapi ASID, Model, IMEI/SN, dan Nama Customer!", "error");
      return;
    }

    if (!this.signPadA || this.signPadA.isEmpty()) {
      NotificationService.showToast("Wajib membubuhkan tanda tangan Teknisi A (Engineers Repair)!", "error");
      return;
    }

    if (!this.signPadCustomer || this.signPadCustomer.isEmpty()) {
      NotificationService.showToast("Wajib membubuhkan tanda tangan Konsumen / End User!", "error");
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

      AuditService.log("SUBMIT_INBOUND_QC", newQcId, `Inbound QC ASID ${asid} untuk ${model}`);
      NotificationService.showToast(`Inbound QC ${newQcId} berhasil disimpan!`, "success");
      NotificationService.addNotification("Inbound QC Disimpan", `Unit ${model} (ASID: ${asid}) masuk ke antrean perbaikan.`, "info");
      this.resetInboundForm();
      this.loadPendingOutboundQC();
      this.loadAllQCLogs();
      return;
    }

    try {
      NotificationService.showToast("Menyimpan data Inbound QC...", "info");
      const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      const res = await resp.json();
      if (res.success) {
        AuditService.log("SUBMIT_INBOUND_QC", res.qcId, `Inbound QC ASID ${asid}`);
        NotificationService.showToast(`Berhasil! Nomor QC: ${res.qcId}`, "success");
        this.resetInboundForm();
        this.loadPendingOutboundQC();
        this.loadAllQCLogs();
      } else {
        NotificationService.showToast("Gagal simpan: " + res.message, "error");
      }
    } catch (err) {
      NotificationService.showToast("Error koneksi: " + err.message, "error");
    }
  },

  resetInboundForm() {
    document.getElementById("qcAsid").value = "";
    document.getElementById("qcModel").value = "";
    document.getElementById("qcImeiSn").value = "";
    if (document.getElementById("qcNamaCustomer")) document.getElementById("qcNamaCustomer").value = "";
    document.getElementById("qcCatatanAwal").value = "";
    SketchCanvas.clear();
    this.clearSignA();
    this.clearSignCustomer();
  },

  clearSignA() {
    if (this.signPadA) this.signPadA.clear();
  },

  clearSignCustomer() {
    if (this.signPadCustomer) this.signPadCustomer.clear();
  },

  // Load Antrean Tahap 2: Outbound QC Check
  async loadPendingOutboundQC() {
    const tbody = document.getElementById("outboundPendingTableBody");
    if (!tbody) return;

    if (CONFIG.USE_MOCK) {
      const allQC = this.getMockQCLogs();
      const pending = allQC.filter(item => item.statusQc === "Inbound_Completed");
      this.renderOutboundPendingTable(pending);
      return;
    }

    try {
      const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "get_pending_outbound_qc" })
      });
      const res = await resp.json();
      if (res.success && res.data) {
        this.renderOutboundPendingTable(res.data);
      }
    } catch (err) {
      console.error("Gagal load pending outbound:", err);
    }
  },

  renderOutboundPendingTable(list) {
    const tbody = document.getElementById("outboundPendingTableBody");
    if (!tbody) return;

    if (!list || list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; color: var(--text-muted); padding: 24px;">
            🎉 Tidak ada antrean unit yang menunggu Outbound QC saat ini.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(item => `
      <tr>
        <td style="font-weight: 700; color: #C53030;">${item.qcId}</td>
        <td>${item.tanggalInbound}</td>
        <td style="font-weight: 600;">${item.asid}</td>
        <td>${item.model}</td>
        <td style="font-family: var(--font-mono);">${item.imeiSn}</td>
        <td><span class="badge badge-secondary">${item.teknisiA}</span></td>
        <td>
          <button class="btn btn-sm btn-success" onclick="App.openOutboundModal('${item.qcId}')">
            🔍 Verifikasi QC
          </button>
        </td>
      </tr>
    `).join("");
  },

  // Buka Modal Tahap 2: Outbound QC Check (Teknisi B)
  openOutboundModal(qcId) {
    const user = Auth.getCurrentUser();
    let item = null;

    if (CONFIG.USE_MOCK) {
      const allQC = this.getMockQCLogs();
      item = allQC.find(q => q.qcId === qcId);
    }

    if (!item) {
      NotificationService.showToast("Data QC tidak ditemukan!", "error");
      return;
    }

    // ATURAN WAJIB SOP: TEKNISI B HARUS BERBEDA DENGAN TEKNISI A
    if (item.teknisiA && item.teknisiA.includes(user.userId)) {
      alert("⚠️ PELANGGARAN SOP:\nAnda tidak boleh melakukan QC pada unit yang Anda servis sendiri sebagai Teknisi A!\nSOP Xiaomi mewajibkan verifikasi silang (cross-verification) oleh 2 teknisi berbeda.");
      return;
    }

    this.activeOutboundQcItem = item;

    document.getElementById("outboundModalQcId").textContent = item.qcId;
    document.getElementById("outboundModalAsid").textContent = item.asid;
    document.getElementById("outboundModalModel").textContent = item.model;
    document.getElementById("outboundModalImei").textContent = item.imeiSn;
    document.getElementById("outboundModalCustomer").textContent = item.namaCustomer || "-";
    document.getElementById("outboundModalTekA").textContent = item.teknisiA;
    document.getElementById("outboundModalCatatanAwal").textContent = item.inboundData?.catatan_cacat_awal ? `Catatan Teknisi A: "${item.inboundData.catatan_cacat_awal}"` : "Tidak ada catatan cacat awal khusus.";

    const imgContainer = document.getElementById("outboundModalSketchImg");
    if (item.inboundData?.sketsa_image_url) {
      imgContainer.innerHTML = `<img src="${item.inboundData.sketsa_image_url}" style="max-height: 180px; border-radius: 6px; border: 1px solid var(--border-default);">`;
    } else {
      imgContainer.innerHTML = `<span class="hint-text">Sketsa tidak tersedia atau dibuat tanpa coretan.</span>`;
    }

    // Reset Checklist & Date
    document.getElementById("chkBackCover").checked = false;
    document.getElementById("chkKameraBelakang").checked = false;
    document.getElementById("chkKameraDepan").checked = false;
    document.getElementById("chkFisikHp").checked = false;
    document.getElementById("outboundDateQc").value = new Date().toISOString().split("T")[0];

    // Inisialisasi Signature Pad B
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
    document.getElementById("outboundQcModal")?.classList.remove("show");
    this.activeOutboundQcItem = null;
  },

  clearSignB() {
    if (this.signPadB) this.signPadB.clear();
  },

  // Submit Tahap 2: Outbound QC Check
  async submitOutboundQC() {
    const user = Auth.getCurrentUser();
    if (!this.activeOutboundQcItem) return;

    const chkBack = document.getElementById("chkBackCover").checked;
    const chkKamBel = document.getElementById("chkKameraBelakang").checked;
    const chkKamDep = document.getElementById("chkKameraDepan").checked;
    const chkFisik = document.getElementById("chkFisikHp").checked;
    const dateQc = document.getElementById("outboundDateQc").value;

    if (!chkBack || !chkKamBel || !chkKamDep || !chkFisik) {
      NotificationService.showToast("Wajib mencentang seluruh 4 butir checklist fisik sesuai SOP!", "error");
      return;
    }

    if (!this.signPadB || this.signPadB.isEmpty()) {
      NotificationService.showToast("Wajib membubuhkan tanda tangan Engineers QC (Teknisi B)!", "error");
      return;
    }

    const signBBase64 = this.signPadB.getBase64PNG();

    const payload = {
      action: "submit_outbound_qc",
      qc_id: this.activeOutboundQcItem.qcId,
      teknisi_b: `${user.namaLengkap} (${user.userId})`,
      checklist_json: JSON.stringify({
        back_cover_lem_rapat: chkBack,
        kamera_belakang_bersih: chkKamBel,
        kamera_depan_bersih: chkKamDep,
        fisik_hp_bersih: chkFisik
      }),
      date_qc: dateQc,
      sign_teknisi_b_base64: signBBase64
    };

    if (CONFIG.USE_MOCK) {
      const allQC = this.getMockQCLogs();
      const idx = allQC.findIndex(q => q.qcId === this.activeOutboundQcItem.qcId);
      if (idx !== -1) {
        allQC[idx].teknisiB = payload.teknisi_b;
        allQC[idx].outboundChecklist = JSON.parse(payload.checklist_json);
        allQC[idx].dateQc = dateQc;
        allQC[idx].signTeknisiB = signBBase64;
        allQC[idx].statusQc = "QC_Passed";
        allQC[idx].pdfQcUrl = "https://drive.google.com/file/d/mock-qc-sop-pdf/view";
        this.saveMockQCLogs(allQC);
      }

      AuditService.log("SUBMIT_OUTBOUND_QC", this.activeOutboundQcItem.qcId, `QC Lolos 4 Checklist oleh ${payload.teknisi_b}`);
      NotificationService.showToast("QC Physical Check Selesai! Dokumen PDF resmi siap untuk RRR.", "success");
      NotificationService.addNotification("QC Selesai (Passed)", `Unit ${this.activeOutboundQcItem.model} dinyatakan lolos QC fisik.`, "success");
      this.closeOutboundModal();
      this.loadPendingOutboundQC();
      this.loadAllQCLogs();
      return;
    }

    try {
      NotificationService.showToast("Menyimpan hasil Outbound QC...", "info");
      const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      const res = await resp.json();
      if (res.success) {
        AuditService.log("SUBMIT_OUTBOUND_QC", this.activeOutboundQcItem.qcId, "QC Passed");
        NotificationService.showToast("QC Selesai! PDF resmi berhasil digenerate.", "success");
        this.closeOutboundModal();
        this.loadPendingOutboundQC();
        this.loadAllQCLogs();
      } else {
        NotificationService.showToast("Gagal: " + res.message, "error");
      }
    } catch (err) {
      NotificationService.showToast("Error koneksi: " + err.message, "error");
    }
  },

  // Load Arsip Seluruh Dokumen QC (Syarat RRR)
  async loadAllQCLogs() {
    const tbody = document.getElementById("historyQcTableBody");
    if (!tbody) return;

    if (CONFIG.USE_MOCK) {
      const allQC = this.getMockQCLogs();
      this.renderQCLogsTable(allQC);
      return;
    }

    try {
      const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "get_all_qc_logs" })
      });
      const res = await resp.json();
      if (res.success && res.data) {
        this.renderQCLogsTable(res.data);
      }
    } catch (err) {
      console.error("Gagal load history QC:", err);
    }
  },

  renderQCLogsTable(list) {
    const tbody = document.getElementById("historyQcTableBody");
    if (!tbody) return;

    if (!list || list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; color: var(--text-muted); padding: 24px;">
            Belum ada arsip dokumen QC tersimpan.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(item => `
      <tr>
        <td style="font-weight:700; color: #C53030;">${item.qcId}</td>
        <td style="font-weight:600;">${item.asid}</td>
        <td>${item.model} <br><small style="color:var(--text-muted); font-family: var(--font-mono);">${item.imeiSn}</small></td>
        <td>${item.teknisiA ? item.teknisiA.split("(")[0].trim() : '-'}</td>
        <td>${item.teknisiB ? item.teknisiB.split("(")[0].trim() : '<span class="badge badge-warning">Pending QC</span>'}</td>
        <td>${item.dateQc || item.tanggalInbound || '-'}</td>
        <td>
          <span class="badge ${item.statusQc === 'QC_Passed' ? 'badge-success' : 'badge-warning'}">
            ${item.statusQc === 'QC_Passed' ? '✅ QC Passed' : '⏳ Inbound Done'}
          </span>
        </td>
        <td>
          ${item.pdfQcUrl ? `
            <a href="${item.pdfQcUrl}" target="_blank" class="btn btn-sm btn-secondary" title="Unduh Form Sah PDF">
              📄 Unduh PDF
            </a>
          ` : `
            <span class="hint-text">Menunggu QC</span>
          `}
        </td>
      </tr>
    `).join("");
  },

  // ========================================================================
  // 3. MODUL TECHNICAL APPROVAL (5 TEMPLATES)
  // ========================================================================
  initTechModule(user) {
    if (!user) return;

    const fieldTek = document.getElementById("formTeknisiName");
    if (fieldTek) {
      fieldTek.value = `${user.namaLengkap} (${user.userId})`;
    }

    // Role-based view switching within Technical Module
    const isTech = Auth.isRequester();
    const isAppr = Auth.isApprover();

    const tekView = document.getElementById("teknisiView");
    const tsView = document.getElementById("tsView");

    if (tekView) tekView.style.display = isTech ? "block" : "none";
    if (tsView) tsView.style.display = isAppr ? "block" : "none";

    // Initial dynamic template render
    const selectJenis = document.getElementById("formJenisApproval");
    const container = document.getElementById("dynamicTemplateContainer");
    if (selectJenis && container) {
      FormTemplates.render(selectJenis.value, container);
    }

    if (isTech) this.loadTeknisiHistory();
    if (isAppr) this.loadPendingApprovals();
  },

  // Auto-save form draft
  triggerFormAutoSave() {
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      const draftData = {
        srNumber: document.getElementById("formSrNumber")?.value || "",
        imei: document.getElementById("formImei")?.value || "",
        model: document.getElementById("formModel")?.value || "",
        jenis: document.getElementById("formJenisApproval")?.value || "DOA Part",
        templateData: FormTemplates.extract(document.getElementById("formJenisApproval")?.value || "DOA Part")
      };
      StorageService.saveDraft("tech_form", draftData);
      const ind = document.getElementById("draftSaveIndicator");
      if (ind) {
        const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        ind.textContent = `💾 Draft tersimpan (${time})`;
      }
    }, 800);
  },

  restoreFormDraft() {
    const draft = StorageService.getDraft("tech_form");
    if (draft && draft.data) {
      const d = draft.data;
      if (document.getElementById("formSrNumber")) document.getElementById("formSrNumber").value = d.srNumber || "";
      if (document.getElementById("formImei")) document.getElementById("formImei").value = d.imei || "";
      if (document.getElementById("formModel")) document.getElementById("formModel").value = d.model || "";
      if (document.getElementById("formJenisApproval") && d.jenis) {
        document.getElementById("formJenisApproval").value = d.jenis;
        FormTemplates.render(d.jenis, document.getElementById("dynamicTemplateContainer"));
      }
    }
  },

  clearFormDraft() {
    StorageService.clearDraft("tech_form");
    const ind = document.getElementById("draftSaveIndicator");
    if (ind) ind.textContent = "💾 Auto-save aktif";
  },

  // Submit New Technical Request
  async submitNewRequest() {
    const user = Auth.getCurrentUser();
    const srNumber = document.getElementById("formSrNumber")?.value.trim();
    const imei = document.getElementById("formImei")?.value.trim();
    const model = document.getElementById("formModel")?.value.trim();
    const jenis = document.getElementById("formJenisApproval")?.value;

    if (!srNumber || !imei || !model || !jenis) {
      NotificationService.showToast("Lengkapi Nomor SR, IMEI, Model, dan Jenis Approval!", "error");
      return;
    }

    if (imei.length < 14) {
      NotificationService.showToast("Nomor IMEI harus 15 digit valid!", "error");
      return;
    }

    const detailData = FormTemplates.extract(jenis);
    const newReqId = FormTemplates.generateRequestId();

    const payload = {
      action: "submit_approval",
      request_id: newReqId,
      sr_number: srNumber,
      imei: imei,
      model_type: model,
      jenis_approval: jenis,
      teknisi_pemohon: `${user.namaLengkap} (${user.userId})`,
      detail_analisa: detailData,
      evidence_images: this.uploadedEvidenceImages
    };

    if (CONFIG.USE_MOCK) {
      const all = this.getMockRequests();
      const newReq = {
        requestId: newReqId,
        tanggalPengajuan: new Date().toLocaleString("id-ID"),
        srNumber: srNumber,
        imei: imei,
        modelType: model,
        jenisApproval: jenis,
        teknisiPemohon: payload.teknisi_pemohon,
        priority: "Normal",
        department: "Repair Engineering",
        detailAnalisa: detailData,
        statusApproval: "Pending",
        approverList: [],
        timestampApproved: "",
        pdfReportUrl: ""
      };
      all.unshift(newReq);
      this.saveMockRequests(all);

      AuditService.log("CREATE_REQUEST", newReqId, `Pengajuan ${jenis} untuk ${model} (SR: ${srNumber})`);
      NotificationService.showToast(`Pengajuan ${newReqId} berhasil dikirim ke antrean Tim TS!`, "success");
      NotificationService.addNotification("Pengajuan Baru Dibuat", `Pengajuan ${newReqId} (${jenis}) berhasil dikirim.`, "info");
      this.clearFormDraft();
      this.resetTeknisiForm();
      this.loadTeknisiHistory();
      return;
    }

    try {
      NotificationService.showToast("Mengunggah data pengajuan...", "info");
      const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      const res = await resp.json();
      if (res.success) {
        AuditService.log("CREATE_REQUEST", res.requestId || newReqId, `Pengajuan ${jenis}`);
        NotificationService.showToast(`Berhasil! Nomor Request: ${res.requestId || newReqId}`, "success");
        this.clearFormDraft();
        this.resetTeknisiForm();
        this.loadTeknisiHistory();
      } else {
        NotificationService.showToast("Gagal submit: " + res.message, "error");
      }
    } catch (err) {
      NotificationService.showToast("Error koneksi: " + err.message, "error");
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

  // Load Riwayat Pengajuan Teknisi
  loadTeknisiHistory() {
    const user = Auth.getCurrentUser();
    const tbody = document.getElementById("teknisiHistoryTableBody");
    if (!tbody || !user) return;

    const all = this.getMockRequests();
    const myRequests = all.filter(r => r.teknisiPemohon && r.teknisiPemohon.includes(user.userId));

    if (!myRequests.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
            Belum ada riwayat pengajuan yang dibuat.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = myRequests.map(r => `
      <tr>
        <td><strong style="color: var(--primary); cursor: pointer;" onclick="App.viewRequestDetail('${r.requestId}')">${r.requestId}</strong></td>
        <td>${r.srNumber || '-'}</td>
        <td>${r.modelType} <br><small style="color:var(--text-muted); font-family: var(--font-mono);">${r.imei}</small></td>
        <td><span style="font-weight: 600;">${r.jenisApproval}</span></td>
        <td><span class="badge badge-${r.statusApproval.toLowerCase().replace(/ /g, '-')}">${r.statusApproval}</span></td>
        <td>
          ${r.pdfReportUrl ? `
            <a href="${r.pdfReportUrl}" target="_blank" class="btn btn-sm btn-secondary" title="Unduh Form Resmi PDF">
              📄 Unduh PDF
            </a>
          ` : `
            <span class="hint-text">Menunggu Approval</span>
          `}
        </td>
      </tr>
    `).join("");
  },

  // Load Antrean Pending untuk Tim TS / Approver
  loadPendingApprovals() {
    const tbody = document.getElementById("tsPendingTableBody");
    const badge = document.getElementById("pendingCountBadge");
    if (!tbody) return;

    const all = this.getMockRequests();
    const pending = all.filter(r => r.statusApproval === "Pending");

    if (badge) badge.textContent = `${pending.length} Request`;

    if (!pending.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">
            🎉 Tidak ada pengajuan technical approval yang pending saat ini.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pending.map(r => `
      <tr>
        <td style="font-weight: 700; color: var(--primary);">${r.requestId}</td>
        <td>${r.srNumber || '-'}</td>
        <td>${r.modelType} <br><small style="color:var(--text-muted); font-family: var(--font-mono);">${r.imei}</small></td>
        <td><span style="font-weight: 600;">${r.jenisApproval}</span></td>
        <td>${r.teknisiPemohon ? r.teknisiPemohon.split("(")[0].trim() : '-'}</td>
        <td><span class="badge badge-warning">Pending</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="App.viewRequestDetail('${r.requestId}')">
            🔍 Tinjau
          </button>
        </td>
      </tr>
    `).join("");
  },

  // View Request Detail Modal with Multi-Level Timeline
  viewRequestDetail(requestId) {
    const all = this.getMockRequests();
    const item = all.find(r => r.requestId === requestId);
    if (!item) {
      NotificationService.showToast("Data pengajuan tidak ditemukan!", "error");
      return;
    }

    this.activeRequestDetail = item;

    document.getElementById("modalReqId").textContent = item.requestId;
    document.getElementById("modalSrNumber").textContent = item.srNumber || "-";
    document.getElementById("modalImei").textContent = item.imei || "-";
    document.getElementById("modalModel").textContent = item.modelType || "-";
    document.getElementById("modalJenis").textContent = item.jenisApproval || "-";
    document.getElementById("modalTeknisi").textContent = item.teknisiPemohon || "-";
    document.getElementById("modalAnalisaContent").textContent = JSON.stringify(item.detailAnalisa, null, 2);

    // Multi-Level Approval Timeline
    TimelineComponent.render("modalTimelineContainer", item);

    // Render Evidence Previews
    const previewBox = document.getElementById("modalEvidencePreview");
    if (previewBox) {
      previewBox.innerHTML = "";
      if (item.detailAnalisa && item.detailAnalisa.sketsa_fisik_drive_url) {
        previewBox.innerHTML += `
          <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 6px;">Lampiran Gambar:</h4>
          <img src="${item.detailAnalisa.sketsa_fisik_drive_url}" style="max-height: 180px; border-radius: 6px; border: 1px solid var(--border-default);">
        `;
      }
    }

    // Role visibility for approver actions
    const actionSection = document.getElementById("approverActionSection");
    if (actionSection) {
      actionSection.style.display = Auth.isApprover() ? "block" : "none";
    }

    document.getElementById("approvalModal").classList.add("show");
  },

  closeReviewModal() {
    document.getElementById("approvalModal")?.classList.remove("show");
    this.activeRequestDetail = null;
  },

  // Execute Multi-Level Approval Decision (Approved, Rejected, Need Revision)
  async executeApprovalDecision(decision) {
    const user = Auth.getCurrentUser();
    if (!this.activeRequestDetail) return;

    const notes = document.getElementById("modalApproverNotes")?.value.trim() || "";

    const approverEntry = {
      approver_id: user.userId,
      approver_name: user.namaLengkap,
      level: user.role,
      decision: decision,
      notes: notes || `Keputusan ${decision} oleh ${user.role}`,
      timestamp: new Date().toLocaleString("id-ID")
    };

    if (CONFIG.USE_MOCK) {
      const all = this.getMockRequests();
      const idx = all.findIndex(r => r.requestId === this.activeRequestDetail.requestId);
      if (idx !== -1) {
        all[idx].statusApproval = decision;
        if (!all[idx].approverList) all[idx].approverList = [];
        all[idx].approverList.push(approverEntry);

        if (decision === "Approved") {
          all[idx].timestampApproved = approverEntry.timestamp;
          all[idx].pdfReportUrl = "https://drive.google.com/file/d/demo-doa-part-pdf/view";
        }

        this.saveMockRequests(all);
      }

      AuditService.log(`${decision.toUpperCase().replace(/ /g, '_')}_REQUEST`, this.activeRequestDetail.requestId, `Catatan: ${notes || '-'}`);
      NotificationService.showToast(`Pengajuan ${this.activeRequestDetail.requestId} berhasil di-${decision}!`, decision === "Approved" ? "success" : "warning");
      NotificationService.addNotification(`Keputusan: ${decision}`, `Pengajuan ${this.activeRequestDetail.requestId} di-${decision} oleh ${user.namaLengkap}.`, decision === "Approved" ? "success" : "warning");
      this.closeReviewModal();
      this.loadPendingApprovals();
      if (window.RequestListView) RequestListView.render();
      if (window.DashboardView) DashboardView.render();
      return;
    }

    try {
      NotificationService.showToast("Menyimpan keputusan...", "info");
      const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "approve_request",
          request_id: this.activeRequestDetail.requestId,
          decision: decision,
          notes: notes,
          approver_name: user.namaLengkap,
          approver_id: user.userId
        })
      });
      const res = await resp.json();
      if (res.success) {
        AuditService.log(`${decision.toUpperCase().replace(/ /g, '_')}_REQUEST`, this.activeRequestDetail.requestId, notes);
        NotificationService.showToast("Keputusan berhasil disimpan!", "success");
        this.closeReviewModal();
        this.loadPendingApprovals();
        if (window.RequestListView) RequestListView.render();
      } else {
        NotificationService.showToast("Gagal: " + res.message, "error");
      }
    } catch (err) {
      NotificationService.showToast("Error koneksi: " + err.message, "error");
    }
  },

  // ========================================================================
  // 4. DRAG & DROP FILE UPLOADS
  // ========================================================================
  setupDragAndDrop() {
    const dropzone = document.getElementById("evidenceDropzone");
    const fileInput = document.getElementById("evidenceImageInput");

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener("click", () => fileInput.click());

    ["dragenter", "dragover"].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("dragover");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      const files = Array.from(dt.files);
      this.handleEvidenceFiles(files);
    });

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      this.handleEvidenceFiles(files);
    });
  },

  handleEvidenceFiles(files) {
    files.forEach(file => {
      if (!file.type.startsWith("image/")) {
        NotificationService.showToast(`File ${file.name} bukan format gambar valid!`, "warning");
        return;
      }
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

  // ========================================================================
  // 5. GLOBAL EVENTS & DEMO LOGINS
  // ========================================================================
  setupGlobalEvents() {
    // Login Form Submit
    const loginForm = document.getElementById("loginForm");
    loginForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const u = document.getElementById("loginUsername").value;
      const p = document.getElementById("loginPassword").value;
      const remember = document.getElementById("loginRememberMe")?.checked ?? true;

      const res = await Auth.login(u, p, remember);
      if (res.success) {
        NotificationService.showToast("Selamat datang, " + res.data.namaLengkap, "success");
        this.checkSessionAndRoute();
      } else {
        NotificationService.showToast(res.message, "error");
      }
    });

    // Quick Login Demo Buttons (6 Enterprise Roles)
    const quickLogins = [
      { id: "quickLoginAdmin", user: "admin", pass: "password123" },
      { id: "quickLoginSpv", user: "dimas.spv", pass: "password123" },
      { id: "quickLoginMgr", user: "hartono.mgr", pass: "password123" },
      { id: "quickLoginTeknisi", user: "budi.teknisi", pass: "password123" },
      { id: "quickLoginTeknisiB", user: "siti.teknisi", pass: "password123" },
      { id: "quickLoginTs", user: "agus.ts", pass: "password123" }
    ];

    quickLogins.forEach(q => {
      document.getElementById(q.id)?.addEventListener("click", async () => {
        document.getElementById("loginUsername").value = q.user;
        document.getElementById("loginPassword").value = q.pass;
        await Auth.login(q.user, q.pass, true);
        this.checkSessionAndRoute();
      });
    });

    // Logout
    document.getElementById("btnLogout")?.addEventListener("click", () => Auth.logout());

    // Switcher Tab QC Module (data-qctab)
    document.querySelectorAll("[data-qctab]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const targetTab = e.currentTarget.dataset.qctab;
        document.querySelectorAll("[data-qctab]").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");

        document.querySelectorAll("#view-qc-module .tab-panel").forEach(p => p.style.display = "none");
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
        const tab = e.currentTarget.dataset.tab;
        document.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");

        document.querySelectorAll("#view-tech-approval .tab-panel").forEach(p => p.style.display = "none");
        const activePanel = document.getElementById(tab);
        if (activePanel) activePanel.style.display = "block";
      });
    });

    // Template Selector Change
    document.getElementById("formJenisApproval")?.addEventListener("change", (e) => {
      FormTemplates.render(e.target.value, document.getElementById("dynamicTemplateContainer"));
      this.triggerFormAutoSave();
    });

    // Auto-save listeners on main technical inputs
    ["formSrNumber", "formImei", "formModel"].forEach(id => {
      document.getElementById(id)?.addEventListener("input", () => this.triggerFormAutoSave());
    });

    // Settings Modal
    const openSettings = () => {
      document.getElementById("inputAppsScriptUrl").value = CONFIG.APPS_SCRIPT_URL;
      document.getElementById("settingsModal").classList.add("show");
    };
    document.getElementById("btnOpenSettings")?.addEventListener("click", openSettings);
    document.getElementById("btnDropdownSettings")?.addEventListener("click", openSettings);
    document.getElementById("btnCloseSettings")?.addEventListener("click", () => {
      document.getElementById("settingsModal").classList.remove("show");
    });
    document.getElementById("btnSaveSettings")?.addEventListener("click", () => {
      const url = document.getElementById("inputAppsScriptUrl").value.trim();
      localStorage.setItem("MI_APPS_SCRIPT_URL", url);
      CONFIG.APPS_SCRIPT_URL = url;
      this.updateModeBadge();
      document.getElementById("settingsModal").classList.remove("show");
      NotificationService.showToast("URL Google Apps Script berhasil disimpan!", "success");
    });
  },

  // ========================================================================
  // 6. UNIFIED DATA GETTERS & CACHE HELPERS
  // ========================================================================
  getAllRequestsData() {
    return this.getMockRequests();
  },

  getAllQcData() {
    return this.getMockQCLogs();
  },

  getMockRequests() {
    return StorageService.getItem(CONFIG.STORAGE_KEYS.LOCAL_REQUESTS, CONFIG.MOCK_DATA.INITIAL_REQUESTS);
  },

  saveMockRequests(arr) {
    StorageService.setItem(CONFIG.STORAGE_KEYS.LOCAL_REQUESTS, arr);
  },

  getMockQCLogs() {
    return StorageService.getItem(CONFIG.STORAGE_KEYS.LOCAL_QC_LOGS, CONFIG.MOCK_DATA.INITIAL_QC_LOGS);
  },

  saveMockQCLogs(arr) {
    StorageService.setItem(CONFIG.STORAGE_KEYS.LOCAL_QC_LOGS, arr);
  },

  async refreshAllData() {
    if (!CONFIG.USE_MOCK && CONFIG.APPS_SCRIPT_URL) {
      try {
        const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "get_all_requests" })
        });
        const res = await resp.json();
        if (res.success && res.data) {
          this.saveMockRequests(res.data);
        }
      } catch (e) {
        console.warn("Refresh live data failed:", e);
      }
    }
  }
};

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => App.init());
