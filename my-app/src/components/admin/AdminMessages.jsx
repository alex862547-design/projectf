import React, { useEffect, useState } from "react";
import { Inbox, MessageCircle } from "lucide-react";
import { api } from "../../api";
import { formatThaiDateTime } from "../../utils/helpers";
import AdminMessageModal from "../common/AdminMessageModal";

// หน้าแอดมิน "ข้อความนักศึกษา" — ลิสต์ทุกห้องแชทระหว่างนักศึกษากับแอดมิน (นักศึกษา 1 คน = 1 ห้อง)
// เรียงจากข้อความล่าสุดก่อน เลขแดงบอกจำนวนที่นักศึกษาส่งมาแล้วแอดมินยังไม่ได้เปิดอ่าน กดแถวไหนเปิด
// AdminMessageModal เพื่อดู/ตอบห้องนั้น (คนละเรื่องกับ "กล่องข้อความ" ในหน้าจัดการเช็คชื่อที่คุยเรื่องเช็คชื่อ)
export default function AdminMessages() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openThread, setOpenThread] = useState(null); // { studentId, studentName }

  const load = () => {
    setLoading(true);
    setError("");
    api
      .getAdminMessageThreads()
      .then(setThreads)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="px-4 md:px-8 pb-10">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <Inbox size={16} className="text-indigo-400" />
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
            กล่องข้อความจากนักศึกษา
          </div>
        </div>

        {loading && <div className="text-center text-xs text-slate-400 py-10">กำลังโหลด...</div>}
        {!loading && error && <div className="text-center text-xs text-red-400 py-10">{error}</div>}
        {!loading && !error && threads.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-10">ยังไม่มีข้อความจากนักศึกษา</div>
        )}
        {!loading &&
          !error &&
          threads.map((t) => (
            <button
              key={t.studentId}
              onClick={() => setOpenThread({ studentId: t.studentId, studentName: t.studentName })}
              className="w-full flex items-start gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/60 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-left"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                {t.studentName.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{t.studentName}</div>
                  <div className="text-[11px] text-slate-400 shrink-0">{formatThaiDateTime(t.lastAt)}</div>
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

      <AdminMessageModal
        open={!!openThread}
        studentId={openThread?.studentId}
        viewerRole="admin"
        title={openThread?.studentName}
        subtitle={`รหัสนักศึกษา ${openThread?.studentId || ""}`}
        onClose={() => {
          setOpenThread(null);
          load();
        }}
      />
    </div>
  );
}
