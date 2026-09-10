import React, { useId } from "react";

// กราฟโดนัทเล็กๆ ในหน้า "ประวัติของฉัน" (UserHistory) มุมซ้ายบน แสดงสัดส่วน "มา" / "ขาด" / "ยังไม่เริ่ม"
// ของนักศึกษาคนที่ล็อกอินอยู่ ไม่ใช้ไลบรารีเสริม วาดด้วย SVG ล้วน
// รับค่าเป็นจำนวนวัน แล้วคำนวณสัดส่วนเอง จะอัปเดตอัตโนมัติทุกครั้งที่ props เปลี่ยน (ไม่ต้องทำอะไรเพิ่มเพื่อให้เรียลไทม์
// เพราะ props เหล่านี้มาจาก state ที่ App.jsx ดึงข้อมูลใหม่ทุก 4 วิอยู่แล้ว)
// % ในแต่ละแถวสี (มา/ขาด/ยังไม่เริ่ม) คิดเป็นสัดส่วนจาก "total" ตัวเดียวกับที่ใช้วาดเส้นวงแหวน
// เพื่อให้ตัวเลข % ตรงกับสัดส่วนพื้นที่ที่เห็นบนวงแหวนจริงๆ (ไม่ใช้ตรงกลางวงกลมแล้ว ย้ายไปโชว์บนวงแหวนแทน)
// ตัวเลข % บนวงแหวนโค้งไปตามขอบวงแหวนจริง (SVG <textPath>) และสีตัวเลขสลับเป็นตรงข้ามเองตามโหมดมืด/สว่าง
// (ผ่านตัวแปร CSS --donut-label-fill / --donut-label-outline ที่ index.css) ไม่ต้องเขียนโค้ดรับ dark mode ในไฟล์นี้เอง
export default function AttendanceDonut({ present, absent, upcoming = 0 }) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const decided = present + absent;
  const total = decided + upcoming;
  const size = 148;
  const strokeWidth = 20;
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const absentDash = total > 0 ? (absent / total) * circumference : 0;
  const presentDash = total > 0 ? (present / total) * circumference : 0;
  const upcomingDash = total > 0 ? (upcoming / total) * circumference : 0;

  const pct = (value) => (total > 0 ? Math.round((value / total) * 100) : 0);

  const absentFrac = total > 0 ? absent / total : 0;
  const presentFrac = total > 0 ? present / total : 0;
  const upcomingFrac = total > 0 ? upcoming / total : 0;

  // จุดบนวงแหวนของ fraction หนึ่งๆ (0 = 12 นาฬิกา ไล่ตามเข็มนาฬิกา) คำนวณตรงๆในพิกัดที่มองเห็นจริง
  // ไม่ผ่านการหมุนของ <svg> วงแหวนสี (ต่างจากถ้าวาง path ไว้ใน svg ที่หมุนอยู่ ซึ่งจะทำให้ตัวเลขเอียงตามไปด้วย)
  const point = (fraction) => {
    const angle = fraction * 2 * Math.PI;
    return { x: cx + radius * Math.sin(angle), y: cy - radius * Math.cos(angle) };
  };

  // เส้นโค้ง (ไม่มีสี ใช้เป็นแนวให้ตัวเลขวิ่งตามเท่านั้น) ของแต่ละส่วน ตั้งแต่ fraction เริ่มถึงจบ
  // ส่วนที่อยู่ครึ่งล่างของวงกลม ถ้าวิ่งตามทิศเข็มนาฬิกาปกติตัวเลขจะหัวกลับ จึงสลับทิศทาง (วาดจากจบไปเริ่ม + สลับ sweep-flag)
  // ให้ตัวเลขในครึ่งล่างหงายขึ้นอ่านง่ายเหมือนครึ่งบน
  const arcPath = (startFrac, endFrac) => {
    if (!(endFrac > startFrac)) return null;
    const start = point(startFrac);
    const end = point(endFrac);
    const span = endFrac - startFrac;
    const largeArc = span > 0.5 ? 1 : 0;
    const midFrac = ((startFrac + endFrac) / 2) % 1;
    const bottomHalf = midFrac > 0.25 && midFrac < 0.75;
    return bottomHalf
      ? `M ${end.x} ${end.y} A ${radius} ${radius} 0 ${largeArc} 0 ${start.x} ${start.y}`
      : `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  // เรียงตามลำดับเดียวกับที่วาดวงแหวนจริง (ขาด -> มา -> ยังไม่เริ่ม)
  const absentPath = absent > 0 ? arcPath(0, absentFrac) : null;
  const presentPath = present > 0 ? arcPath(absentFrac, absentFrac + presentFrac) : null;
  const upcomingPath = upcoming > 0 ? arcPath(absentFrac + presentFrac, 1) : null;

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

        {/* svg แยกต่างหาก ไม่หมุนแบบวงแหวนสี ใส่แค่ path (มองไม่เห็น) ไว้ให้ตัวเลข % วิ่งโค้งตามขอบวงแหวนจริง */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 pointer-events-none">
          <defs>
            {absentPath && <path id={`${rawId}-absent`} d={absentPath} fill="none" />}
            {presentPath && <path id={`${rawId}-present`} d={presentPath} fill="none" />}
            {upcomingPath && <path id={`${rawId}-upcoming`} d={upcomingPath} fill="none" />}
          </defs>
          {absentPath && (
            <text
              fontSize="11"
              fontWeight="bold"
              fill="var(--donut-label-fill)"
              stroke="var(--donut-label-outline)"
              strokeWidth="3"
              paintOrder="stroke"
            >
              <textPath href={`#${rawId}-absent`} xlinkHref={`#${rawId}-absent`} startOffset="50%" textAnchor="middle">
                {pct(absent)}%
              </textPath>
            </text>
          )}
          {presentPath && (
            <text
              fontSize="11"
              fontWeight="bold"
              fill="var(--donut-label-fill)"
              stroke="var(--donut-label-outline)"
              strokeWidth="3"
              paintOrder="stroke"
            >
              <textPath href={`#${rawId}-present`} xlinkHref={`#${rawId}-present`} startOffset="50%" textAnchor="middle">
                {pct(present)}%
              </textPath>
            </text>
          )}
          {upcomingPath && (
            <text
              fontSize="11"
              fontWeight="bold"
              fill="var(--donut-label-fill)"
              stroke="var(--donut-label-outline)"
              strokeWidth="3"
              paintOrder="stroke"
            >
              <textPath href={`#${rawId}-upcoming`} xlinkHref={`#${rawId}-upcoming`} startOffset="50%" textAnchor="middle">
                {pct(upcoming)}%
              </textPath>
            </text>
          )}
        </svg>
      </div>

      <div className="mt-4 w-full space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> มา
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{present} วัน ({pct(present)}%)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> ขาด
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{absent} วัน ({pct(absent)}%)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> ยังไม่เริ่ม
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{upcoming} วัน ({pct(upcoming)}%)</span>
        </div>
      </div>

      {total === 0 && <div className="mt-2 text-[11px] text-slate-400 text-center">ยังไม่ถึงวันจัดกิจกรรมวันแรก</div>}
    </div>
  );
}
