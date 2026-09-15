import React from "react";

// หัวข้อใหญ่บนสุดของทุกหน้า (ใต้แถบเมนู) — แถบสีม่วงเล็กๆ + ไอคอน + ชื่อหน้า + คำอธิบายย่อย
// App.jsx render อันนี้ไว้ครั้งเดียวเหนือเนื้อหาของทุกแท็บ เปลี่ยน title/icon ตามแท็บที่กำลังเลือกอยู่
// badge (ไม่บังคับ) ใช้แสดงป้ายสังกัดสีของนักศึกษาต่อจาก subtitle ให้เห็นชัดๆ กันสับสนว่าตัวเองอยู่สีไหน
// (สำคัญมากสำหรับคนที่มีสิทธิ์เช็คชื่อ เพราะเช็คได้แค่คนในสีเดียวกันเท่านั้น)
export default function PageHeader({ icon: Icon, title, subtitle, badge }) {
  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <span className="w-1.5 h-6 rounded-full bg-indigo-500 shrink-0" />
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
        )}
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
          {title}
        </h1>
      </div>
      {(subtitle || badge) && (
        <div className="flex items-center gap-2 flex-wrap mt-1.5 ml-4">
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          {badge}
        </div>
      )}
    </div>
  );
}
