import React from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import Badge from "./Badge";
import StatusPill from "./StatusPill";
import { formatThaiDate } from "../../utils/helpers";

// ป้ายอันดับ 1-4 ท้ายสาย (แชมป์ / รองแชมป์ / อันดับ 3 / อันดับ 4) สีไล่ระดับให้ดูคล้ายเหรียญจริง
const RANK_STYLES = [
  { badge: "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-md shadow-amber-500/30", icon: Crown },
  { badge: "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-md shadow-slate-400/30", icon: Medal },
  { badge: "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950 shadow-md shadow-orange-500/30", icon: Medal },
  { badge: "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400", icon: null },
];

const CARD_W = 256;
const CARD_H = 104;
const CARD_GAP = 48;
const CONNECTOR_W = 36;
const TOTAL_H = CARD_H * 2 + CARD_GAP;

function MatchCard({ match, onSelectTeam, showChampion }) {
  if (!match) {
    return (
      <div
        style={{ height: CARD_H, width: CARD_W }}
        className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-500 px-4 text-center shrink-0"
      >
        ยังไม่มีนัดในรอบนี้
      </div>
    );
  }
  const done = match.status === "จบการแข่งขัน";
  const championSide = done && showChampion
    ? match.scoreA > match.scoreB
      ? "A"
      : match.scoreB > match.scoreA
      ? "B"
      : null
    : null;
  return (
    <div
      style={{ height: CARD_H, width: CARD_W }}
      className={`rounded-xl border bg-white dark:bg-slate-900 shadow-lg shadow-slate-300/50 dark:shadow-black/20 overflow-hidden flex flex-col shrink-0 ${
        championSide ? "border-amber-400/70 dark:border-amber-500/50 ring-2 ring-amber-400/30" : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <span className="truncate">{formatThaiDate(match.date)} · {match.time}</span>
        <StatusPill status={match.status} />
      </div>
      <div className="flex-1 flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
        <div className="flex-1 flex items-center justify-between px-3">
          <button onClick={() => onSelectTeam?.(match.teamA)} className="hover:opacity-70 transition flex items-center gap-1.5">
            {championSide === "A" && <Crown size={14} className="text-amber-400 shrink-0" />}
            <Badge team={match.teamA} />
          </button>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{done ? match.scoreA : ""}</span>
        </div>
        <div className="flex-1 flex items-center justify-between px-3">
          <button onClick={() => onSelectTeam?.(match.teamB)} className="hover:opacity-70 transition flex items-center gap-1.5">
            {championSide === "B" && <Crown size={14} className="text-amber-400 shrink-0" />}
            <Badge team={match.teamB} />
          </button>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{done ? match.scoreB : ""}</span>
        </div>
      </div>
    </div>
  );
}

// สายการแข่งขันแบบ 4 ทีมคัดออกสายเดียว (เข้ากับจำนวนสีในระบบพอดี):
// รอบรองชนะเลิศ 2 นัด -> รอบชิงชนะเลิศ 1 นัด และแยก รอบชิงอันดับ 3 ไว้ต่างหาก
export default function Bracket({ matches, onSelectTeam }) {
  const byRoundTime = (a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
  const semis = matches.filter((m) => m.round === "รอบรองชนะเลิศ").sort(byRoundTime);
  const final = matches.find((m) => m.round === "รอบชิงชนะเลิศ") || null;
  const third = matches.find((m) => m.round === "รอบชิงอันดับ 3") || null;
  const sf1 = semis[0] || null;
  const sf2 = semis[1] || null;

  // สรุปการจัดอันดับท้ายสาย: แชมป์/รองแชมป์มาจากผลรอบชิงชนะเลิศ, อันดับ 3/4 มาจากผลรอบชิงอันดับ 3
  const decideWinner = (m) => {
    if (!m || m.status !== "จบการแข่งขัน") return null;
    if (m.scoreA > m.scoreB) return m.teamA;
    if (m.scoreB > m.scoreA) return m.teamB;
    return null;
  };
  const decideLoser = (m, winner) => (winner ? (winner === m.teamA ? m.teamB : m.teamA) : null);
  const finalWinner = decideWinner(final);
  const finalLoser = decideLoser(final, finalWinner);
  const thirdWinner = decideWinner(third);
  const thirdLoser = decideLoser(third, thirdWinner);
  const ranking = [finalWinner, finalLoser, thirdWinner, thirdLoser];
  const hasRanking = ranking.some(Boolean);

  const sf1MidY = CARD_H / 2;
  const sf2MidY = CARD_H + CARD_GAP + CARD_H / 2;
  const midY = TOTAL_H / 2;

  return (
    <div className="relative space-y-10">
      <div className="overflow-x-auto pb-2">
        <div
          className="grid mx-auto w-max gap-x-0"
          style={{ gridTemplateColumns: `${CARD_W}px ${CONNECTOR_W}px ${CARD_W}px` }}
        >
          <div className="text-center text-xs font-bold text-slate-600 dark:text-slate-300 mb-3" style={{ fontFamily: "Kanit, sans-serif" }}>
            รอบรองชนะเลิศ
          </div>
          <div />
          <div className="text-center text-xs font-bold text-slate-600 dark:text-slate-300 mb-3" style={{ fontFamily: "Kanit, sans-serif" }}>
            รอบชิงชนะเลิศ
          </div>

          <div className="flex flex-col" style={{ gap: CARD_GAP }}>
            <MatchCard match={sf1} onSelectTeam={onSelectTeam} />
            <MatchCard match={sf2} onSelectTeam={onSelectTeam} />
          </div>

          <svg width={CONNECTOR_W} height={TOTAL_H} className="shrink-0">
            <path d={`M0,${sf1MidY} H${CONNECTOR_W / 2}`} stroke="#334155" strokeWidth="2" fill="none" />
            <path d={`M0,${sf2MidY} H${CONNECTOR_W / 2}`} stroke="#334155" strokeWidth="2" fill="none" />
            <path d={`M${CONNECTOR_W / 2},${sf1MidY} V${sf2MidY}`} stroke="#334155" strokeWidth="2" fill="none" />
            <path d={`M${CONNECTOR_W / 2},${midY} H${CONNECTOR_W}`} stroke="#334155" strokeWidth="2" fill="none" />
          </svg>

          <div className="flex flex-col justify-center" style={{ height: TOTAL_H }}>
            <MatchCard match={final} onSelectTeam={onSelectTeam} showChampion />
          </div>
        </div>
      </div>

      {third && (
        <div className="flex flex-col items-center">
          <div className="text-center text-xs font-bold text-slate-600 dark:text-slate-300 mb-3" style={{ fontFamily: "Kanit, sans-serif" }}>
            รอบชิงอันดับ 3
          </div>
          <MatchCard match={third} onSelectTeam={onSelectTeam} />
        </div>
      )}

      {hasRanking && (
        <div className="flex justify-center lg:justify-end lg:absolute lg:right-0 lg:bottom-0">
          <div className="w-full max-w-[260px] rounded-xl border border-amber-300/40 dark:border-amber-500/25 bg-gradient-to-br from-amber-50/70 dark:from-amber-500/[0.06] to-transparent p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 mb-3" style={{ fontFamily: "Kanit, sans-serif" }}>
              <Trophy size={14} className="text-amber-400" /> การจัดอันดับ
            </div>
            <div className="space-y-2">
              {ranking.map((teamId, i) => {
                const style = RANK_STYLES[i];
                const RankIcon = style.icon;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${style.badge}`}>
                      {RankIcon ? <RankIcon size={13} /> : i + 1}
                    </div>
                    {teamId ? <Badge team={teamId} /> : <span className="text-xs text-slate-400">รอผลการแข่งขัน</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
