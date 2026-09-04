import React, { useState } from "react";
import { Newspaper, Palette, Briefcase, CheckCircle2, X } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Standings from "../Standings";
import ActivityShortcuts from "./ActivityShortcuts";
import TodaySummary from "./TodaySummary";
import { formatThaiDate } from "../../utils/helpers";

function StatCard({ icon: Icon, iconClass, border, label, children }) {
  return (
    <Card className="p-5 flex items-center gap-3.5" border={border}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-400 font-semibold">{label}</div>
        <div className="mt-1">{children}</div>
      </div>
    </Card>
  );
}

export default function UserHome({ student, students, matches, checkins, news, roles }) {
  const myCheckins = checkins.filter((c) => c.studentId === student.id);
  const [viewNews, setViewNews] = useState(null);
  return (
    <div className="px-4 md:px-8 pb-10 space-y-6">
      <TodaySummary matches={matches} checkins={checkins} news={news} />

      <ActivityShortcuts students={students} roles={roles} />

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          icon={Palette}
          iconClass="bg-indigo-500/15 text-indigo-400"
          border="border-indigo-200 dark:border-indigo-500/30"
          label="สังกัดสี"
        >
          <Badge team={student.team} />
        </StatCard>
        <StatCard
          icon={Briefcase}
          iconClass="bg-amber-500/15 text-amber-400"
          border="border-amber-200 dark:border-amber-500/30"
          label="บทบาทกีฬา"
        >
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{student.role}</span>
        </StatCard>
        <StatCard
          icon={CheckCircle2}
          iconClass="bg-emerald-500/15 text-emerald-400"
          border="border-emerald-200 dark:border-emerald-500/30"
          label="เช็คชื่อแล้ว"
        >
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{myCheckins.length} กิจกรรม</span>
        </StatCard>
      </div>

      <Standings matches={matches} />

      <div id="news-section" className="scroll-mt-4">
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2" style={{ fontFamily: "Kanit, sans-serif" }}>
            <Newspaper size={18} className="text-indigo-400"/> ข่าวสารล่าสุด
          </div>

          {news.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-400">ยังไม่มีข่าวสาร</div>
          )}

          <div className="p-4 space-y-3">
            {news.map((n, i) => (
              <button
                key={n.id}
                onClick={() => setViewNews(n)}
                className="group w-full flex gap-3.5 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-left transition hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Newspaper size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
                      {n.title}
                    </div>
                    {i === 0 && (
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 rounded-full px-2 py-0.5 shrink-0">ล่าสุด</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{formatThaiDate(n.date)}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">{n.body}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {viewNews && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => setViewNews(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                    <Newspaper size={16} />
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
                    {viewNews.title}
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-2 ml-12">{formatThaiDate(viewNews.date)}</div>
              </div>
              <button
                onClick={() => setViewNews(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{viewNews.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
