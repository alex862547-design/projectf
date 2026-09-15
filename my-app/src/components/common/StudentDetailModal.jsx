import React from "react";
import { X, UserRound, Trophy, ShieldCheck, Clock } from "lucide-react";
import Badge from "./Badge";
import AttendanceDonut from "./AttendanceDonut";
import { formatThaiDate, formatShortTime } from "../../utils/helpers";

// ป็อปอัปดูข้อมูลนักศึกษาแบบย่อ (ประวัติการเช็คชื่อ, สังกัดสี, ตำแหน่ง) เปิดจากการกดชื่อนักศึกษาในหน้า
// "จัดการเช็คชื่อ" ของแอดมิน (AdminCheckins.jsx) ให้ดูข้อมูลของคนนั้นได้ทันทีโดยไม่ต้องสลับไปหน้า
// "จัดการนักศึกษา" — ไม่มี state ของตัวเอง แค่รับ student ที่จะโชว์มา (null = ปิดป็อปอัป)
export default function StudentDetailModal({ student, checkins, matches, onClose }) {
  if (!student) return null;

  const history = checkins
    .filter((c) => c.studentId === student.id)
    .map((c) => ({ ...c, match: matches.find((m) => m.id === c.matchId) }))
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.time || "").localeCompare(a.time || ""));
  const presentCount = history.filter((c) => (c.status || "present") === "present").length;
  const absentCount = history.filter((c) => c.status === "absent").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <UserRound size={16} className="text-indigo-400" />
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
              ข้อมูลนักศึกษา
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
              {student.name.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{student.name}</div>
              <div className="text-xs text-slate-400">รหัส {student.id} · {student.year || "ไม่ระบุชั้นปี"}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge team={student.team} />
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400">
              <Trophy size={11} /> {student.role || "ไม่ระบุตำแหน่ง"}
            </span>
            {student.canCheckin && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                <ShieldCheck size={11} /> มีสิทธิ์เช็คชื่อ
              </span>
            )}
          </div>

          {history.length > 0 && (
            <div className="flex items-center justify-center">
              <AttendanceDonut present={presentCount} absent={absentCount} />
            </div>
          )}

          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Clock size={13} /> ประวัติการเช็คชื่อ ({history.length} รายการ)
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
              {history.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">ยังไม่มีประวัติการเช็คชื่อ</div>
              )}
              {history.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {c.match ? c.match.sport : (student.role || "เช็คชื่อทั่วไป")}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatThaiDate(c.date)}{c.time ? ` · ${formatShortTime(c.time)} น.` : ""}
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${c.status === "absent" ? "text-red-400" : "text-emerald-400"}`}>
                    {c.status === "absent" ? "เช็คขาด" : "มาเข้าร่วม"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
