/* ---------------------------------------------------------
   ระบบการจัดการกีฬาสีภายในวิทยาลัย
   Mock data ชุดนี้ไม่ได้ใช้เป็นข้อมูลจริงของเว็บแล้ว (ตอนนี้ทุกหน้าดึงข้อมูลจริงจาก
   backend/PostgreSQL ผ่าน api.js ทั้งหมด) เหลือไว้ใช้แค่เป็นค่าเริ่มต้น/ค่า fallback
   ของ helpers.js (เช่น TEAMS ใช้เป็นค่าตั้งต้นก่อน App.jsx โหลดสีทีมจริงจาก API มาทับ)
--------------------------------------------------------- */

export const TEAMS = [
  { id: "red", name: "สีแดง", accent: "#D6402D" },
  { id: "blue", name: "สีน้ำเงิน", accent: "#2C5EAA" },
  { id: "green", name: "สีเขียว", accent: "#2F8F5B" },
  { id: "yellow", name: "สีเหลือง", accent: "#D69E1E" },
];

// รายการตำแหน่ง/ประเภทกีฬา — นักศึกษาแต่ละคนเลือกได้แค่ 1 ตำแหน่งจากลิสต์นี้เท่านั้น
export const ROLES = [
  "นักกีฬาฟุตบอล",
  "นักกีฬาวอลเลย์บอล",
  "นักกีฬาแบดมินตัน",
  "นักกีฬาบาสเกตบอล",
  "นักกีฬาเซปักตะกร้อ",
  "นักกีฬา esports",
  "กองเชียร์",
  "เจ้าหน้าที่ทีม",
  "ผู้เข้าร่วมทั่วไป",
];

export const INIT_STUDENTS = [
  { id: "16573", name: "ธนาวุฒิ แสงจันทร์", team: "red", role: "นักกีฬาฟุตบอล" },
  { id: "16036", name: "กันต์ธร พิงพิทยากุล", team: "blue", role: "นักกีฬา esports" },
  { id: "16104", name: "ปวีณา ศรีสุข", team: "green", role: "นักกีฬาวอลเลย์บอล" },
  { id: "16211", name: "อรรถพล ทองดี", team: "yellow", role: "นักกีฬาแบดมินตัน" },
  { id: "16302", name: "ศิริพร มั่นคง", team: "red", role: "ผู้เข้าร่วมทั่วไป" },
];

export const INIT_MATCHES = [
  { id: 1, sport: "ฟุตบอล", teamA: "red", teamB: "blue", date: "2026-08-10", time: "09:00", venue: "สนามกีฬากลาง", status: "กำหนดการ", scoreA: null, scoreB: null },
  { id: 2, sport: "วอลเลย์บอล", teamA: "green", teamB: "yellow", date: "2026-08-10", time: "13:00", venue: "โรงยิม 1", status: "กำหนดการ", scoreA: null, scoreB: null },
  { id: 3, sport: "esports (ROV)", teamA: "blue", teamB: "green", date: "2026-08-11", time: "10:00", venue: "ห้องคอมพิวเตอร์ 3", status: "จบการแข่งขัน", scoreA: 2, scoreB: 1 },
  { id: 4, sport: "แบดมินตัน", teamA: "yellow", teamB: "red", date: "2026-08-11", time: "14:00", venue: "โรงยิม 2", status: "จบการแข่งขัน", scoreA: 1, scoreB: 2 },
];

export const INIT_NEWS = [
  { id: 1, title: "ประกาศเลื่อนเวลาแข่งขันฟุตบอลนัดเปิดสนาม", date: "2026-08-01", body: "เนื่องจากสภาพอากาศ การแข่งขันฟุตบอลนัดแรกจะเริ่มเวลา 09:00 น. แทน 08:00 น." },
  { id: 2, title: "เปิดรับสมัครนักกีฬา esports เพิ่มเติม", date: "2026-07-28", body: "แต่ละสีสามารถส่งรายชื่อนักกีฬา esports เพิ่มได้ที่ครูที่ปรึกษาโครงการ ภายในวันที่ 5 สิงหาคม" },
];

export const INIT_CHECKINS = [
  { studentId: "16573", matchId: 1, time: "08:45" },
];
