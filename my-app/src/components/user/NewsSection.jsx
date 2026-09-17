import React, { useState } from "react";
import { Newspaper, X, ChevronRight, Sparkles, CalendarDays } from "lucide-react";
import Card from "../common/Card";
import { formatThaiDate } from "../../utils/helpers";

// ข่าวชิ้นล่าสุดขึ้นเป็นการ์ด "เด่น" ไล่สีขนาดใหญ่ ให้สะดุดตาก่อนใคร ส่วนที่เหลือเรียงเป็นตาราง 2 คอลัมน์
// ด้านล่าง (การ์ดเล็กลง แต่ยังอ่านหัวข้อ+วันที่+ตัวอย่างเนื้อหาได้ครบ) กดข่าวไหนก็เปิดอ่านเต็มในป็อปอัปเดียวกัน
// ใช้ร่วมกันทั้งหน้าหลักนักศึกษา (UserHome) และหน้าเยี่ยมชม (GuestHome) กันโค้ดซ้ำ
export default function NewsSection({ news }) {
  const [viewNews, setViewNews] = useState(null);
  const [featured, ...rest] = news;

  return (
    <div id="news-section" className="scroll-mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper size={18} className="text-indigo-400" />
        <div className="font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
          ข่าวสารล่าสุด
        </div>
        {news.length > 0 && (
          <span className="text-xs font-normal text-slate-400">({news.length})</span>
        )}
      </div>

      {news.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-400">ยังไม่มีข่าวสาร</Card>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => setViewNews(featured)}
            className="group relative w-full overflow-hidden rounded-2xl p-6 sm:p-7 text-left text-white shadow-lg shadow-indigo-950/30 transition hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700" />
            <div className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-10 w-48 h-48 rounded-full bg-fuchsia-400/20 blur-3xl" />
            <Sparkles size={16} className="pointer-events-none absolute top-6 right-20 text-white/25 hidden sm:block" />
            <Sparkles size={10} className="pointer-events-none absolute bottom-8 right-10 text-white/15 hidden sm:block" />

            <div className="relative">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-bold px-2.5 py-1">
                  <Sparkles size={11} /> ข่าวล่าสุด
                </span>
                <span className="flex items-center gap-1 text-[11px] text-indigo-100/80">
                  <CalendarDays size={11} /> {formatThaiDate(featured.date)}
                </span>
              </div>
              <div className="mt-3 text-xl sm:text-2xl font-black leading-snug" style={{ fontFamily: "Kanit, sans-serif" }}>
                {featured.title}
              </div>
              <p className="mt-2 text-sm text-indigo-50/90 leading-relaxed line-clamp-2 max-w-2xl">{featured.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-white/90 group-hover:gap-1.5 transition-all">
                อ่านเพิ่มเติม <ChevronRight size={14} />
              </span>
            </div>
          </button>

          {rest.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {rest.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setViewNews(n)}
                  className="group flex gap-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/40"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <Newspaper size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" style={{ fontFamily: "Kanit, sans-serif" }}>
                      {n.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{formatThaiDate(n.date)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">{n.body}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
