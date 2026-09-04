import React, { useState } from "react";
import { Trophy, Calendar, LogIn, Sun, Moon } from "lucide-react";
import PageHeader from "../common/PageHeader";
import GuestHome from "./GuestHome";
import MatchSchedule from "../user/MatchSchedule";

const TABS = [
  { key: "home", label: "หน้าหลัก", icon: Trophy },
  { key: "schedule", label: "ตารางแข่งขัน", icon: Calendar },
];

// หน้าเยี่ยมชมเว็บไซต์แบบไม่ต้องล็อกอิน (สำหรับผู้ที่ไม่ใช่นักศึกษา) — เห็นได้แค่หน้าหลักกับตารางแข่งขันเท่านั้น
export default function GuestView({ students, matches, checkins, news, roles, theme, onToggleTheme, onExit }) {
  const [activeTab, setActiveTab] = useState("home");
  const active = TABS.find((t) => t.key === activeTab) || TABS[0];
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" style={{ fontFamily: "Sarabun, sans-serif" }}>
      <div className="sticky top-0 z-30 bg-slate-950 border-b border-slate-800/80 text-white">
        <div className="px-4 md:px-8 py-3 flex items-center gap-3 flex-wrap">
          <img src="/logo.png" alt="โลโก้วิทยาลัย" className="w-9 h-9 object-contain shrink-0" />
          <div className="text-sm font-bold shrink-0" style={{ fontFamily: "Kanit, sans-serif" }}>กีฬาสี</div>

          <nav className="flex items-center gap-1.5 ml-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === t.key ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              title={isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
              className="p-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white"
            >
              {isDark ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold px-3.5 py-2 hover:bg-indigo-700 transition"
            >
              <LogIn size={15} /> เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>

      <PageHeader
        icon={active.icon}
        title={active.label}
        subtitle="กำลังเยี่ยมชมแบบไม่ล็อกอิน — เข้าสู่ระบบเพื่อใช้งานฟีเจอร์อื่นๆ เช่น เช็คชื่อ"
      />

      {activeTab === "home" && <GuestHome students={students} matches={matches} checkins={checkins} news={news} roles={roles} />}
      {activeTab === "schedule" && <MatchSchedule matches={matches} students={students} />}
    </div>
  );
}
