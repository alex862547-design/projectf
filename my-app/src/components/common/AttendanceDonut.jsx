import React from "react";

// กราฟโดนัทเล็กๆ ในหน้า "ประวัติของฉัน" (UserHistory) มุมซ้ายบน แสดงสัดส่วน "มา" / "ขาด" / "ยังไม่เริ่ม"
// ของนักศึกษาคนที่ล็อกอินอยู่ ไม่ใช้ไลบรารีเสริม วาดด้วย SVG ล้วน
// รับค่าเป็นจำนวนวัน แล้วคำนวณสัดส่วนเอง จะอัปเดตอัตโนมัติทุกครั้งที่ props เปลี่ยน
// อัตรามา (% ตรงกลาง) คิดจากวันที่ถึงกำหนดแล้วเท่านั้น (มา+ขาด) ไม่รวมวันที่ยังไม่เริ่ม กันเปอร์เซ็นต์เพี้ยน
export default function AttendanceDonut({ present, absent, upcoming = 0 }) {
  const decided = present + absent;
  const total = decided + upcoming;
  const size = 148;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const presentPct = decided > 0 ? present / decided : 0;
  const absentDash = total > 0 ? (absent / total) * circumference : 0;
  const presentDash = total > 0 ? (present / total) * circumference : 0;
  const upcomingDash = total > 0 ? (upcoming / total) * circumference : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--donut-track)" strokeWidth={strokeWidth} />
          {total > 0 && (
            <>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#f87171"
                strokeWidth={strokeWidth}
                strokeDasharray={`${absentDash} ${circumference - absentDash}`}
                strokeLinecap="butt"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth={strokeWidth}
                strokeDasharray={`${presentDash} ${circumference - presentDash}`}
                strokeDashoffset={-absentDash}
                strokeLinecap="butt"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={strokeWidth}
                strokeDasharray={`${upcomingDash} ${circumference - upcomingDash}`}
                strokeDashoffset={-(absentDash + presentDash)}
                strokeLinecap="butt"
              />
            </>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{decided > 0 ? `${Math.round(presentPct * 100)}%` : "–"}</div>
          <div className="text-[10px] text-slate-400">อัตรามา</div>
        </div>
      </div>

      <div className="mt-4 w-full space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> มา
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{present} วัน</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> ขาด
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{absent} วัน</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> ยังไม่เริ่ม
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{upcoming} วัน</span>
        </div>
      </div>

      {total === 0 && <div className="mt-2 text-[11px] text-slate-400 text-center">ยังไม่ถึงวันจัดกิจกรรมวันแรก</div>}
    </div>
  );
}
