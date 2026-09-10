import React, { useState, useEffect } from "react";
import { Users, Calendar, Trophy, Newspaper, CheckCircle2, Clock, Briefcase, CalendarDays, Eye } from "lucide-react";

import Login from "./components/Login";
import GuestView from "./components/guest/GuestView";
import Shell from "./components/Shell";
import PageHeader from "./components/common/PageHeader";
import Toast from "./components/common/Toast";
import MouseSparkle from "./components/common/MouseSparkle";

import UserHome from "./components/user/UserHome";
import UserCheckin from "./components/user/UserCheckin";
import UserHistory from "./components/user/UserHistory";
import TeamRoles from "./components/user/TeamRoles";
import MatchSchedule from "./components/user/MatchSchedule";

import AdminStudents from "./components/admin/AdminStudents";
import AdminMatches from "./components/admin/AdminMatches";
import AdminNews from "./components/admin/AdminNews";
import AdminEventDays from "./components/admin/AdminEventDays";

import { api, getAuthToken, setAuthToken } from "./api";
import { setTeams as setTeamsCache } from "./utils/helpers";

// Component รากของทั้งเว็บ — ควบคุมว่าตอนนี้ควรโชว์หน้าไหน (login / เยี่ยมชม / นักศึกษา / แอดมิน)
// และเป็นที่เดียวที่โหลดข้อมูลหลักทั้งหมดจาก API (นักศึกษา, ตารางแข่งขัน, ข่าว, เช็คชื่อ ฯลฯ) มาเก็บไว้
// แล้วส่ง (props) ต่อลงไปให้ทุกหน้าย่อยใช้ ไม่มีหน้าไหนดึงข้อมูลเองตรงๆ (ยกเว้นบางที่ที่ต้อง real-time เร็วกว่า 4 วิ)
export default function App() {
  // session = { role, studentId, name, username } | null
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [students, setStudents] = useState([]);
  const [matches, setMatches] = useState([]);
  const [news, setNews] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [studentYears, setStudentYears] = useState([]);
  const [eventDays, setEventDays] = useState([]);
  const [teams, setTeams] = useState([]);

  const [userTab, setUserTab] = useState("home");
  const [adminTab, setAdminTab] = useState("students");

  const [previewMode, setPreviewMode] = useState(false);
  const [previewUserTab, setPreviewUserTab] = useState("home");
  const [guestMode, setGuestMode] = useState(false);

  const [toast, setToast] = useState(null);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // โหลดข้อมูลสาธารณะจาก PostgreSQL ผ่าน backend API ตอนเปิดแอป
  useEffect(() => {
    Promise.all([api.getStudents(), api.getMatches(), api.getNews(), api.getCheckins(), api.getRoles(), api.getStudentYears(), api.getEventDays(), api.getTeams()])
      .then(([s, m, n, c, r, sy, e, tm]) => {
        setStudents(s);
        setMatches(m);
        setNews(n);
        setCheckins(c);
        setRoles(r);
        setStudentYears(sy);
        setEventDays(e);
        setTeams(tm);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ดึงข้อมูลใหม่เป็นระยะ (ทุก 4 วินาที) เพื่อให้ทุกคนเห็นข้อมูลล่าสุดโดยไม่ต้องกดรีเฟรชเอง
  // (ตั้งใจไม่รวม "matches" ในนี้ เพราะแอดมินอาจกำลังพิมพ์คะแนนอยู่ ไม่อยากให้ค่าที่พิมพ์ค้างถูกเขียนทับ)
  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([api.getStudents(), api.getNews(), api.getCheckins(), api.getRoles(), api.getStudentYears(), api.getEventDays(), api.getTeams()])
        .then(([s, n, c, r, sy, e, tm]) => {
          setStudents(s);
          setNews(n);
          setCheckins(c);
          setRoles(r);
          setStudentYears(sy);
          setEventDays(e);
          setTeams(tm);
        })
        .catch(() => {}); // พลาดชั่วคราวไม่เป็นไร รอบถัดไปจะลองใหม่เอง
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ถ้ามี token ค้างจากครั้งก่อน (ยังไม่หมดอายุ) ให้ล็อกอินอัตโนมัติ
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }
    api
      .me()
      .then((me) => setSession(me))
      .catch(() => setAuthToken(null))
      .finally(() => setCheckingSession(false));
  }, []);

  // เผยแพร่ข้อมูลทีมล่าสุดให้ teamById() ทั่วทั้งแอป (Badge, Standings, Login ฯลฯ) ใช้ได้แบบไม่ต้องส่ง props ลึกๆ
  useEffect(() => {
    setTeamsCache(teams);
  }, [teams]);

  // จำนวนข้อความใหม่จากผู้เช็คชื่อที่ยังไม่ได้อ่าน ใช้โชว์เลขแดงที่แถบ "ประวัติของฉัน" — เฉพาะนักศึกษาที่ล็อกอินจริง (ไม่รวมโหมดดูตัวอย่างของแอดมิน)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  useEffect(() => {
    if (!session || session.role !== "student") {
      setUnreadMessageCount(0);
      return;
    }
    const fetchUnread = () => api.getUnreadMessageCount().then((r) => setUnreadMessageCount(r.count)).catch(() => {});
    fetchUnread();
    const interval = setInterval(fetchUnread, 4000);
    return () => clearInterval(interval);
  }, [session]);

  const handleLogout = () => {
    setAuthToken(null);
    setSession(null);
  };

  const fontLink = (
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@600;800&family=Sarabun:wght@400;500;600;700&display=swap');`}</style>
  );

  if (loading || checkingSession) {
    return (
      <>
        {fontLink}
        <MouseSparkle />
        <div
          className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm"
          style={{ fontFamily: "Sarabun, sans-serif" }}
        >
          <div className="w-9 h-9 rounded-full border-[3px] border-slate-200 dark:border-slate-800 border-t-indigo-500 animate-spin" />
          กำลังโหลดข้อมูล...
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        {fontLink}
        <MouseSparkle />
        <div
          className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6"
          style={{ fontFamily: "Sarabun, sans-serif" }}
        >
          <div className="max-w-sm w-full rounded-2xl border border-red-900/50 bg-red-500/10 shadow-lg shadow-slate-300/50 dark:shadow-black/20 p-6 text-center">
            <div className="mx-auto w-11 h-11 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center text-xl font-bold">
              !
            </div>
            <div className="text-red-400 font-semibold mt-3 text-sm">เชื่อมต่อฐานข้อมูลไม่สำเร็จ</div>
            <div className="text-slate-400 text-sm mt-1">{loadError}</div>
            <div className="text-slate-500 text-xs mt-3">
              ตรวจสอบว่า backend กำลังรันอยู่ที่ http://localhost:4000 (cd server แล้ว npm run dev)
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!session && guestMode) {
    return (
      <>
        {fontLink}
        <MouseSparkle />
        <GuestView
          students={students}
          matches={matches}
          checkins={checkins}
          news={news}
          roles={roles}
          theme={theme}
          onToggleTheme={toggleTheme}
          onExit={() => setGuestMode(false)}
        />
      </>
    );
  }

  if (!session) {
    return (
      <>
        {fontLink}
        <MouseSparkle />
        <Login
          onLogin={(user) => {
            setSession(user);
            setUserTab("home");
            setAdminTab("students");
            setToast({ type: "success", message: `ยินดีต้อนรับ ${user.name || ""}` });
          }}
          onGuestView={() => setGuestMode(true)}
        />
      </>
    );
  }

  // ใช้ร่วมกันทั้งการเข้าสู่ระบบเป็นนักศึกษาจริง และโหมด "ดูตัวอย่างหน้านักศึกษา" ของแอดมิน
  const renderStudentView = (student, activeTab, setActiveTab, logoutFn, previewOnClose) => {
    const tabs = [
      { key: "home", label: "หน้าหลัก", icon: Trophy },
      { key: "checkin", label: "เช็คชื่อกิจกรรม", icon: CheckCircle2 },
      { key: "schedule", label: "ตารางแข่งขัน", icon: Calendar },
      { key: "history", label: "ประวัติของฉัน", icon: Clock, badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
      ...(student.canCheckin ? [{ key: "roles", label: "จัดการตำแหน่ง", icon: Briefcase }] : []),
    ];
    return (
      <>
        {previewOnClose && (
          <div className="sticky top-0 z-[70] bg-amber-500 text-amber-950 text-xs sm:text-sm font-semibold text-center py-2 px-4 flex items-center justify-center gap-3 flex-wrap">
            <Eye size={14} className="shrink-0" />
            <span>กำลังดูตัวอย่างหน้านักศึกษา: {student.name}</span>
            <button onClick={previewOnClose} className="underline font-bold shrink-0">กลับไปหน้าแอดมิน</button>
          </div>
        )}
        <Shell role="user" name={student.name} studentId={previewOnClose ? undefined : student.id} tabs={tabs} active={activeTab} setActive={setActiveTab} onLogout={logoutFn} theme={theme} onToggleTheme={toggleTheme} topOffset={previewOnClose ? 36 : 0}>
          <PageHeader
            icon={tabs.find((t) => t.key === activeTab)?.icon || tabs[0].icon}
            title={tabs.find((t) => t.key === activeTab)?.label || tabs[0].label}
            subtitle={`${student.name} · รหัสนักศึกษา ${student.id} · ${student.role}`}
          />
          {activeTab === "home" && <UserHome student={student} students={students} matches={matches} checkins={checkins} news={news} roles={roles} />}
          {activeTab === "checkin" && <UserCheckin student={student} students={students} matches={matches} checkins={checkins} setCheckins={setCheckins} roles={roles} />}
          {activeTab === "schedule" && <MatchSchedule matches={matches} students={students} />}
          {activeTab === "history" && <UserHistory student={student} matches={matches} checkins={checkins} eventDays={eventDays} />}
          {activeTab === "roles" && student.canCheckin && (
            <TeamRoles student={student} students={students} setStudents={setStudents} roles={roles} />
          )}
        </Shell>
      </>
    );
  };

  if (session.role === "admin") {
    const tabs = [
      { key: "students", label: "จัดการนักศึกษา", icon: Users },
      { key: "matches", label: "ตารางแข่งขัน/คะแนน", icon: Calendar },
      { key: "news", label: "ข่าวสาร", icon: Newspaper },
      { key: "eventdays", label: "วันจัดกิจกรรม", icon: CalendarDays },
    ];

    if (previewMode && students.length > 0) {
      return (
        <>
          {fontLink}
          <MouseSparkle />
          {renderStudentView(students[0], previewUserTab, setPreviewUserTab, () => setPreviewMode(false), () => setPreviewMode(false))}
          <Toast toast={toast} onClose={() => setToast(null)} />
        </>
      );
    }

    return (
      <>
        {fontLink}
        <MouseSparkle />
        <Shell
          role="admin"
          name={session.name}
          tabs={tabs}
          active={adminTab}
          setActive={setAdminTab}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
          onPreviewUser={students.length > 0 ? () => setPreviewMode(true) : undefined}
        >
          <PageHeader
            icon={tabs.find((t) => t.key === adminTab).icon}
            title={tabs.find((t) => t.key === adminTab).label}
            subtitle="วิทยาลัยเทคโนโลยีอุดมศึกษาพณิชยการ · ระบบจัดการกีฬาสี"
          />
          {adminTab === "students" && <AdminStudents students={students} setStudents={setStudents} roles={roles} setRoles={setRoles} studentYears={studentYears} setStudentYears={setStudentYears} teams={teams} setTeams={setTeams} />}
          {adminTab === "matches" && <AdminMatches matches={matches} setMatches={setMatches} teams={teams} />}
          {adminTab === "news" && <AdminNews news={news} setNews={setNews} />}
          {adminTab === "eventdays" && <AdminEventDays eventDays={eventDays} setEventDays={setEventDays} />}
        </Shell>
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  const student = students.find((s) => s.id === session.studentId) || students[0];
  return (
    <>
      {fontLink}
      <MouseSparkle />
      {renderStudentView(student, userTab, setUserTab, handleLogout, null)}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
