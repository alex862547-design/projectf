import React, { useState } from "react";
import { Briefcase, Search, Lock } from "lucide-react";
import Card from "../common/Card";
import { api } from "../../api";

// จัดกลุ่มชั้นปีของนักศึกษาสำหรับปุ่มลัด — ตัดเลขห้องออก (เช่น "ปวช.1/5" -> "ปวช.1") ให้เหลือกลุ่มที่มีความหมาย
const yearGroupOf = (year) => (year || "").split("/")[0] || "ไม่ระบุ";
const roomNumberOf = (year) => {
  const n = Number((year || "").split("/")[1]);
  return Number.isNaN(n) ? 0 : n;
};

// แท็บ "จัดการตำแหน่ง" — เดิมเปิดให้นักศึกษาที่ได้รับสิทธิ์ can_checkin ทุกตำแหน่งใช้ได้ ตอนนี้จำกัดให้เหลือ
// เฉพาะ "หัวหน้าสี" เท่านั้น (เจ้าหน้าที่ทีม/นักกีฬาตำแหน่งอื่นๆ ที่มี can_checkin ไม่มีสิทธิ์นี้แล้ว) ให้ปรับ
// ตำแหน่ง/กีฬาของเพื่อนในทีมสีเดียวกันได้เอง (แทนที่ต้องให้แอดมินทำให้) มี guard เรื่องโควตา
// (นักกีฬาแต่ละชนิด ≤10 คน/สี, หัวหน้าสี ≤1 คน/สี) เหมือนฝั่งแอดมิน — ตรวจซ้ำที่ server ด้วยเสมอ (server ปฏิเสธ
// ถ้าไม่ใช่หัวหน้าสีอยู่แล้ว เช็คซ้ำในนี้ไว้เผื่อเข้าถึงหน้านี้มาโดยตรงแบบใดแบบหนึ่ง)
export default function TeamRoles({ student, students, setStudents, roles }) {
  const [error, setError] = useState("");
  const [selectedYearGroup, setSelectedYearGroup] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const roleOptions = roles && roles.length > 0 ? roles : ["ผู้เข้าร่วมทั่วไป"];

  if (student.role !== "หัวหน้าสี") {
    return (
      <div className="px-4 md:px-8 pb-10">
        <Card className="p-8 text-center">
          <Lock size={28} className="mx-auto text-slate-600" />
          <div className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            เฉพาะหัวหน้าสีเท่านั้นที่ปรับตำแหน่งนักศึกษาคนอื่นได้
          </div>
          <div className="mt-1 text-xs text-slate-400">
            ถ้าต้องการปรับตำแหน่ง/กีฬาของนักศึกษาคนอื่น กรุณาติดต่อหัวหน้าสีหรือผู้ดูแลระบบ
          </div>
        </Card>
      </div>
    );
  }

  const teammates = students.filter((s) => s.team === student.team);

  const yearGroups = [...new Set(teammates.map((t) => yearGroupOf(t.year)))].sort();
  const roomsInGroup =
    selectedYearGroup === "all"
      ? []
      : [...new Set(teammates.filter((t) => yearGroupOf(t.year) === selectedYearGroup).map((t) => t.year))].sort(
          (a, b) => roomNumberOf(a) - roomNumberOf(b)
        );
  const selectYearGroup = (g) => {
    setSelectedYearGroup(g);
    setSelectedRoom(null);
  };
  const visibleTeammates = teammates
    .filter(
      (t) => selectedYearGroup === "all" || (yearGroupOf(t.year) === selectedYearGroup && (!selectedRoom || t.year === selectedRoom))
    )
    .filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    });

  const updateRole = async (id, role) => {
    try {
      const updated = await api.updateStudent(id, { role });
      setStudents(students.map((s) => (s.id === id ? updated : s)));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="px-4 md:px-8 pb-10 space-y-4">
      <div className="text-xs text-slate-400 flex items-center gap-1.5">
        <Briefcase size={13} /> ปรับตำแหน่ง/กีฬาของนักศึกษาในสีเดียวกันได้ (เลือกได้คนละ 1 ตำแหน่งเท่านั้น)
      </div>
      {error && <div className="text-xs text-red-400">{error}</div>}

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาชื่อหรือรหัสนักศึกษา"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-2 overflow-x-scroll pb-2 -mx-1 px-1">
        <button
          onClick={() => selectYearGroup("all")}
          className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
            selectedYearGroup === "all"
              ? "bg-indigo-600 text-white"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
          }`}
        >
          ทั้งหมด ({teammates.length})
        </button>
        {yearGroups.map((g) => {
          const count = teammates.filter((t) => yearGroupOf(t.year) === g).length;
          return (
            <button
              key={g}
              onClick={() => selectYearGroup(g)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                selectedYearGroup === g
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
              }`}
            >
              {g} ({count})
            </button>
          );
        })}
      </div>

      {selectedYearGroup !== "all" && roomsInGroup.length > 0 && (
        <div className="flex gap-2 overflow-x-scroll pb-2 -mx-1 px-1">
          <button
            onClick={() => setSelectedRoom(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
              !selectedRoom
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:border-indigo-500 hover:text-indigo-400"
            }`}
          >
            ทุกห้องใน {selectedYearGroup}
          </button>
          {roomsInGroup.map((room) => {
            const count = teammates.filter((t) => t.year === room).length;
            return (
              <button
                key={room}
                onClick={() => setSelectedRoom(room)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                  selectedRoom === room
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:border-indigo-500 hover:text-indigo-400"
                }`}
              >
                {room} ({count})
              </button>
            );
          })}
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        {visibleTeammates.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">ไม่มีนักศึกษาในกลุ่มนี้</div>
        )}
        {visibleTeammates.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/60 last:border-0">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
              {t.name.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.name}</div>
              <div className="text-xs text-slate-400">รหัส {t.id} · {t.year || "ไม่ระบุชั้นปี"}</div>
            </div>
            <select
              value={t.role || roleOptions[0]}
              onChange={(e) => updateRole(t.id, e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        ))}
      </Card>
    </div>
  );
}
