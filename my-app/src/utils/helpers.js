// รวมฟังก์ชันช่วยเล็กๆ ที่ใช้ซ้ำหลายหน้าทั่วทั้งเว็บ (ไม่ผูกกับหน้าใดหน้าหนึ่งโดยเฉพาะ) เช่น
// จัดรูปแบบวันที่ไทย, ดึงชื่อกีฬาออกจากตำแหน่ง, เรียงรายชื่อตามชั้นปี, และแคชข้อมูลสีทีมไว้ใช้ได้จากทุกที่
import { TEAMS as DEFAULT_TEAMS } from "../data/mockData";

// ใช้ค่า default จาก mockData ไปพลางๆ ก่อน จนกว่า App จะโหลดทีมจริงจาก API มาแทนที่
// (App.jsx เรียก setTeams() ทุกครั้งที่ข้อมูลทีมจาก server เปลี่ยน เพื่อให้ teamById ทั่วทั้งแอปอัปเดตตาม)
let TEAMS_CACHE = DEFAULT_TEAMS;

export function setTeams(teams) {
  if (Array.isArray(teams) && teams.length > 0) TEAMS_CACHE = teams;
}

export function getTeams() {
  return TEAMS_CACHE;
}

export const teamById = (id) => TEAMS_CACHE.find((t) => t.id === id) || { id, name: id, accent: "#94a3b8" };

// แปลงวันที่ "YYYY-MM-DD" (จาก DB) ให้เป็น "D/M/YYYY" แบบไทย (วันขึ้นก่อน ไม่ใช่ปี) เช่น 23/8/2569
// ใช้ตัวนี้แทนการโชว์ค่าดิบจาก DB ทุกจุดในแอป เพื่อให้รูปแบบวันที่ตรงกันทั้งระบบ
export function formatThaiDate(iso) {
  if (!iso) return iso;
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y + 543}`;
}

// ตัดวินาทีออกจากเวลา "HH:MM:SS" ที่ได้จาก DB ให้เหลือแค่ "HH:MM" (ไม่มีใครสนใจวินาทีของเวลาแข่งขัน)
export function formatShortTime(time) {
  if (!time) return time;
  const match = String(time).match(/^(\d{1,2}:\d{2})/);
  return match ? match[1] : time;
}

// แปลง timestamp เต็ม (เช่น edited_at จาก DB) ให้เป็น "D/M/YYYY HH:MM" แบบไทย ใช้โชว์ "แก้ไขเมื่อ" ในประวัติ
export function formatThaiDateTime(isoString) {
  if (!isoString) return isoString;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  const date = formatThaiDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${date} ${hh}:${mm}`;
}

const THAI_WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

// วันที่แบบเต็มยาว เช่น "วันจันทร์ที่ 31 สิงหาคม 2569" (ใช้กับแบนเนอร์สรุปวันนี้ในหน้าหลัก)
export function formatThaiFullDate(date = new Date()) {
  const weekday = THAI_WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = THAI_MONTHS_FULL[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `วัน${weekday}ที่ ${day} ${month} ${year}`;
}

// วันที่ปัจจุบันในรูปแบบ "YYYY-MM-DD" ตามเวลาเครื่อง (ใช้เทียบกับ date ที่เก็บใน DB)
export function todayISODate() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// ดึงชื่อกีฬาเฉพาะออกจากตำแหน่ง เช่น "นักกีฬาฟุตบอล" -> "ฟุตบอล"
// (ตำแหน่งที่ไม่ได้ขึ้นต้นด้วย "นักกีฬา" เช่น เจ้าหน้าที่ทีม/กองเชียร์ -> null ไม่ผูกกีฬาใดกีฬาหนึ่ง)
export function extractSportFromRole(role) {
  if (!role) return null;
  const stripped = role.replace(/^นักกีฬา/, "").trim();
  if (stripped === role.trim()) return null;
  return stripped || null;
}

// ตำแหน่งที่ขึ้นต้นด้วย "Staff" (เช่น "Staffกองเชียร์") คือเจ้าหน้าที่ดูแลตำแหน่งนั้น มีสิทธิ์เช็คชื่อ
// "ตำแหน่งที่ตามหลัง Staff" แทนตำแหน่งของตัวเอง (คนละกลุ่มกัน) — ใช้จุดนี้แทนการเทียบ role ตรงๆ ทุกที่ที่
// เกี่ยวกับสิทธิ์เช็คชื่อ (ต้องตรงกับ checkinTargetRole ฝั่ง server ใน assertCanActOnStudent เป๊ะๆ)
export function checkinTargetRole(role) {
  if (!role) return role;
  return role.startsWith("Staff") ? role.slice(5) : role;
}

// เทียบชื่อกีฬาแบบหลวมๆ ตัดวงเล็บ/ช่องว่าง/ตัวพิมพ์เล็กใหญ่ออก เช่น "esports (ROV)" กับ "esports" ให้ถือว่าตรงกัน
export function normalizeSportName(str) {
  return (str || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/\s+/g, "");
}

// หานัดแข่งขันที่ตรงกับตำแหน่งนี้ (ใช้เฉพาะตำแหน่งที่เป็นนักกีฬาเฉพาะทาง) — จับคู่แค่ชื่อกีฬา ไม่กรองด้วยวันที่ของนัด
// เพราะ "วันที่" ของ checkin (ที่เลือกเช็คชื่อย้อนหลังได้) เป็นแค่วันที่บันทึกว่าเช็คชื่อวันไหน ไม่ใช่ว่าต้องตรงกับ
// วันที่ตั้งไว้ของนัดแข่งขันเป๊ะๆ (นัดแข่งหนึ่งอาจถูกเลื่อน/เช็คชื่อล่วงหน้า-ย้อนหลังได้อยู่แล้วในทางปฏิบัติ)
export function matchForRole(role, matches) {
  const roleSport = extractSportFromRole(role);
  if (!roleSport) return null;
  const rs = normalizeSportName(roleSport);
  return matches.find((m) => {
    const ms = normalizeSportName(m.sport);
    return ms.includes(rs) || rs.includes(ms);
  });
}

// เรียงรายชื่อนักศึกษาตามชั้นปีจาก ปวช.1 ไปจนถึง ปวส.2 (แล้วเรียงเลขห้องต่อ)
const YEAR_GROUP_ORDER = ["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"];
function yearSortKey(year) {
  const [group, room] = (year || "").split("/");
  const groupIdx = YEAR_GROUP_ORDER.indexOf(group);
  return [groupIdx === -1 ? YEAR_GROUP_ORDER.length : groupIdx, Number(room) || 0];
}
export function sortStudentsByYear(students) {
  return [...students].sort((a, b) => {
    const [ga, ra] = yearSortKey(a.year);
    const [gb, rb] = yearSortKey(b.year);
    return ga - gb || ra - rb;
  });
}

// รูปแบบข้อความที่เก็บใน QR code เช็คชื่อประจำตัวนักศึกษา (QRCodeModal สร้าง, QRScannerModal อ่าน)
// ใส่คำนำหน้าเฉพาะไว้ (ไม่ใช่แค่ตัวรหัสเปล่าๆ) เพื่อกันเผลอเอา QR code อื่นที่ไม่เกี่ยวมาสแกนแล้วเข้าใจผิดว่าเป็นรหัสนักศึกษา
const CHECKIN_QR_PREFIX = "SPORTSDAY-CHECKIN:";
export function buildCheckinQRValue(studentId) {
  return `${CHECKIN_QR_PREFIX}${studentId}`;
}
export function parseCheckinQRValue(text) {
  if (typeof text !== "string" || !text.startsWith(CHECKIN_QR_PREFIX)) return null;
  const id = text.slice(CHECKIN_QR_PREFIX.length).trim();
  return id || null;
}
