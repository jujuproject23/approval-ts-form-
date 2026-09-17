/**
 * ==========================================================================
 * XIAOMI SERVICE CENTER - DIGITAL SIGNATURE PAD MODULE
 * File: js/signature-pad.js
 * ==========================================================================
 * Mengelola pembubuhan tanda tangan digital untuk Teknisi A dan Teknisi B.
 */

class DigitalSignaturePad {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.isDrawing = false;
    this.hasDrawn = false;

    this.initCanvas();
    this.attachEvents();
  }

  initCanvas() {
    const ctx = this.ctx;
    ctx.strokeStyle = "#1A202C";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    this.clear();
  }

  attachEvents() {
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

    const start = (e) => {
      e.preventDefault();
      this.isDrawing = true;
      this.hasDrawn = true;
      const p = getPos(e);
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
    };

    const move = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const p = getPos(e);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.stroke();
    };

    const stop = () => {
      if (this.isDrawing) {
        this.isDrawing = false;
      }
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);

    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", stop);
  }

  clear() {
    if (!this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Background putih bersih untuk PDF
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.hasDrawn = false;
  }

  isEmpty() {
    return !this.hasDrawn;
  }

  getBase64PNG() {
    if (!this.canvas || this.isEmpty()) return "";
    return this.canvas.toDataURL("image/png");
  }
}
