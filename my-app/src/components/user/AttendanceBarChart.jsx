import React, { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { normalizeSportName } from "../../utils/helpers";

function pad2(n) {
  return String(n).padStart(2, "0");
}

// จัดกลุ่มประวัติเช็คชื่อ (mine) ตามชนิดกีฬา แล้วนับจำนวนครั้งที่มา/ขาดแยกกัน พร้อมคำนวณ "ทั้งหมด" ของแต่ละ
// กิจกรรมไว้เทียบเป็นสัดส่วน (เช่น "1/30 ครั้ง") — เช็คชื่อที่ไม่ผูกกับตารางแข่งขัน (match) จะนับรวมไว้ใน
// กิจกรรม/ตำแหน่งที่นักศึกษาสังกัดอยู่ปัจจุบัน
// "ทั้งหมด" ของกิจกรรมที่ผูกกับกีฬา = จำนวนนัดแข่งขันของกีฬานั้นที่ผ่านมาแล้ว (หรือคือวันนี้)
// "ทั้งหมด" ของกิจกรรมทั่วไป (ไม่ผูกกีฬา) = จำนวนวันจัดกิจกรรมทั้งหมดที่ผ่านมาแล้ว (เพราะเช็คชื่อได้ทุกวันจัดกิจกรรม)
function groupBySport(mine, currentRole, matches, eventDays, today) {
  const map = new Map();
  mine.forEach((c) => {
    const key = c.match ? c.match.sport : (currentRole || "เช็คชื่อทั่วไป");
    if (!map.has(key)) map.set(key, { present: 0, absent: 0 });
    const g = map.get(key);
    if (c.status === "absent") g.absent += 1;
    else g.present += 1;
  });

  const pastEventDayCount = (eventDays || []).filter((d) => d.date <= today).length;

  return [...map.entries()]
    .map(([sport, v]) => {
      const isSportTied = mine.some((c) => c.match && c.match.sport === sport);
      const possible = isSportTied
        ? (matches || []).filter((m) => normalizeSportName(m.sport) === normalizeSportName(sport) && m.date <= today).length
        : pastEventDayCount;
      return { sport, ...v, total: v.present + v.absent, possible: Math.max(possible, v.present + v.absent) };
    })
    .sort((a, b) => b.total - a.total);
}

// แถบกราฟ "เช็คชื่อแยกตามกิจกรรม" ต่อท้ายกราฟโดนัทในหน้า "ประวัติของฉัน" (UserHistory) — แจกแจงจำนวน
// มา/ขาดของนักศึกษาคนนี้ แยกทีละกีฬา/ตำแหน่ง ไม่ใช่ตัวเลขรวมเหมือนโดนัท พร้อมบอกสัดส่วนจากทั้งหมดที่ควรเช็คได้
export default function AttendanceBarChart({ mine, student, matches, eventDays }) {
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }, []);
  const data = useMemo(() => groupBySport(mine, student?.role, matches, eventDays, today), [mine, student, matches, eventDays, today]);
  const max = Math.max(1, ...data.map((d) => d.possible));

  return (
    <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5" style={{ fontFamily: "Kanit, sans-serif" }}>
        <BarChart3 size={16} className="text-indigo-400" /> เช็คชื่อแยกตามกิจกรรม
      </div>

      {data.length === 0 ? (
        <div className="text-xs text-slate-400 text-center py-6">ยังไม่มีข้อมูล</div>
      ) : (
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d.sport}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{d.sport}</span>
                <span className="text-slate-400 shrink-0 ml-2">{d.total}/{d.possible} ครั้ง</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                {d.present > 0 && (
                  <div
                    className="h-full bg-emerald-500 first:rounded-l-full last:rounded-r-full transition-all"
                    style={{ width: `${(d.present / max) * 100}%` }}
                  />
                )}
                {d.absent > 0 && (
                  <div
                    className="h-full bg-red-400 first:rounded-l-full last:rounded-r-full transition-all"
                    style={{ width: `${(d.absent / max) * 100}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> มา</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> ขาด</span>
      </div>
    </div>
  );
}
