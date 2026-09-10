import React, { useEffect, useRef, useState } from "react";
import { X, Camera } from "lucide-react";
import QrScanner from "qr-scanner";
// ไม่ต้องตั้ง QrScanner.WORKER_PATH เอง — qr-scanner โหลด worker ผ่าน dynamic import ซึ่ง Vite (Rollup) จัดการให้อัตโนมัติอยู่แล้ว

// ป็อปอัปเปิดกล้องมือถือ/คอมสแกน QR code — ใช้ในหน้า "เช็คชื่อกิจกรรม" (UserCheckin.jsx) ให้เจ้าหน้าที่ทีม
// สแกน QR ประจำตัวของเพื่อนในสีเดียวกันแทนการกดเลือกชื่อจากลิสต์ สแกนเจอครั้งแรกจะเรียก onScan(text) แล้วปิดกล้องเอง
// (กันสแกนซ้ำรัวๆ ก่อนที่ผลจะถูกประมวลผลเสร็จ) ต้องขออนุญาตใช้กล้องจากเบราว์เซอร์ก่อนถึงจะเห็นภาพ
export default function QRScannerModal({ open, onScan, onClose }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        scanner.stop();
        onScan(result.data);
      },
      { highlightScanRegion: true, highlightCodeOutline: true }
    );
    scannerRef.current = scanner;
    scanner.start().catch(() => setError("เปิดกล้องไม่สำเร็จ กรุณาอนุญาตให้เว็บนี้ใช้กล้องก่อน"));

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div
            className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5"
            style={{ fontFamily: "Kanit, sans-serif" }}
          >
            <Camera size={16} className="text-indigo-400" /> สแกน QR เพื่อเช็คชื่อ
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        <video ref={videoRef} className="w-full rounded-lg bg-black aspect-square object-cover" muted playsInline />
        {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
        <div className="mt-3 text-xs text-slate-400 text-center">เล็งกล้องไปที่ QR ประจำตัวของนักศึกษาที่ต้องการเช็คชื่อ</div>
      </div>
    </div>
  );
}
