import React, { useMemo, useState } from "react";
import { Trophy, Crown, Medal, X } from "lucide-react";
import Card from "./common/Card";
import Badge from "./common/Badge";
import { getTeams, formatThaiDate, teamById } from "../utils/helpers";

const RANK_STYLES = [
  { badge: "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-md shadow-amber-500/30", icon: Crown },
  { badge: "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-md shadow-slate-400/30", icon: Medal },
  { badge: "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950 shadow-md shadow-orange-500/30", icon: Medal },
];

export default function Standings({ matches }) {
  const [viewTeam, setViewTeam] = useState(null); // ทีมที่กำลังเปิดดูผลชนะ

  const table = useMemo(() => {
    const TEAMS = getTeams();
    const pts = Object.fromEntries(TEAMS.map((t) => [t.id, { win: 0, played: 0 }]));
    matches.forEach((m) => {
      if (m.status !== "จบการแข่งขัน") return;
      pts[m.teamA].played++; pts[m.teamB].played++;
      if (m.round !== "รอบชิงชนะเลิศ") return; // นับเฉพาะกีฬาที่ได้แชมป์ (ชนะรอบชิงชนะเลิศ) เท่านั้น
      if (m.scoreA > m.scoreB) pts[m.teamA].win++;
      else if (m.scoreB > m.scoreA) pts[m.teamB].win++;
    });
    return TEAMS.map((t) => ({ ...t, ...pts[t.id] })).sort((a, b) => b.win - a.win);
  }, [matches]);

  const maxWin = Math.max(1, ...table.map((t) => t.win));

  const wins = useMemo(() => {
    if (!viewTeam) return [];
    return matches
      .filter(
        (m) =>
          m.status === "จบการแข่งขัน" &&
          m.round === "รอบชิงชนะเลิศ" && // นับเฉพาะกีฬาที่ได้แชมป์เท่านั้น
          ((m.teamA === viewTeam && m.scoreA > m.scoreB) || (m.teamB === viewTeam && m.scoreB > m.scoreA))
      )
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [matches, viewTeam]);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4 text-slate-900 dark:text-slate-100 font-bold" style={{ fontFamily: "Kanit, sans-serif" }}>
        <Trophy size={18} className="text-indigo-400" /> อันดับคะแนนรวม
      </div>
      <div className="space-y-2.5">
        {table.map((t, i) => {
          const rankStyle = RANK_STYLES[i];
          const RankIcon = rankStyle?.icon;
          const winRate = t.played > 0 ? Math.round((t.win / t.played) * 100) : 0;
          return (
            <button
              key={t.id}
              onClick={() => setViewTeam(t.id)}
              className={`w-full flex items-center gap-3.5 rounded-xl border px-3.5 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                i === 0
                  ? "border-amber-300/60 dark:border-amber-500/30 bg-gradient-to-r from-amber-50 dark:from-amber-500/10 to-transparent"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${rankStyle ? rankStyle.badge : "text-white"}`}
                style={!rankStyle ? { backgroundColor: t.accent } : undefined}
              >
                {RankIcon ? <RankIcon size={16} /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.accent }} />
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{t.name}</div>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(t.win / maxWin) * 100}%`, backgroundColor: t.accent }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">แข่งแล้ว {t.played} นัด · ชนะ {winRate}%</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-black text-slate-900 dark:text-slate-100">{t.win}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">ชนะ</div>
              </div>
            </button>
          );
        })}
      </div>

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
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamById(viewTeam).accent }} />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
                  {teamById(viewTeam).name} · แชมป์ {wins.length} กีฬา
                </span>
              </div>
              <button
                onClick={() => setViewTeam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {wins.length === 0 && <div className="text-xs text-slate-500">ยังไม่ได้แชมป์กีฬาใดเลย</div>}
              {wins.map((m) => {
                const opponent = m.teamA === viewTeam ? m.teamB : m.teamA;
                const myScore = m.teamA === viewTeam ? m.scoreA : m.scoreB;
                const oppScore = m.teamA === viewTeam ? m.scoreB : m.scoreA;
                return (
                  <div key={m.id} className="rounded-lg border border-amber-300/50 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5 px-3.5 py-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-semibold text-amber-500 flex items-center gap-1"><Crown size={12} /> แชมป์{m.sport}</span>
                      <span>{formatThaiDate(m.date)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                      <Badge team={viewTeam} />
                      <span className="text-emerald-500 font-bold">{myScore} - {oppScore}</span>
                      <Badge team={opponent} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
