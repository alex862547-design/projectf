import React from "react";
import { X } from "lucide-react";
import QRCodeImage from "./QRCodeImage";

// ป็อปอัปโชว์ QR code ตัวใหญ่ๆ ให้คนอื่นสแกน — ใช้ 2 ที่: "QR เว็บไซต์" (แชร์ลิงก์เข้าเว็บ) และ
// "QR เช็คชื่อของฉัน" (ให้เจ้าหน้าที่ทีมสแกนเช็คชื่อ) เปิดจากปุ่มในโปรไฟล์ (Shell.jsx)
export default function QRCodeModal({ open, title, description, value, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
            {title}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        <div className="flex justify-center bg-white p-3 rounded-xl">
          <QRCodeImage value={value} />
        </div>
        {description && <div className="mt-4 text-xs text-slate-400 leading-relaxed">{description}</div>}
      </div>
    </div>
  );
}
