/**
 * ==========================================================================
 * XIAOMI SERVICE CENTER APPROVAL SYSTEM - PHYSICAL SKETCH CANVAS (IQC/OQC)
 * File: js/canvas-sketch.js
 * ==========================================================================
 * Modul kanvas interaktif untuk menandai cacat fisik awal (Inbound Physical Check)
 * sesuai SOP Xiaomi Unicom: Tanda panah penunjuk, label teks (Gompal, Scratch), dsb.
 */

const SketchCanvas = {
  canvas: null,
  ctx: null,
  currentTool: "arrow", // 'arrow', 'text', 'dent', 'scratch', 'crack', 'swelling', 'pen'
  actionsHistory: [],
  isDrawing: false,
  startPos: null,

  toolsConfig: {
    arrow: { color: "#D97706", label: "➡️ Panah Penunjuk", radius: 3 },
    text: { color: "#1F2937", label: "💬 Label Teks", radius: 0 },
    dent: { color: "#D97706", label: "🟡 Dent", radius: 8 },
    scratch: { color: "#2563EB", label: "🔵 Scratch", radius: 4 },
    crack: { color: "#DC2626", label: "🔴 Crack/Pecah", radius: 6 },
    swelling: { color: "#EA580C", label: "🟠 Kembung", radius: 14 },
    pen: { color: "#1F2937", label: "✏️ Coretan Bebas", radius: 2 }
  },

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");
    this.setupListeners();
    this.drawDeviceBlueprint();
  },

  drawDeviceBlueprint() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Background Putih
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    // Garis Grid Panduan
    ctx.strokeStyle = "#F1F5F9";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 1. TAMPAK BELAKANG (BACK COVER & KAMERA) - Mirip gambar di SOP Page 3
    const p1X = 60, p1Y = 25, pWidth = 150, pHeight = 250, pRadius = 16;
    this.drawRoundedRect(ctx, p1X, p1Y, pWidth, pHeight, pRadius, "#334155", 2);
    // Modul Kamera Khas Xiaomi (Lingkaran Besar / Deco)
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p1X + 45, p1Y + 45, 26, 0, Math.PI * 2);
    ctx.stroke();
    // Lensa Kamera
    ctx.fillStyle = "#64748B";
    ctx.beginPath(); ctx.arc(p1X + 38, p1Y + 38, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p1X + 54, p1Y + 52, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p1X + 54, p1Y + 38, 4, 0, Math.PI * 2); ctx.fill();
    // Flash & Mic
    ctx.beginPath(); ctx.arc(p1X + 38, p1Y + 54, 3, 0, Math.PI * 2); ctx.stroke();
    // Label
    ctx.fillStyle = "#1E293B";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TAMPAK BELAKANG", p1X + pWidth / 2, p1Y + pHeight + 20);

    // 2. TAMPAK DEPAN (LAYAR LCD & PUNCHHOLE)
    const p2X = 270, p2Y = 25;
    this.drawRoundedRect(ctx, p2X, p2Y, pWidth, pHeight, pRadius, "#334155", 2);
    // Bezel Dalam
    this.drawRoundedRect(ctx, p2X + 8, p2Y + 10, pWidth - 16, pHeight - 20, 6, "#CBD5E1", 1);
    // Kamera Depan (Punchhole)
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.arc(p2X + pWidth / 2, p2Y + 20, 4, 0, Math.PI * 2);
    ctx.fill();
    // Label
    ctx.fillStyle = "#1E293B";
    ctx.fillText("TAMPAK DEPAN (LAYAR)", p2X + pWidth / 2, p2Y + pHeight + 20);

    // Gambar ulang seluruh coretan/anotasi panah
    this.redrawActions();
  },

  drawRoundedRect(ctx, x, y, width, height, radius, strokeColor, lineWidth) {
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth || 1;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  },

  setupListeners() {
    const canvas = this.canvas;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if (e.touches && e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const startDrawing = (e) => {
      e.preventDefault();
      const pos = getPos(e);
      this.startPos = pos;
      this.isDrawing = true;

      if (this.currentTool === "text") {
        const text = prompt("Masukkan keterangan cacat (Contoh: Gompal, Layar ada scratch, Sedikit scratch):", "Layar ada scratch");
        if (text && text.trim() !== "") {
          this.actionsHistory.push({
            type: "text",
            text: text.trim(),
            x: pos.x,
            y: pos.y,
            color: "#B91C1C" // Red text
          });
          this.drawDeviceBlueprint();
        }
        this.isDrawing = false;
        return;
      }

      if (this.currentTool === "pen") {
        this.actionsHistory.push({
          type: "path",
          color: this.toolsConfig.pen.color,
          points: [pos]
        });
      } else if (this.currentTool === "arrow") {
        // Arrow will be finalized on mouseUp / touchend
      } else {
        // Stamp tool
        const cfg = this.toolsConfig[this.currentTool];
        this.actionsHistory.push({
          type: "stamp",
          tool: this.currentTool,
          x: pos.x,
          y: pos.y,
          color: cfg.color,
          radius: cfg.radius
        });
        this.drawDeviceBlueprint();
      }
    };

    const drawMove = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);

      if (this.currentTool === "pen") {
        const lastAction = this.actionsHistory[this.actionsHistory.length - 1];
        if (lastAction && lastAction.type === "path") {
          lastAction.points.push(pos);
          this.drawDeviceBlueprint();
        }
      } else if (this.currentTool === "arrow") {
        // Live preview panah sementara
        this.drawDeviceBlueprint();
        this.drawArrow(this.ctx, this.startPos.x, this.startPos.y, pos.x, pos.y, "#DC2626", 2);
      }
    };

    const stopDrawing = (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;

      if (this.currentTool === "arrow" && this.startPos) {
        let endPos = this.startPos;
        if (e.changedTouches && e.changedTouches.length > 0) {
          const rect = canvas.getBoundingClientRect();
          endPos = {
            x: (e.changedTouches[0].clientX - rect.left) * (canvas.width / rect.width),
            y: (e.changedTouches[0].clientY - rect.top) * (canvas.height / rect.height)
          };
        } else if (e.clientX !== undefined) {
          const rect = canvas.getBoundingClientRect();
          endPos = {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
          };
        }

        const dist = Math.hypot(endPos.x - this.startPos.x, endPos.y - this.startPos.y);
        if (dist > 5) {
          this.actionsHistory.push({
            type: "arrow",
            fromX: this.startPos.x,
            fromY: this.startPos.y,
            toX: endPos.x,
            toY: endPos.y,
            color: "#DC2626"
          });
        }
        this.drawDeviceBlueprint();
      }
      this.startPos = null;
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", drawMove);
    window.addEventListener("mouseup", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", drawMove, { passive: false });
    window.addEventListener("touchend", stopDrawing);
  },

  drawArrow(ctx, fromX, fromY, toX, toY, color = "#DC2626", lineWidth = 2) {
    const headlen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    // Batang panah
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Kepala panah
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  addQuickText(text) {
    // Menambahkan teks cepat di tengah layar untuk kemudian digeser atau ditandai
    this.actionsHistory.push({
      type: "text",
      text: text,
      x: 180,
      y: 150,
      color: "#B91C1C"
    });
    this.drawDeviceBlueprint();
  },

  setTool(toolName) {
    this.currentTool = toolName;
    document.querySelectorAll(".sketch-toolbar .tool-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tool === toolName);
    });
  },

  undo() {
    if (this.actionsHistory.length > 0) {
      this.actionsHistory.pop();
      this.drawDeviceBlueprint();
    }
  },

  clear() {
    this.actionsHistory = [];
    this.drawDeviceBlueprint();
  },

  redrawActions() {
    const ctx = this.ctx;

    this.actionsHistory.forEach(act => {
      if (act.type === "arrow") {
        this.drawArrow(ctx, act.fromX, act.fromY, act.toX, act.toY, act.color, 2);
      } else if (act.type === "text") {
        ctx.save();
        ctx.fillStyle = act.color || "#B91C1C";
        ctx.font = "bold 12px Arial, sans-serif";
        ctx.fillText(act.text, act.x, act.y);
        ctx.restore();
      } else if (act.type === "stamp") {
        ctx.save();
        ctx.fillStyle = act.color;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(act.x, act.y, act.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (act.type === "path" && act.points.length > 1) {
        ctx.save();
        ctx.strokeStyle = act.color;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(act.points[0].x, act.points[0].y);
        for (let i = 1; i < act.points.length; i++) {
          ctx.lineTo(act.points[i].x, act.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }
    });
  },

  getBase64Image() {
    if (!this.canvas) return "";
    return this.canvas.toDataURL("image/png");
  }
};
