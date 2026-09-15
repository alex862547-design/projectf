import React, { useMemo, useRef, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Search, Trophy, Users,
  Pencil, Check, X, Trash2, Plus, RotateCcw, UserPlus,
} from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import ConfirmDialog from "../common/ConfirmDialog";
import { api } from "../../api";
import { formatThaiFullDate, formatShortTime } from "../../utils/helpers";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toIso(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// เมนูแอดมิน "จัดการเช็คชื่อ" — ดูรายการเช็คชื่อ/เช็คขาดของทุกกิจกรรมในวันที่เลือกได้ (ย้อนหลังได้ทุกวัน
// ไม่จำกัดแค่วันนี้) จัดกลุ่มตาม "กิจกรรม" ให้อ่านง่าย: ถ้าผูกกับนัดแข่งขัน (เช่น นักกีฬาฟุตบอล) จะกลุ่มตาม
// นัดแข่งขันนั้น ถ้าเป็นตำแหน่งทั่วไป (เจ้าหน้าที่ทีม, กองเชียร์ ฯลฯ) จะกลุ่มตามตำแหน่ง แก้ไขสถานะ/เวลา หรือลบ
// รายการที่บันทึกผิดได้ทันที และเพิ่มรายการเช็คชื่อให้นักศึกษาคนไหนก็ได้ (กรณีลืมเช็คแล้วนักศึกษาแจ้งย้อนหลัง)
export default function AdminCheckins({ checkins, setCheckins, students, matches }) {
  const todayStr = toIso(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const dateInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null); // { id, name }
  const [editingId, setEditingId] = useState(null);
  const [editTime, setEditTime] = useState("");
  const [editStatus, setEditStatus] = useState("present");

  const [addOpen, setAddOpen] = useState(false);
  const [addStudentQuery, setAddStudentQuery] = useState("");
  const [addStudent, setAddStudent] = useState(null);
  const [addMatchId, setAddMatchId] = useState("");
  const [addStatus, setAddStatus] = useState("present");

  const isToday = selectedDate === todayStr;

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        // เบราว์เซอร์บล็อก showPicker ให้ fallback ไป focus แทน
      }
    }
    el.focus();
  };

  const shiftDate = (deltaDays) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(toIso(d));
  };

  const studentsById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const dayCheckins = useMemo(() => checkins.filter((c) => c.date === selectedDate), [checkins, selectedDate]);
  const dayMatches = useMemo(() => matches.filter((m) => m.date === selectedDate), [matches, selectedDate]);

  // จัดกลุ่มรายการเช็คชื่อของวันนี้ตาม "กิจกรรม" — ผูกนัดแข่งขัน (matchId ไม่ว่าง) กลุ่มตามนัดนั้น
  // ไม่ผูกนัดแข่งขัน (เช่น เจ้าหน้าที่ทีม/กองเชียร์) กลุ่มตามตำแหน่งของนักศึกษาแทน
  const groups = useMemo(() => {
    const map = new Map();
    for (const c of dayCheckins) {
      const student = studentsById.get(c.studentId);
      if (!student) continue;
      let key, label, subtitle, sortKey, icon;
      if (c.matchId != null) {
        const match = matches.find((m) => m.id === c.matchId);
        key = `match-${c.matchId}`;
        label = match ? match.sport : `นัดแข่งขัน #${c.matchId}`;
        subtitle = match
          ? `เวลา ${formatShortTime(match.time)} น. · ${match.venue}${match.round ? " · " + match.round : ""}`
          : "ไม่พบข้อมูลนัดแข่งขันนี้แล้ว";
        sortKey = `0-${label}`;
        icon = Trophy;
      } else {
        label = student.role || "ไม่ระบุตำแหน่ง";
        key = `role-${label}`;
        subtitle = "เช็คชื่อทั่วไป ไม่ผูกกับนัดแข่งขัน";
        sortKey = `1-${label}`;
        icon = Users;
      }
      if (!map.has(key)) map.set(key, { key, label, subtitle, sortKey, icon, rows: [] });
      map.get(key).rows.push({ checkin: c, student });
    }
    for (const g of map.values()) {
      g.rows.sort((a, b) => a.student.name.localeCompare(b.student.name, "th"));
    }
    return [...map.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey, "th"));
  }, [dayCheckins, studentsById, matches]);

  const searchQ = searchQuery.trim().toLowerCase();
  const visibleGroups = searchQ
    ? groups
        .map((g) => ({
          ...g,
          rows: g.rows.filter(
            (r) => r.student.name.toLowerCase().includes(searchQ) || r.student.id.toLowerCase().includes(searchQ)
          ),
        }))
        .filter((g) => g.rows.length > 0)
    : groups;

  const presentCount = dayCheckins.filter((c) => (c.status || "present") === "present").length;
  const absentCount = dayCheckins.filter((c) => c.status === "absent").length;

  const updateStatus = async (checkin, status) => {
    try {
      const updated = await api.updateCheckin(checkin.id, { status });
      setCheckins((prev) => prev.map((c) => (c.id === checkin.id ? updated : c)));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (checkin) => {
    setEditingId(checkin.id);
    setEditTime(checkin.time || "");
    setEditStatus(checkin.status || "present");
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async (checkin) => {
    try {
      const updated = await api.updateCheckin(checkin.id, { time: editTime || null, status: editStatus });
      setCheckins((prev) => prev.map((c) => (c.id === checkin.id ? updated : c)));
      setEditingId(null);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteCheckin(id);
      setCheckins((prev) => prev.filter((c) => c.id !== id));
      setPendingDelete(null);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  // นักศึกษาที่ค้นเจอสำหรับฟอร์ม "เพิ่มรายการ" — กันไม่ให้เลือกคนที่มีรายการของกิจกรรมเดียวกัน+วันเดียวกันซ้ำอยู่แล้ว
  const addQ = addStudentQuery.trim().toLowerCase();
  const addMatchIdNum = addMatchId ? Number(addMatchId) : null;
  const alreadyCheckedIds = new Set(
    dayCheckins.filter((c) => (c.matchId ?? null) === addMatchIdNum).map((c) => c.studentId)
  );
  const addResults = addQ
    ? students
        .filter((s) => !alreadyCheckedIds.has(s.id) && (s.name.toLowerCase().includes(addQ) || s.id.toLowerCase().includes(addQ)))
        .slice(0, 8)
    : [];

  const submitAdd = async () => {
    if (!addStudent) return;
    try {
      const created = await api.createCheckin({
        studentId: addStudent.id,
        matchId: addMatchIdNum,
        status: addStatus,
        date: selectedDate,
      });
      setCheckins((prev) => [...prev, created]);
      setAddStudent(null);
      setAddStudentQuery("");
      setAddMatchId("");
      setAddStatus("present");
      setAddOpen(false);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="px-4 md:px-8 pb-10 space-y-5">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-3">
          <button
            onClick={() => shiftDate(-1)}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="วันก่อนหน้า"
          >
            <ChevronLeft size={18} />
          </button>
          <div
            onClick={openDatePicker}
            className="relative flex-1 flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CalendarDays size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-slate-400">กำลังดูข้อมูลของวันที่</div>
              <div className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {formatThaiFullDate(new Date(selectedDate + "T00:00:00"))}
              </div>
            </div>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              tabIndex={-1}
              aria-hidden="true"
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            />
          </div>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="shrink-0 flex items-center gap-1 text-xs font-semibold text-indigo-500 dark:text-indigo-400 border border-indigo-500/30 rounded-lg px-2.5 py-2 hover:bg-indigo-500/10"
            >
              <RotateCcw size={12} /> วันนี้
            </button>
          )}
          <button
            onClick={() => shiftDate(1)}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="วันถัดไป"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{dayCheckins.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">รายการทั้งหมด</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-500">{presentCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">มาเข้าร่วม</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{absentCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">เช็คขาด</div>
        </Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[12rem]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อหรือรหัสนักศึกษาในวันนี้"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2.5 hover:bg-indigo-700"
        >
          <Plus size={14} /> เพิ่มรายการเช็คชื่อ
        </button>
      </div>

      {addOpen && (
        <Card className="p-5" border="border-indigo-200 dark:border-indigo-500/30">
          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2.5 mb-3" style={{ fontFamily: "Kanit, sans-serif" }}>
            <span className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
              <UserPlus size={15} />
            </span>
            เพิ่มรายการเช็คชื่อสำหรับ{formatThaiFullDate(new Date(selectedDate + "T00:00:00"))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">นักศึกษา</label>
              {addStudent ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                  <span className="text-sm text-slate-900 dark:text-slate-100 truncate">
                    {addStudent.name} · {addStudent.id}
                  </span>
                  <button onClick={() => setAddStudent(null)} className="text-slate-400 hover:text-red-400 shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={addStudentQuery}
                    onChange={(e) => setAddStudentQuery(e.target.value)}
                    placeholder="ค้นหาชื่อหรือรหัสนักศึกษา"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {addResults.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden">
                      {addResults.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setAddStudent(s);
                            setAddStudentQuery("");
                          }}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <span className="truncate">{s.name} · {s.id}</span>
                          <Badge team={s.team} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">กิจกรรม/นัดแข่งขัน</label>
              <select
                value={addMatchId}
                onChange={(e) => setAddMatchId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">ไม่ผูกนัดแข่งขัน (ทั่วไป)</option>
                {dayMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.sport} · {formatShortTime(m.time)} น. · {m.venue}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <input type="radio" checked={addStatus === "present"} onChange={() => setAddStatus("present")} /> มาเข้าร่วม
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <input type="radio" checked={addStatus === "absent"} onChange={() => setAddStatus("absent")} /> เช็คขาด
            </label>
            <button
              onClick={submitAdd}
              disabled={!addStudent}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700"
            >
              <Plus size={14} /> เพิ่มรายการ
            </button>
          </div>
        </Card>
      )}

      {error && <div className="text-xs text-red-400">{error}</div>}

      {visibleGroups.length === 0 && (
        <Card className="p-8 text-center text-sm text-slate-400">
          {searchQ ? "ไม่พบรายการที่ตรงกับคำค้นหา" : "ยังไม่มีรายการเช็คชื่อในวันนี้"}
        </Card>
      )}

      {visibleGroups.map((g) => {
        const Icon = g.icon;
        return (
          <Card key={g.key} className="p-0 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-800/30">
              <span className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                <Icon size={15} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
                  {g.label}
                </div>
                <div className="text-xs text-slate-400">{g.subtitle}</div>
              </div>
              <span className="ml-auto shrink-0 text-xs font-semibold text-slate-400">{g.rows.length} คน</span>
            </div>

            {g.rows.map(({ checkin, student }) => {
              const isEditing = editingId === checkin.id;
              return (
                <div key={checkin.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800/60 last:border-0 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{student.name}</div>
                      <div className="text-xs text-slate-400">รหัส {student.id} · {student.year || "ไม่ระบุชั้นปี"}</div>
                    </div>
                    <Badge team={student.team} />
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="present">มาเข้าร่วม</option>
                        <option value="absent">เช็คขาด</option>
                      </select>
                      <input
                        type="text"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        placeholder="HH:MM"
                        className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button onClick={() => saveEdit(checkin)} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10" title="บันทึก">
                        <Check size={16} />
                      </button>
                      <button onClick={cancelEdit} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-500/10" title="ยกเลิก">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={checkin.status || "present"}
                        onChange={(e) => updateStatus(checkin, e.target.value)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          (checkin.status || "present") === "absent"
                            ? "bg-red-500/10 text-red-400 border-red-900/40"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-900/30"
                        }`}
                      >
                        <option value="present">มาเข้าร่วม</option>
                        <option value="absent">เช็คขาด</option>
                      </select>
                      {checkin.time && <span className="text-xs text-slate-400">{formatShortTime(checkin.time)} น.</span>}
                      {checkin.checkedBy && (
                        <span className="text-[11px] text-slate-400 hidden md:inline">
                          โดย {checkin.checkedBy.isAdmin ? "แอดมิน" : checkin.checkedBy.name}
                        </span>
                      )}
                      <button onClick={() => startEdit(checkin)} className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10" title="แก้ไขเวลา">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setPendingDelete({ id: checkin.id, name: student.name })}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        title="ลบรายการนี้"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        );
      })}

      <ConfirmDialog
        open={!!pendingDelete}
        title="ลบรายการเช็คชื่อนี้?"
        message={pendingDelete && `ลบรายการของ "${pendingDelete.name}" ในวันนี้ใช่หรือไม่ — เจ้าตัวจะกลับไปเป็นสถานะ "ยังไม่เช็คชื่อ" ทันที`}
        confirmLabel="ลบรายการ"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => remove(pendingDelete.id)}
      />
    </div>
  );
}
