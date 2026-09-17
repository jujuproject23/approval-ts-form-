/**
 * ==========================================================================
 * XIAOMI SERVICE CENTER APPROVAL SYSTEM - CLIENT CONFIGURATION
 * File: js/config.js
 * ==========================================================================
 * Konfigurasi API Endpoint Apps Script & Pengalih Mode Offline / Mock Data
 */

const CONFIG = {
  // Masukkan URL Deployment Google Apps Script Web App Anda disini:
  // Contoh: "https://script.google.com/macros/s/AKfycbx.../exec"
  APPS_SCRIPT_URL:"https://script.google.com/macros/s/AKfycbxPYgb-xtHh6CO4UVoJvYj9ZXZOPqgYoxRZZl1ksxiE4UeWIQnzERilB6tItMHfR4Unow/exec" || "",

  // Jika APPS_SCRIPT_URL kosong, otomatis menggunakan MOCK_MODE agar
  // antarmuka dan alur aplikasi bisa diuji langsung di browser tanpa backend!
  get USE_MOCK() {
    return !this.APPS_SCRIPT_URL || this.APPS_SCRIPT_URL.trim() === "";
  },

  APP_TITLE: "Xiaomi Service Center Approval System",
  VERSION: "2.0.0",

  STORAGE_KEYS: {
    AUTH_USER: "mi_auth_user",
    LOCAL_REQUESTS: "mi_local_requests",
    AUDIT_LOGS: "mi_audit_logs"
  },

  // DATASET SIMULASI OFFLINE / DEMO CEPAT
  MOCK_DATA: {
    USERS: [
      {
        userId: "TEK-001",
        namaLengkap: "Budi Santoso",
        username: "budi.teknisi",
        password: "password123",
        role: "Teknisi",
        status: "Aktif"
      },
      {
        userId: "TS-001",
        namaLengkap: "Agus Salim",
        username: "agus.ts",
        password: "password123",
        role: "Tim_TS",
        status: "Aktif"
      },
      {
        userId: "TS-002",
        namaLengkap: "Rendra Pratama",
        username: "rendra.ts",
        password: "password123",
        role: "Tim_TS",
        status: "Aktif"
      }
    ],

    INITIAL_REQUESTS: [
      {
        requestId: "REQ-20260917-0001",
        tanggalPengajuan: "2026-09-17 09:15:00",
        srNumber: "SR-XMI-202609-001",
        imei: "867492051234567",
        modelType: "Xiaomi 14 Ultra",
        jenisApproval: "Case Battery Kembung",
        teknisiPemohon: "Budi Santoso (TEK-001)",
        detailAnalisa: {
          template: "Case Battery Kembung",
          ketebalan_aktual_mm: "6.3",
          ketebalan_standar_mm: "4.2",
          persentase_ekspansi: "50%",
          kondisi_fisik_iqc: {
            backdoor: "Terangkat 3mm di sisi tombol power",
            lcd: "Normal, tidak ada pressure mark",
            lci: "White (Normal)"
          },
          sketsa_fisik_drive_url: "https://via.placeholder.com/600x300.png?text=Sketsa+Fisik+IQC+Baterai+Kembung"
        },
        statusApproval: "Pending",
        approverList: [],
        timestampApproved: "",
        pdfReportUrl: ""
      },
      {
        requestId: "REQ-20260917-0002",
        tanggalPengajuan: "2026-09-17 11:30:00",
        srNumber: "SR-XMI-202609-044",
        imei: "867492059998877",
        modelType: "Redmi Note 13 Pro 5G",
        jenisApproval: "DOA Part",
        teknisiPemohon: "Siti Rahma (TEK-002)",
        detailAnalisa: {
          template: "DOA Part",
          part_number: "508000012900",
          part_description: "SUB_BOARD_FPC_CHARGING",
          gejala_doa: "Port Type-C pin dalam bengkok dari kemasan baru"
        },
        statusApproval: "Approved",
        approverList: [
          {
            approver_id: "TS-001",
            approver_name: "Agus Salim",
            level: "TS Specialist",
            decision: "Approved",
            notes: "Fisik pin FPC memang cacat produksi pabrik. Approve tukar part.",
            timestamp: "2026-09-17 13:00:00"
          }
        ],
        timestampApproved: "2026-09-17 13:00:00",
        pdfReportUrl: "https://drive.google.com/file/d/demo-doa-part-pdf/view"
      }
    ],

    // MOCK DATA KHUSUS MODUL QC PHYSICAL CHECK (SOP UNICOM XIAOMI)
    INITIAL_QC_LOGS: [
      {
        qcId: "QC-20260821-0001",
        tanggalInbound: "2026-08-21 08:45:00",
        asid: "ASID230726000002",
        model: "Xiaomi 17",
        imeiSn: "3332125612323",
        namaCustomer: "Hendra Wijaya",
        teknisiA: "Budi Santoso (TEK-001)",
        inboundData: {
          catatan_cacat_awal: "Gompal sudut kiri atas, Layar ada scratch halus, Sedikit scratch di backdoor",
          sketsa_image_url: "",
          nama_customer: "Hendra Wijaya"
        },
        signTeknisiA: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        signCustomer: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        teknisiB: "Siti Rahma (TEK-002)",
        outboundChecklist: {
          back_cover_lem_rapat: true,
          kamera_belakang_bersih: true,
          kamera_depan_bersih: true,
          fisik_hp_bersih: true
        },
        dateQc: "2026-08-21",
        signTeknisiB: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        statusQc: "QC_Passed",
        pdfQcUrl: "https://drive.google.com/file/d/mock-qc-sop-pdf/view"
      },
      {
        qcId: "QC-20260821-0002",
        tanggalInbound: "2026-08-21 10:15:00",
        asid: "ASID230726000099",
        model: "Redmi Note 13 Pro",
        imeiSn: "867492051239999",
        namaCustomer: "Ibu Maya",
        teknisiA: "Budi Santoso (TEK-001)",
        inboundData: {
          catatan_cacat_awal: "Back cover renggang, goresan pada bezel kanan",
          sketsa_image_url: "",
          nama_customer: "Ibu Maya"
        },
        signTeknisiA: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        signCustomer: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        teknisiB: "",
        outboundChecklist: {},
        dateQc: "",
        signTeknisiB: "",
        statusQc: "Inbound_Completed",
        pdfQcUrl: ""
      }
    ]
  }
};
