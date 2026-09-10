import React from "react";
import { teamById } from "../../utils/helpers";

// ป้ายเล็กๆ แสดงชื่อ+สีของทีมสี (เช่น "● สีแดง") ใช้ทั่วทั้งเว็บทุกจุดที่ต้องโชว์ว่าใครอยู่ทีมไหน
// (ตารางแข่งขัน, รายชื่อนักศึกษา, การจัดอันดับ ฯลฯ) ดึงชื่อ/สีจริงผ่าน teamById() เสมอ ไม่ hardcode สีเอง
// เพื่อให้เปลี่ยนชื่อ/สีทีมจากหน้าแอดมินแล้วอัปเดตทุกที่ที่ใช้ Badge นี้พร้อมกันทันที
export default function Badge({ team }) {
  const t = teamById(team);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${t.accent}2E`, color: t.accent }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
      {t.name}
    </span>
  );
}
