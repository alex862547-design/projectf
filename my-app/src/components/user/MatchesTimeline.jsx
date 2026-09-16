import React, { useMemo, useState } from "react";
import { CalendarRange, ChevronDown, MapPin, Clock, Trophy, Crown, X, Users as UsersIcon } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import StatusPill from "../common/StatusPill";
import { formatThaiFullDate, formatShortTime, extractSportFromRole, normalizeSportName, sortStudentsByYear } from "../../utils/helpers";

// การ์ดแมตช์เดียว — ทีมเอ vs ทีมบี พร้อมคะแนน (โชว์คะแนนจริงเฉพาะที่จบแล้ว), มงกุฎให้ทีมที่ชนะ,
// แถบสถานะ, และรายละเอียดเวลา/สนามด้านล่าง — กดชื่อทีมเปิดดูรายชื่อนักกีฬาที่แข่งกีฬานี้ของทีมนั้นได้ (onSelectTeam)
function MatchCard({ match, onSelectTeam }) {
  const done = match.status === "จบการแข่งขัน";
  const winnerSide = done && match.scoreA !== match.scoreB ? (match.scoreA > match.scoreB ? "A" : "B") : null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800/70">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
          <Trophy size={13} className="text-indigo-400 shrink-0" />
          <span className="truncate">{match.sport}{match.round ? ` · ${match.round}` : ""}</span>
        </span>
        <span className="shrink-0">
          <StatusPill status={match.status} />
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onSelectTeam(match.teamA, match.sport)}
            className="flex items-center gap-1.5 min-w-0 hover:opacity-70 transition"
          >
            {winnerSide === "A" && <Crown size={13} className="text-amber-400 shrink-0" />}
            <Badge team={match.teamA} />
          </button>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 shrink-0">{done ? match.scoreA : "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onSelectTeam(match.teamB, match.sport)}
            className="flex items-center gap-1.5 min-w-0 hover:opacity-70 transition"
          >
            {winnerSide === "B" && <Crown size={13} className="text-amber-400 shrink-0" />}
            <Badge team={match.teamB} />
          </button>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 shrink-0">{done ? match.scoreB : "-"}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap px-4 py-2 border-t border-slate-200 dark:border-slate-800/70 text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><Clock size={11} className="shrink-0" /> {formatShortTime(match.time)} น.</span>
        {match.venue && <span className="flex items-center gap-1 truncate"><MapPin size={11} className="shrink-0" /> {match.venue}</span>}
      </div>
    </div>
  );
}

// สรุปตารางการแข่งขันทั้งหมด แยกเป็นกลุ่มตามวันที่ กดหัวข้อวันที่เพื่อกาง/พับดูรายการของวันนั้นได้ (เปิดวันแรก
// ไว้ให้ก่อนโดยอัตโนมัติ) เปิดได้พร้อมกันหลายวัน — กดวันอื่นเพิ่มไม่ทำให้วันที่เปิดไว้ก่อนหน้าพับกลับไป
// ต่อท้ายกราฟอันดับคะแนนในหน้า "หน้าหลัก" ให้เห็นภาพรวมทั้งหมดโดยไม่ต้องสลับไปหน้า "ตารางแข่งขัน"
// (ซึ่งแบ่งดูทีละกีฬาแบบสาย bracket แทน)
export default function MatchesTimeline({ matches, students }) {
  const groups = useMemo(() => {
    const map = new Map();
    (matches || []).forEach((m) => {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date).push(m);
    });
    return [...map.entries()]
      .map(([date, items]) => ({ date, items: items.sort((a, b) => (a.time || "").localeCompare(b.time || "")) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [matches]);

  const [expandedDates, setExpandedDates] = useState(() => new Set(groups[0] ? [groups[0].date] : []));
  const toggleDate = (date) =>
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  // ทีม+กีฬาที่กำลังเปิดดูรายชื่อนักกีฬาอยู่ (null = ไม่ได้เปิด) — เก็บคู่กันเพราะแต่ละการ์ดในตารางนี้เป็นคนละกีฬากัน
  // ไม่มี "กีฬาที่กำลังเลือกอยู่" แบบ MatchSchedule.jsx ที่มีแท็บเลือกกีฬาเดียวตายตัว
  const [viewRoster, setViewRoster] = useState(null); // { team, sport } | null
  const rosterStudents = viewRoster
    ? sortStudentsByYear(
        (students || []).filter(
          (s) =>
            s.team === viewRoster.team &&
            normalizeSportName(extractSportFromRole(s.role)) === normalizeSportName(viewRoster.sport)
        )
      )
    : [];

  if (groups.length === 0) return null;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2" style={{ fontFamily: "Kanit, sans-serif" }}>
          <CalendarRange size={18} className="text-indigo-400" /> ตารางการแข่งขันทั้งหมด
        </div>
        <div className="text-xs text-slate-400 shrink-0">{matches.length} รายการ · {groups.length} วัน</div>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {groups.map((g, i) => {
          const isOpen = expandedDates.has(g.date);
          return (
            <div key={g.date}>
              <button
                onClick={() => toggleDate(g.date)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <span className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-sm font-bold shrink-0">
                  {new Date(g.date + "T00:00:00").getDate()}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {formatThaiFullDate(new Date(g.date + "T00:00:00"))}
                  </span>
                  <span className="block text-xs text-slate-400">{g.items.length} รายการ</span>
                </span>
                <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 grid sm:grid-cols-2 gap-3">
                  {g.items.map((m) => (
                    <MatchCard key={m.id} match={m} onSelectTeam={(team, sport) => setViewRoster({ team, sport })} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {viewRoster && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => setViewRoster(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Badge team={viewRoster.team} />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
                  {viewRoster.sport}
                </span>
              </div>
              <button
                onClick={() => setViewRoster(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <UsersIcon size={13} /> นักกีฬาในทีมนี้ ({rosterStudents.length} คน)
              </div>
              {rosterStudents.length === 0 && (
                <div className="text-xs text-slate-500">ยังไม่มีนักกีฬาในตำแหน่งนี้</div>
              )}
              <div className="space-y-2">
                {rosterStudents.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <div className="text-slate-700 dark:text-slate-300 font-medium truncate">{s.name}</div>
                      <div className="text-[11px] text-slate-400">รหัส {s.id} · {s.year || "ไม่ระบุชั้นปี"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
