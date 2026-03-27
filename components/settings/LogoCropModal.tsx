"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, ZoomIn, ZoomOut, Check } from "lucide-react";

interface LogoCropModalProps {
  file: File;
  onCrop: (croppedBlob: Blob) => void;
  onClose: () => void;
}

export default function LogoCropModal({
  file,
  onCrop,
  onClose,
}: LogoCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  // 16:9 crop area
  const CROP_W = 384;
  const CROP_H = 216;

  useEffect(() => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setImage(img);
      // Fit image so it covers the crop area
      const scaleW = CROP_W / img.width;
      const scaleH = CROP_H / img.height;
      const fitScale = Math.max(scaleW, scaleH);
      setScale(fitScale);
      setOffset({
        x: (CROP_W - img.width * fitScale) / 2,
        y: (CROP_H - img.height * fitScale) / 2,
      });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CROP_W;
    canvas.height = CROP_H;

    ctx.clearRect(0, 0, CROP_W, CROP_H);
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, CROP_W, CROP_H);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, CROP_W, CROP_H, 12);
    ctx.clip();
    ctx.drawImage(
      image,
      offset.x,
      offset.y,
      image.width * scale,
      image.height * scale,
    );
    ctx.restore();

    // Draw border
    ctx.beginPath();
    ctx.roundRect(1, 1, CROP_W - 2, CROP_H - 2, 12);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [image, scale, offset]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({
      x: offsetStart.current.x + (e.clientX - dragStart.current.x),
      y: offsetStart.current.y + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => setDragging(false);

  const handleZoom = (delta: number) => {
    setScale((prev) => {
      const next = Math.max(0.05, Math.min(5, prev + delta));
      if (!image) return next;
      const cx = CROP_W / 2;
      const cy = CROP_H / 2;
      const ratio = next / prev;
      setOffset((o) => ({
        x: cx - (cx - o.x) * ratio,
        y: cy - (cy - o.y) * ratio,
      }));
      return next;
    });
  };

  const handleCrop = () => {
    if (!image) return;

    // Output at 1920x1080 for clarity
    const OUT_W = 1920;
    const OUT_H = 1080;
    const outCanvas = document.createElement("canvas");
    outCanvas.width = OUT_W;
    outCanvas.height = OUT_H;
    const ctx = outCanvas.getContext("2d");
    if (!ctx) return;

    const ratioX = OUT_W / CROP_W;
    const ratioY = OUT_H / CROP_H;

    ctx.drawImage(
      image,
      offset.x * ratioX,
      offset.y * ratioY,
      image.width * scale * ratioX,
      image.height * scale * ratioY,
    );

    outCanvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      "image/webp",
      0.9,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-[460px] max-w-[95vw]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Crop Logo</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Drag to reposition. Use zoom to adjust. 16:9 ratio.
        </p>

        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            width={CROP_W}
            height={CROP_H}
            className="cursor-move rounded-xl"
            style={{ width: CROP_W, height: CROP_H }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        <div className="flex items-center justify-center gap-4 mb-5">
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <input
            type="range"
            min="0.05"
            max="5"
            step="0.05"
            value={scale}
            onChange={(e) => {
              const newScale = parseFloat(e.target.value);
              handleZoom(newScale - scale);
            }}
            className="w-40 accent-red-600"
          />
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
}
