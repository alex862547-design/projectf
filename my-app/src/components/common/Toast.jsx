import React, { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

// ข้อความแจ้งเตือนลอยมุมขวาล่างของจอ (สำเร็จ/ผิดพลาด) หายเองใน 3 วินาที — App.jsx เก็บ state `toast`
// ไว้ที่เดียว แล้วส่งลงมาให้ทุกหน้าเรียก setToast({type, message}) เพื่อโชว์แจ้งเตือนได้จากที่ไหนก็ได้ในแอป
export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const isError = toast.type === "error";

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div
        className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
          isError ? "bg-red-600 text-white" : "bg-slate-900 text-white"
        }`}
      >
        {isError ? <XCircle size={18} /> : <CheckCircle2 size={18} className="text-emerald-400" />}
        {toast.message}
      </div>
    </div>
  );
}
