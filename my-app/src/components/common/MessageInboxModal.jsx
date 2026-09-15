import React, { useEffect, useState } from "react";
import { X, Inbox, MessageCircle } from "lucide-react";
import { api } from "../../api";
import { formatThaiDate } from "../../utils/helpers";

// กล่องข้อความรวมของผู้เช็คชื่อ — ลิสต์ทุก "ห้องแชท" (นักศึกษา 1 คน x วันที่ 1 วัน = 1 ห้อง) ที่เข้าถึงได้
// (เจ้าหน้าที่ทีมเห็นเฉพาะสีตัวเอง, แอดมินเห็นทั้งหมด) เรียงจากข้อความล่าสุดก่อน มีเลขแดงบอกจำนวนที่นักศึกษา
// ตอบกลับมาแล้วยังไม่ได้เปิดอ่าน — กดแถวไหนจะเรียก onOpenThread(studentId, date) ให้ตัวเรียกใช้เปิด
// AttendanceThreadModal ต่อเอง (โมดัลนี้ไม่เปิดแชทเองตรงๆ เพื่อให้ใช้ modal เดียวกับที่มีอยู่แล้วทั้งเว็บ)
export default function MessageInboxModal({ open, onOpenThread, onClose }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .getMessageThreads()
      .then(setThreads)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Inbox size={16} className="text-indigo-400" />
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
              กล่องข้อความ
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <div className="text-center text-xs text-slate-400 py-8">กำลังโหลด...</div>}
          {!loading && error && <div className="text-center text-xs text-red-400 py-8">{error}</div>}
          {!loading && !error && threads.length === 0 && (
            <div className="text-center text-xs text-slate-400 py-8">ยังไม่มีข้อความ</div>
          )}
          {!loading &&
            !error &&
            threads.map((t) => (
              <button
                key={`${t.studentId}-${t.date}`}
                onClick={() => onOpenThread(t.studentId, t.date)}
                className="w-full flex items-start gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/60 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-left"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                  {t.studentName.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{t.studentName}</div>
                    <div className="text-[11px] text-slate-400 shrink-0">{formatThaiDate(t.date)}</div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                    <MessageCircle size={11} className="shrink-0" />
                    {t.lastSenderRole === "student" ? "" : "คุณ: "}
                    {t.lastMessage}
                  </div>
                </div>
                {t.unreadCount > 0 && (
                  <span className="shrink-0 flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold">
                    {t.unreadCount > 99 ? "99+" : t.unreadCount}
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
