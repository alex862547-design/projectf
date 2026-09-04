import React, { useState, useMemo } from "react";
import { Trophy, X, Users as UsersIcon } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Bracket from "../common/Bracket";
import { extractSportFromRole, normalizeSportName, sortStudentsByYear } from "../../utils/helpers";

export default function MatchSchedule({ matches, students }) {
  const sports = useMemo(() => [...new Set(matches.map((m) => m.sport))], [matches]);
  const [selected, setSelected] = useState(sports[0] || null);
  const [viewTeam, setViewTeam] = useState(null); // ทีมสีที่กำลังเปิดดูรายชื่อนักกีฬา

  const activeSport = sports.includes(selected) ? selected : sports[0] || null;

  const teamStudents = viewTeam
    ? sortStudentsByYear(
        (students || []).filter(
          (s) => s.team === viewTeam && normalizeSportName(extractSportFromRole(s.role)) === normalizeSportName(activeSport)
        )
      )
    : [];

  if (sports.length === 0) {
    return (
      <div className="px-4 md:px-8 pb-10">
        <Card className="p-8 text-center text-sm text-slate-400">ยังไม่มีตารางแข่งขัน</Card>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pb-10 space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {sports.map((sport) => (
          <button
            key={sport}
            onClick={() => setSelected(sport)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
              sport === activeSport
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
            }`}
          >
            <Trophy size={13} className={sport === activeSport ? "text-white" : "text-indigo-400"} /> {sport}
          </button>
        ))}
      </div>

      <Card className="p-5 md:p-8">
        <Bracket matches={matches.filter((m) => m.sport === activeSport)} onSelectTeam={setViewTeam} />
      </Card>

      {viewTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => setViewTeam(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Badge team={viewTeam} />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
                  {activeSport}
                </span>
              </div>
              <button
                onClick={() => setViewTeam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <UsersIcon size={13} /> นักกีฬาในทีมนี้ ({teamStudents.length} คน)
              </div>
              {teamStudents.length === 0 && (
                <div className="text-xs text-slate-500">ยังไม่มีนักกีฬาในตำแหน่งนี้</div>
              )}
              <div className="space-y-2">
                {teamStudents.map((s) => (
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
    </div>
  );
}
