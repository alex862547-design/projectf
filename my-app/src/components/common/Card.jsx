import React from "react";

// กล่องขาว/เข้ม มุมมน มีเงา ใช้เป็น "กล่องพื้นฐาน" ห่อเนื้อหาทุกส่วนของทุกหน้าในเว็บนี้ (แทบทุกกล่องที่เห็น
// บนหน้าจอคือ Card ตัวนี้) รับ `border` เพื่อให้แต่ละกล่องมีสีขอบของตัวเอง (เช่น ให้เข้าชุดกับสีไอคอน)
export default function Card({ children, className = "", border = "border-slate-200 dark:border-slate-800" }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${border} shadow-lg shadow-slate-300/50 dark:shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}
