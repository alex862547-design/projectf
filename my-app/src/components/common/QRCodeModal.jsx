import React, { useState } from "react";
import { X, Share2, Copy, Check } from "lucide-react";
import QRCodeImage from "./QRCodeImage";

// ป็อปอัปโชว์ QR code ตัวใหญ่ๆ ให้คนอื่นสแกน — ใช้ 2 ที่: "QR เว็บไซต์" (แชร์ลิงก์เข้าเว็บ) และ
// "QR เช็คชื่อของฉัน" (ให้เจ้าหน้าที่ทีมสแกนเช็คชื่อ) เปิดจากปุ่มในโปรไฟล์ (Shell.jsx)
// ใส่ shareable=true เฉพาะตอนที่ value เป็นลิงก์ที่ปลอดภัยจะแชร์ต่อสาธารณะได้ (เช่น QR เว็บไซต์)
// ห้ามใส่กับ QR เช็คชื่อของนักศึกษา เพราะเป็นรหัสประจำตัวเฉพาะคน ไม่ควรถูกแชร์ออกไปที่อื่น
export default function QRCodeModal({ open, title, description, value, shareable = false, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const canNativeShare = shareable && typeof navigator !== "undefined" && !!navigator.share;

  const doNativeShare = async () => {
    try {
      await navigator.share({ title, url: value });
    } catch {
      // ผู้ใช้กดยกเลิกกล่องแชร์เอง ไม่ต้องแจ้ง error
    }
  };

  const doCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // เบราว์เซอร์บางตัวไม่ให้สิทธิ์คัดลอกอัตโนมัติ ปล่อยให้ผู้ใช้คัดลอกเองจาก QR/ลิงก์ที่โชว์แทน
    }
  };

  const encodedUrl = shareable ? encodeURIComponent(value) : "";

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

        {shareable && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {canNativeShare && (
              <button
                onClick={doNativeShare}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700"
              >
                <Share2 size={14} /> แชร์
              </button>
            )}
            <a
              href={`https://social-plugins.line.me/lineit/share?url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-[#06C755] text-white text-xs font-semibold px-3.5 py-2 hover:opacity-90"
            >
              LINE
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-[#1877F2] text-white text-xs font-semibold px-3.5 py-2 hover:opacity-90"
            >
              Facebook
            </a>
            {/* fb-messenger:// เป็น deep link เปิดแอป Messenger ตรงๆ ใช้ได้บนมือถือที่ติดตั้งแอปไว้เท่านั้น
                บนคอมที่ไม่มีแอปรองรับ ลิงก์นี้จะไม่ทำอะไรเฉยๆ (เบราว์เซอร์จัดการเอง ไม่มี error ให้เห็น) */}
            <a
              href={`fb-messenger://share/?link=${encodedUrl}`}
              className="flex items-center gap-1.5 rounded-lg bg-[#0084FF] text-white text-xs font-semibold px-3.5 py-2 hover:opacity-90"
            >
              Messenger
            </a>
            <button
              onClick={doCopyLink}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
