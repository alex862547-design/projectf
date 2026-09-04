import React from "react";
import { PartyPopper, Sparkles } from "lucide-react";
import { formatThaiFullDate, todayISODate, getTeams } from "../../utils/helpers";

function Stat({ value, label }) {
  return (
    <div className="text-center sm:text-right">
      <div className="text-2xl sm:text-3xl font-black text-amber-300" style={{ fontFamily: "Kanit, sans-serif" }}>
        {value}
      </div>
      <div className="text-[11px] text-indigo-100/70 mt-0.5 whitespace-nowrap">{label}</div>
    </div>
  );
}

export default function TodaySummary({ matches, checkins, news }) {
  const today = todayISODate();
  const matchesToday = matches.filter((m) => m.date === today);
  const liveNow = matchesToday.filter((m) => m.status !== "จบการแข่งขัน").length;
  const checkinsToday = checkins.filter((c) => c.date === today).length;
  const latestNews = news[0];

  // สีของแบนเนอร์ไล่ตามสีทีมที่มีในกิจกรรมนี้ (โทนเข้มลงเพื่อให้ตัวหนังสือขาวยังอ่านง่าย)
  // วนซ้ำสีแรกปิดท้ายให้ไล่สีต่อกันเป็นวงลื่นๆ ไม่มีสะดุด แล้ว animate เลื่อน background-position ต่อเนื่องตลอดเวลา
  const teamAccents = getTeams().map((t) => t.accent);
  const gradientStops = teamAccents.length > 0 ? [...teamAccents, teamAccents[0]] : ["#4C1D95", "#6D28D9"];

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white shadow-lg shadow-indigo-950/40">
      {/* พื้นไล่สีทีมที่เลื่อนไปเรื่อยๆ ไม่หยุด (แม้แอดมินเปลี่ยนสีทีมใหม่ ก็จะไล่สีตามชุดใหม่ทันที) */}
      <div
        className="absolute inset-0 animate-[bannerGradient_18s_ease_infinite]"
        style={{
          backgroundImage: `linear-gradient(120deg, ${gradientStops.join(", ")})`,
          backgroundSize: "300% 300%",
        }}
      />
      <div className="absolute inset-0 bg-slate-950/45" />

      {/* จุดตกแต่งเบลอๆ ให้ดูมีมิติ ไม่แบน */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-14 left-1/3 w-48 h-48 rounded-full bg-indigo-400/20 blur-3xl" />
      <Sparkles size={18} className="pointer-events-none absolute top-6 right-24 text-white/20 hidden sm:block" />
      <Sparkles size={12} className="pointer-events-none absolute bottom-10 right-10 text-white/10 hidden sm:block" />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-indigo-200/80">วันนี้</div>
          <div className="mt-1 text-2xl sm:text-3xl font-black" style={{ fontFamily: "Kanit, sans-serif" }}>
            {formatThaiFullDate()}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Stat value={liveNow} label="กำลังแข่งขัน" />
          <Stat value={matchesToday.length} label="รายการวันนี้" />
          <Stat value={matches.length} label="รายการทั้งหมด" />
          <Stat value={checkinsToday} label="เช็คชื่อวันนี้" />
        </div>
      </div>

      {latestNews && (
        <button
          onClick={() => document.getElementById("news-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="relative mt-5 flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 w-full text-left hover:bg-white/15 transition-colors"
        >
          <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold px-2.5 py-1">
            <PartyPopper size={13} /> ข่าวล่าสุด
          </span>
          <span className="text-sm text-white/90 truncate">{latestNews.title}</span>
        </button>
      )}
    </div>
  );
}
