import React, { useEffect, useState } from "react";
import { X, Users as UsersIcon, Calendar, Trophy } from "lucide-react";
import Badge from "../common/Badge";
import { api } from "../../api";
import { formatThaiDate, extractSportFromRole as extractSport, normalizeSportName as normalize, sortStudentsByYear } from "../../utils/helpers";

// แถบปุ่มลัดตำแหน่ง/กิจกรรม (ฟุตบอล, กองเชียร์ ฯลฯ) อยู่ใต้แบนเนอร์วันนี้ในหน้าหลัก (UserHome/GuestHome)
// กดปุ่มไหนจะเปิดป็อปอัปโชว์ตารางแข่งขันของกีฬานั้น (ถ้ามี) และรายชื่อนักศึกษาทั้งหมดของทีมสีเดียวกันในตำแหน่งนั้น
// เป็นข้อมูลสาธารณะ ไม่ใช่ข้อมูลส่วนตัว จึงใช้ได้ทั้งหน้านักศึกษาและหน้าเยี่ยมชม (ไม่ล็อกอิน)
export default function ActivityShortcuts({ students, roles }) {
  const [matches, setMatches] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null); // ตำแหน่ง/กิจกรรมที่กำลังเปิดดูรายละเอียด (ค่าดิบตรงตาม role)

  // ดึงรายการแข่งขันเองแยกต่างหาก ทุก 4 วินาที เพื่อให้ปุ่มลัดชุดนี้อัปเดตแบบเรียลไทม์
  // (ไม่ใช้ matches ที่ App.jsx โหลดตอนแรก เพราะตัวนั้นตั้งใจไม่รีเฟรชอัตโนมัติ
  //  กันไม่ให้ไปทับคะแนนที่แอดมินอาจกำลังพิมพ์ค้างอยู่ในหน้าจัดการแข่งขัน)
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api
        .getMatches()
        .then((m) => {
          if (!cancelled) setMatches(m);
        })
        .catch(() => {});
    load();
    const interval = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ปุ่มลัด: ตำแหน่ง/ประเภทกิจกรรมทั้งหมดที่แอดมินตั้งไว้ในหน้าจัดการนักศึกษา (ไม่ใช่จากตารางแข่งขัน)
  // เพื่อให้ปุ่มลัดตรงกับตำแหน่งจริงในระบบเสมอ ไม่ว่าจะมีตารางแข่งขันของตัวเอง (เช่น ฟุตบอล) หรือไม่ (เช่น กองเชียร์)
  const activities = (roles || []).map((role) => {
    const sport = extractSport(role);
    return { role, label: sport || role, hasSchedule: !!sport };
  });

  if (activities.length === 0) return null;

  const selected = activities.find((a) => a.role === selectedRole) || null;
  const activeMatches = selected?.hasSchedule
    ? matches.filter((m) => normalize(m.sport) === normalize(selected.label))
    : [];
  const activeStudents = sortStudentsByYear((students || []).filter((s) => s.role === selectedRole));

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {activities.map((a) => (
          <button
            key={a.role}
            onClick={() => setSelectedRole(a.role)}
            className="shrink-0 flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400 transition"
          >
            {a.hasSchedule ? (
              <Trophy size={13} className="text-indigo-400" />
            ) : (
              <UsersIcon size={13} className="text-indigo-400" />
            )}
            {a.label}
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => setSelectedRole(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
                {selected.label}
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {selected.hasSchedule && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                    <Calendar size={13} /> ตารางแข่งขัน/คะแนน
                  </div>
                  {activeMatches.length === 0 && <div className="text-xs text-slate-500">ไม่มีรายการแข่งขัน</div>}
                  <div className="space-y-2">
                    {activeMatches.map((m) => (
                      <div key={m.id} className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2.5">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                          <span>{formatThaiDate(m.date)} · {m.time}</span>
                          <span>{m.venue}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                          <Badge team={m.teamA} />
                          <span className="text-slate-400">
                            {m.status === "จบการแข่งขัน" ? `${m.scoreA} - ${m.scoreB}` : "vs"}
                          </span>
                          <Badge team={m.teamB} />
                        </div>
                        {m.note && <div className="mt-1.5 text-xs text-slate-400 italic text-center">{m.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <UsersIcon size={13} /> นักศึกษาในกิจกรรมนี้ ({activeStudents.length} คน)
                </div>
                {activeStudents.length === 0 && (
                  <div className="text-xs text-slate-500">ยังไม่มีนักศึกษาในตำแหน่งนี้</div>
                )}
                <div className="space-y-2">
                  {activeStudents.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <div className="text-slate-700 dark:text-slate-300 font-medium truncate">{s.name}</div>
                        <div className="text-[11px] text-slate-400">รหัส {s.id} · {s.year || "ไม่ระบุชั้นปี"}</div>
                      </div>
                      <Badge team={s.team} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
