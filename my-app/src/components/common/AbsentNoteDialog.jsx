import React, { useState } from "react";

export default function AbsentNoteDialog({ open, studentName, onCancel, onConfirm }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const submit = () => {
    if (!message.trim()) {
      setError("กรุณาระบุเหตุผลหรือข้อความสั้นๆ ก่อนยืนยัน");
      return;
    }
    onConfirm(message.trim());
    setMessage("");
    setError("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onCancel}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
          เช็คขาด{studentName ? `: ${studentName}` : ""}
        </div>
        <div className="text-xs text-slate-400 mt-1.5">
          พิมพ์เหตุผลหรือข้อความถึงนักศึกษาคนนี้ (จะส่งไปแสดงในปฏิทินของเขา และเขาตอบกลับได้)
        </div>
        <textarea
          autoFocus
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (error) setError("");
          }}
          placeholder="เช่น ไม่มาตามนัด ติดต่อกลับด้วย"
          rows={3}
          className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <div className="mt-1.5 text-xs text-red-400">{error}</div>}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold px-3.5 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ยกเลิก
          </button>
          <button
            onClick={submit}
            className="flex-1 rounded-lg bg-red-600 text-white text-xs font-semibold px-3.5 py-2.5 hover:bg-red-700"
          >
            ยืนยันเช็คขาด
          </button>
        </div>
      </div>
    </div>
  );
}
