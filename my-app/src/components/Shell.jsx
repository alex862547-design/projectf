import React, { useState } from "react";
import { LogOut, Menu, ChevronLeft, ChevronRight, Sun, Moon, Eye } from "lucide-react";
import ConfirmDialog from "./common/ConfirmDialog";

export default function Shell({ role, name, tabs, active, setActive, onLogout, theme, onToggleTheme, onPreviewUser, topOffset = 0, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebarCollapsed") === "1");

  const toggleSidebar = () =>
    setSidebarCollapsed((v) => {
      localStorage.setItem("sidebarCollapsed", v ? "0" : "1");
      return !v;
    });

  const ThemeToggle = ({ compact }) => {
    const isDark = theme === "dark";
    const trackSize = "w-11 h-6";
    const knobSize = "w-5 h-5";
    const knobTranslate = isDark ? "translate-x-[22px]" : "translate-x-0.5";

    const switchEl = (
      <span
        role="switch"
        aria-checked={isDark}
        className={`relative inline-flex ${trackSize} shrink-0 items-center rounded-full transition-colors ${
          isDark ? "bg-indigo-600" : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-1/2 -translate-y-1/2 ${knobSize} rounded-full bg-white shadow-md flex items-center justify-center transition-transform ${knobTranslate}`}
        >
          {isDark ? <Moon size={11} className="text-indigo-600" /> : <Sun size={11} className="text-amber-500" />}
        </span>
      </span>
    );

    if (compact) {
      return (
        <button
          onClick={onToggleTheme}
          title={isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
          className="p-1 rounded-full"
        >
          {switchEl}
        </button>
      );
    }

    return (
      <button
        onClick={onToggleTheme}
        className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
      >
        <span>{isDark ? "โหมดมืด" : "โหมดสว่าง"}</span>
        {switchEl}
      </button>
    );
  };

  const NavItems = ({ onNavigate }) => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => {
              setActive(t.key);
              onNavigate?.();
            }}
            className={`relative w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/30" : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            {isActive && <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-indigo-400" />}
            <t.icon size={16} className="shrink-0" /> {t.label}
            {!!t.badge && (
              <span className="ml-auto flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold shrink-0">
                {t.badge > 99 ? "99+" : t.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const Profile = () => (
    <div className="px-3 py-4 border-t border-white/10">
      <div className="flex items-center gap-2 px-2 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-white/10">
          {name.slice(0, 2)}
        </div>
        <div className="text-xs min-w-0">
          <div className="font-semibold text-white truncate">{name}</div>
          <div className="text-slate-400">{role === "admin" ? "ผู้ดูแลระบบ" : "นักศึกษา"}</div>
        </div>
      </div>
      <ThemeToggle />
      {onPreviewUser && (
        <button
          onClick={onPreviewUser}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <Eye size={14} /> ดูตัวอย่างหน้านักศึกษา
        </button>
      )}
      <button
        onClick={() => setConfirmLogout(true)}
        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
      >
        <LogOut size={14} /> ออกจากระบบ
      </button>
    </div>
  );

  const Brand = () => (
    <div className="min-w-0 px-5 py-5 border-b-2 border-slate-800 shadow-sm shadow-black/20 flex items-center gap-3">
      <img src="/logo.png" alt="โลโก้วิทยาลัย" className="w-14 h-14 object-contain shrink-0" />
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-widest text-indigo-300 font-semibold truncate">กีฬาสี</div>
        <div className="font-bold text-white text-sm mt-0.5 truncate" style={{ fontFamily: "Kanit, sans-serif" }}>
          {role === "admin" ? "แผงควบคุมผู้ดูแล" : "แผงผู้ใช้งาน"}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex" style={{ fontFamily: "Sarabun, sans-serif" }}>
      {/* Desktop sidebar */}
      {/* ไม่ใส่ self-start ตรงนี้ เพื่อให้กล่องนี้สูงเท่ากับ main (คอลัมน์ข้างๆ) สำหรับ sticky ถึงจะมีระยะให้ "ติดขอบบน" ได้เวลาเลื่อนหน้าที่ยาวๆ เช่น รายชื่อนักศึกษา 250+ คน */}
      <div className="hidden md:block relative shrink-0">
        {/* topOffset เผื่อพื้นที่แถบแบนเนอร์โหมดดูตัวอย่างของแอดมิน (sticky top-0 เหมือนกัน) กันไม่ให้ทับกับหัวแถบเมนู */}
        <aside
          style={{ top: topOffset, height: `calc(100vh - ${topOffset}px)` }}
          className={`bg-slate-950 border-r border-slate-800/80 text-slate-200 flex flex-col sticky self-start overflow-hidden transition-[width] duration-200 ${
            sidebarCollapsed ? "w-0" : "w-60"
          }`}
        >
          <div className="w-60 flex flex-col h-full overflow-y-auto">
            <Brand />
            <NavItems />
            <Profile />
          </div>
        </aside>
        {/* fixed (ไม่ใช่ absolute) กันปุ่มหลุดจอเวลาหน้ายาวมาก เช่น รายชื่อนักศึกษา 250 คน ที่ทำให้ความสูงของคอลัมน์ข้างๆ ยืดตามไปด้วย */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
          title={sidebarCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
          className={`hidden md:flex fixed top-1/2 -translate-y-1/2 z-20 w-6 h-16 rounded-r-xl bg-indigo-600 hover:bg-indigo-500 text-white items-center justify-center shadow-lg shadow-black/30 active:scale-95 transition-all duration-200 ${
            sidebarCollapsed ? "left-0" : "left-60"
          }`}
        >
          {sidebarCollapsed ? <ChevronRight size={15} strokeWidth={3} /> : <ChevronLeft size={15} strokeWidth={3} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 animate-[fadeIn_0.15s_ease-out]"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-slate-950 border-r border-slate-800/80 text-slate-200 flex flex-col h-full shadow-2xl animate-[slideIn_0.2s_ease-out] overflow-hidden">
            {/* ครอบด้วย overflow-y-auto ของตัวเอง กันไม่ให้เนื้อหาล้นแล้วเลื่อนหลุดจอ/สะดุดตอนปัดเร็วๆ บนมือถือ (เดิมไม่มีกรอบเลื่อนเลย) */}
            <div className="flex flex-col h-full overflow-y-auto overscroll-contain">
              <Brand />
              <NavItems onNavigate={() => setDrawerOpen(false)} />
              <Profile />
            </div>

            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="ปิดเมนู"
              className="absolute top-1/2 -translate-y-1/2 right-0 w-10 h-20 rounded-l-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-black/40 active:scale-95 transition z-10"
            >
              <ChevronLeft size={22} strokeWidth={3} />
            </button>
          </aside>
        </div>
      )}

      {/* หน้ายาวๆ จะเลื่อนที่ระดับเอกสาร/หน้าต่างจริงๆ (ไม่ใช่เลื่อนภายใน main เอง เพราะ container นอกไม่ได้จำกัดความสูงไว้)
          จึงตัด overflow-y-auto ออกจาก main — ถ้าเปิดไว้จะไปรบกวนตำแหน่งอ้างอิงของ sticky ลูกข้างใน (แถบบนมือถือ)
          ทำให้ sticky คำนวณผิดกรอบ เลื่อนไปกับเนื้อหาแทนที่จะติดขอบบนจริงๆ (คือสาเหตุที่ปัดเร็วๆ แล้วแถบบนไม่ล็อก) */}
      <main className="flex-1">
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800/80 text-white">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10"
            aria-label="เปิดเมนู"
          >
            <Menu size={20} />
          </button>
          <div className="text-sm font-bold" style={{ fontFamily: "Kanit, sans-serif" }}>
            {tabs.find((t) => t.key === active)?.label || "กีฬาสี"}
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle compact />
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
              {name.slice(0, 2)}
            </div>
          </div>
        </div>
        {children}
      </main>

      <ConfirmDialog
        open={confirmLogout}
        title="ออกจากระบบ"
        message="คุณต้องการออกจากระบบใช่หรือไม่?"
        confirmLabel="ออกจากระบบ"
        cancelLabel="ยกเลิก"
        danger
        onConfirm={() => {
          setConfirmLogout(false);
          onLogout();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
