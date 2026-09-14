// ตัวช่วยเรียก backend API (server/ ที่ต่อกับ PostgreSQL) — ไม่ได้เป็น "หน้า" ของเว็บโดยตรง
// แต่ทุกหน้า/ทุก component ที่ต้องคุยกับฐานข้อมูล (ล็อกอิน, จัดการนักศึกษา, ตารางแข่งขัน, เช็คชื่อ ฯลฯ) เรียกผ่านไฟล์นี้ทั้งหมด
// วิธีทำงาน: request() คือฟังก์ชันกลาง ใส่ token (ถ้ามี) ลง header ให้อัตโนมัติทุกครั้ง แล้วแปลง error ของ server
// ให้เป็นข้อความภาษาไทยอ่านง่าย ส่วน object `api` ด้านล่างคือรายชื่อ endpoint ทั้งหมดที่แอปนี้ใช้ (1 ฟังก์ชัน = 1 เส้นทาง API)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// เก็บ token ไว้ใน sessionStorage (ไม่ใช่ localStorage) เพราะ localStorage ใช้ร่วมกันทุกแท็บ/หน้าต่างของ
// เบราว์เซอร์เดียวกันเสมอ — ถ้าเปิด 2 แท็บแล้วล็อกอินคนละบัญชี ตัวที่ล็อกอินทีหลังจะไปเขียนทับ token ของแท็บแรก
// พอกดรีเฟรชแท็บแรกก็จะดึง token ใหม่ (บัญชีที่สอง) มาใช้ กลายเป็นบัญชีเดียวกันทั้ง 2 แท็บ ซึ่งไม่ถูกต้อง
// sessionStorage แยกเป็นของตัวเองต่อแท็บ/หน้าต่าง (แม้เป็นเว็บเดียวกัน) แต่ละแท็บจึงคงบัญชีของตัวเองได้แม้กดรีเฟรช
const TOKEN_KEY = "sportsday_token";
let authToken = sessionStorage.getItem(TOKEN_KEY) || null;
// ล้าง token เก่าที่อาจค้างอยู่ใน localStorage จากก่อนเปลี่ยนมาใช้ sessionStorage (กันสับสน/กันบั๊กเดิมกลับมาโดยไม่ตั้งใจ)
localStorage.removeItem(TOKEN_KEY);

export function setAuthToken(token) {
  authToken = token;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken() {
  return authToken;
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `คำขอล้มเหลว (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  me: () => request("/auth/me"),

  getTeams: () => request("/teams"),
  updateTeam: (id, data) => request(`/teams/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  getRoles: () => request("/roles"),
  createRole: (name) => request("/roles", { method: "POST", body: JSON.stringify({ name }) }),
  deleteRole: (name) => request(`/roles/${encodeURIComponent(name)}`, { method: "DELETE" }),

  getStudentYears: () => request("/student-years"),
  createStudentYear: (label) => request("/student-years", { method: "POST", body: JSON.stringify({ label }) }),
  deleteStudentYear: (label) => request(`/student-years/${encodeURIComponent(label)}`, { method: "DELETE" }),

  getStudents: () => request("/students"),
  createStudent: (data) => request("/students", { method: "POST", body: JSON.stringify(data) }),
  updateStudent: (id, data) => request(`/students/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: "DELETE" }),

  getMatches: () => request("/matches"),
  createMatch: (data) => request("/matches", { method: "POST", body: JSON.stringify(data) }),
  updateMatch: (id, data) => request(`/matches/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMatch: (id) => request(`/matches/${id}`, { method: "DELETE" }),

  getNews: () => request("/news"),
  createNews: (data) => request("/news", { method: "POST", body: JSON.stringify(data) }),
  deleteNews: (id) => request(`/news/${id}`, { method: "DELETE" }),

  getCheckins: () => request("/checkins"),
  createCheckin: (data) => request("/checkins", { method: "POST", body: JSON.stringify(data) }),
  deleteCheckin: (id) => request(`/checkins/${id}`, { method: "DELETE" }),

  getAttendanceMessages: (studentId, date) =>
    request(`/attendance-messages?studentId=${encodeURIComponent(studentId)}&date=${encodeURIComponent(date)}`),
  sendAttendanceMessage: (data) =>
    request("/attendance-messages", { method: "POST", body: JSON.stringify(data) }),
  getUnreadMessageCount: () => request("/attendance-messages/unread-count"),

  getEventDays: () => request("/event-days"),
  createEventDay: (date, label) => request("/event-days", { method: "POST", body: JSON.stringify({ date, label }) }),
  createEventDays: (dates, label) => request("/event-days", { method: "POST", body: JSON.stringify({ dates, label }) }),
  updateEventDay: (id, date, label) => request(`/event-days/${id}`, { method: "PUT", body: JSON.stringify({ date, label }) }),
  deleteEventDay: (id) => request(`/event-days/${id}`, { method: "DELETE" }),
};