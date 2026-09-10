import React, { useMemo, useState } from "react";
import { CalendarDays, Clock, MessageCircle, PieChart, ChevronLeft, ChevronRight } from "lucide-react";
import Card from "../common/Card";
import AttendanceThreadModal from "../common/AttendanceThreadModal";
import AttendanceDonut from "../common/AttendanceDonut";
import AttendanceBarChart from "./AttendanceBarChart";
import { formatThaiDate } from "../../utils/helpers";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

// สร้างช่องปฏิทินของเดือนหนึ่งๆ (เว้นช่องว่างก่อนวันที่ 1 ให้ตรงวัน)
function buildMonthCells(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export default function UserHistory({ student, matches, checkins, eventDays }) {
  const [openDate, setOpenDate] = useState(null);

  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const mine = checkins
    .filter((c) => c.studentId === student.id)
    .map((c) => ({ ...c, match: matches.find((m) => m.id === c.matchId) }));

  // แยกวันที่ "มา" กับ "ขาด" (เช็คขาดโดยผู้มีสิทธิ์เช็คชื่อ) ออกจากกัน
  const presentDates = useMemo(
    () => new Set(mine.filter((c) => (c.status || "present") === "present").map((c) => c.date).filter(Boolean)),
    [mine]
  );
  const absentDates = useMemo(
    () => new Set(mine.filter((c) => c.status === "absent").map((c) => c.date).filter(Boolean)),
    [mine]
  );

  // นับจำนวนวัน "มา" กับ "ขาด" จากวันจัดกิจกรรมที่ผ่านมาแล้วหรือคือวันนี้ (วันในอนาคตยังไม่มีผลจึงไม่นับ)
  // คำนวณใหม่ทุกครั้งที่ checkins/eventDays เปลี่ยน (ข้อมูลจะรีเฟรชอัตโนมัติทุก 4 วิ จาก App.jsx อยู่แล้ว)
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  })();
  const { presentCount, absentCount, upcomingCount } = useMemo(() => {
    let present = 0;
    let absent = 0;
    let upcoming = 0;
    (eventDays || []).forEach((d) => {
      if (d.date > today) {
        upcoming += 1; // ยังไม่ถึงวัน ยังไม่ตัดสินว่ามา/ขาด
        return;
      }
      if (presentDates.has(d.date)) present += 1;
      else absent += 1;
    });
    return { presentCount: present, absentCount: absent, upcomingCount: upcoming };
  }, [eventDays, presentDates, today]);

  const eventDateSet = useMemo(() => {
    const map = new Map();
    (eventDays || []).forEach((d) => map.set(d.date, d));
    return map;
  }, [eventDays]);

  const cells = useMemo(() => buildMonthCells(cursor.year, cursor.month), [cursor]);

  const goPrevMonth = () =>
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  const goNextMonth = () =>
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));
  const goToday = () => setCursor({ year: now.getFullYear(), month: now.getMonth() });

  const isCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth();

  return (
    <div className="px-4 md:px-8 pb-10 space-y-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="p-5 w-full lg:w-64 shrink-0 h-fit">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5" style={{ fontFamily: "Kanit, sans-serif" }}>
            <PieChart size={16} className="text-indigo-400" /> สรุปการเข้าร่วม
          </div>
          <AttendanceDonut present={presentCount} absent={absentCount} upcoming={upcomingCount} />
          <AttendanceBarChart mine={mine} student={student} />
        </Card>

        <div className="flex-1 min-w-0">
          <Card className="p-3.5 sm:p-4 w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={goPrevMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition"
                aria-label="เดือนก่อนหน้า"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-indigo-400" />
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
                  {THAI_MONTHS[cursor.month]} {cursor.year + 543}
                </div>
                {!isCurrentMonth && (
                  <button
                    onClick={goToday}
                    className="ml-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-full px-1.5 py-0.5"
                  >
                    วันนี้
                  </button>
                )}
              </div>
              <button
                onClick={goNextMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition"
                aria-label="เดือนถัดไป"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-[10px] text-slate-500 font-semibold py-0.5">{w}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center flex-1 auto-rows-fr min-h-0">
              {cells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const iso = `${cursor.year}-${pad2(cursor.month + 1)}-${pad2(day)}`;
                const isEventDay = eventDateSet.has(iso);
                const present = presentDates.has(iso);
                const absent = absentDates.has(iso);
                const hasRecord = present || absent;
                const clickable = isEventDay || hasRecord;
                const isToday = iso === today;

                const isUpcoming = isEventDay && iso > today; // วันจัดกิจกรรมที่ยังไม่ถึง ยังตัดสินมา/ขาดไม่ได้

                let cls = "text-slate-600"; // ไม่ใช่วันจัดกิจกรรมและไม่มีประวัติ
                if (absent) {
                  cls = "bg-red-500/15 text-red-400 font-semibold";
                } else if (present) {
                  cls = "bg-emerald-500 text-white font-semibold";
                } else if (isUpcoming) {
                  cls = "bg-sky-500/15 text-sky-400 font-semibold"; // วันจัดกิจกรรมที่ยังไม่เริ่ม
                } else if (isEventDay) {
                  cls = "bg-red-500/15 text-red-400 font-semibold"; // วันจัดกิจกรรมที่ผ่านไปแล้วแต่ยังไม่มีการเช็คชื่อ
                }

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && setOpenDate(iso)}
                    title={
                      absent ? "เช็คขาด (กดดูข้อความ)" : present ? "มาเข้าร่วม (กดดูข้อความ)" : isUpcoming ? "ยังไม่เริ่มกิจกรรม" : isEventDay ? "ไม่มา" : ""
                    }
                    className={`relative h-full min-h-8 flex items-center justify-center rounded-md text-xs ${cls} ${
                      clickable ? "cursor-pointer hover:ring-2 hover:ring-indigo-400" : "cursor-default"
                    } ${isToday ? "ring-2 ring-indigo-500" : ""}`}
                  >
                    {day}
                    {hasRecord && (
                      <MessageCircle size={8} className="absolute bottom-0 right-0 opacity-70" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> มาเข้าร่วม</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500/15 inline-block" /> ไม่มา / เช็คขาด</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-sky-500/15 inline-block" /> ยังไม่เริ่มกิจกรรม</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded border border-slate-300 dark:border-slate-700 inline-block" /> ไม่ใช่วันจัดกิจกรรม</span>
            </div>
          </Card>
        </div>
      </div>

      <div>
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5" style={{ fontFamily: "Kanit, sans-serif" }}>
          <Clock size={16} className="text-indigo-400" /> รายละเอียดการเช็คชื่อ
        </div>
        <Card className="p-0 overflow-hidden">
          {mine.length === 0 && <div className="p-8 text-center text-sm text-slate-400">ยังไม่มีประวัติการเช็คชื่อ</div>}
          {mine.map((c, i) => (
            <button
              key={i}
              onClick={() => c.date && setOpenDate(c.date)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800/60 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-left"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.match ? c.match.sport : (student.role || "เช็คชื่อทั่วไป")}</div>
                <div className="text-xs text-slate-400 mt-0.5">{formatThaiDate(c.date)}</div>
              </div>
              <div className={`text-xs font-semibold ${c.status === "absent" ? "text-red-400" : "text-emerald-400"}`}>
                {c.status === "absent" ? "เช็คขาด" : `เช็คชื่อเวลา ${c.time}`}
              </div>
            </button>
          ))}
        </Card>
      </div>

      <AttendanceThreadModal
        open={!!openDate}
        studentId={student.id}
        date={openDate}
        viewerName={student.name}
        onClose={() => setOpenDate(null)}
      />
    </div>
  );
}
