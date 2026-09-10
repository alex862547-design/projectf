import React from "react";

// ป้ายสถานะแมตช์เล็กๆ (สีเหลือง = "กำหนดการ"/ยังไม่แข่ง, สีเขียว = "จบการแข่งขัน") ใช้ในการ์ดแมตช์
// ทุกที่ที่แสดงตารางแข่งขัน (หน้าตารางแข่งขันของนักศึกษา, ตาราง bracket, หน้าจัดการแข่งขันของแอดมิน)
export default function StatusPill({ status }) {
  const done = status === "จบการแข่งขัน";
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        done ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
      }`}
    >
      {status}
    </span>
  );
}
