import React, { useMemo, useRef, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Search, Trophy, Users,
  Pencil, Check, X, Trash2, Plus, RotateCcw, UserPlus, CheckCircle2, XCircle,
} from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import ConfirmDialog from "../common/ConfirmDialog";
import StudentDetailModal from "../common/StudentDetailModal";
import { api } from "../../api";
import { formatThaiFullDate, formatShortTime, sortStudentsByYear, extractSportFromRole as extractSport, matchForRole } from "../../utils/helpers";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toIso(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// เมนูแอดมิน "จัดการเช็คชื่อ" — ดูและเช็คชื่อได้เองในวันที่เลือก (ย้อนหลังได้ทุกวัน ไม่จำกัดแค่วันนี้)
// จัดกลุ่มตาม "ตำแหน่ง/ประเภทกิจกรรม" ทุกตำแหน่งที่มีในระบบ (เหมือนหน้าเช็คชื่อของนักศึกษา แต่แอดมินเห็นทุกสี
// ทุกตำแหน่งพร้อมกัน ไม่ถูกจำกัดแค่สี/ตำแหน่งตัวเอง) แต่ละแถวถ้ายังไม่เช็คชื่อจะมีปุ่ม "เช็คชื่อ/เช็คขาด" กดเช็ค
// ได้ทันทีเหมือนฝั่งนักศึกษา ถ้าเช็คไปแล้วจะแก้ไขสถานะ/เวลา หรือลบรายการที่บันทึกผิดได้เลย
export default function AdminCheckins({ checkins, setCheckins, students, matches, roles, eventDays = [] }) {
  const todayStr = toIso(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  // เช็คชื่อได้แค่วันที่แอดมินตั้งไว้เป็น "วันจัดกิจกรรม" เท่านั้น — server บังคับเงื่อนไขเดียวกันนี้อยู่แล้วตอน
  // POST /api/checkins กันเผลอเช็คชื่อวันที่ไม่มีกิจกรรมเลย ทำที่หน้านี้ด้วยเพื่อไม่ให้เห็นปุ่มที่กดแล้วโดนปฏิเสธเปล่าๆ
  const isEventDay = eventDays.some((d) => d.date === selectedDate);
  const dateInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null); // { id, name }
  const [editingId, setEditingId] = useState(null);
  const [editTime, setEditTime] = useState("");
  const [editStatus, setEditStatus] = useState("present");

  // ปุ่มลัดเลือกตำแหน่ง/กิจกรรมที่จะดู — กดปุ่มเดิมซ้ำเพื่อซ่อน ไม่โหลด/แสดงรายชื่อทุกตำแหน่งพร้อมกันทีเดียว
  // (บางตำแหน่งเช่นกองเชียร์มีนักศึกษาเป็นร้อยคน แสดงทุกกลุ่มพร้อมกันจะยาวและอืดเกินไป)
  const [selectedGroupKey, setSelectedGroupKey] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null); // กดชื่อนักศึกษาเพื่อดูประวัติ/สังกัด/ตำแหน่งแบบย่อ

  const [addOpen, setAddOpen] = useState(false);
  const [addStudentQuery, setAddStudentQuery] = useState("");
  const [addStudent, setAddStudent] = useState(null);
  const [addRole, setAddRole] = useState("");
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

  const dayCheckins = useMemo(() => checkins.filter((c) => c.date === selectedDate), [checkins, selectedDate]);

  // ตำแหน่ง/ประเภทกิจกรรมทั้งหมดในระบบ — เอามาจากรายการตำแหน่งที่แอดมินตั้งไว้ (roles) รวมกับตำแหน่งที่นักศึกษา
  // บางคนอาจยังติดอยู่แต่ถูกลบออกจากรายการไปแล้ว (กันตกหล่น ไม่ให้ใครหายไปจากทุกกลุ่มเลย)
  const allRoleNames = useMemo(() => {
    const set = new Set(roles || []);
    students.forEach((s) => set.add(s.role || "ไม่ระบุตำแหน่ง"));
    return [...set];
  }, [roles, students]);

  // แต่ละตำแหน่งผูกกับ "กิจกรรม" อะไร — ตำแหน่งนักกีฬาเฉพาะทางผูกกับนัดแข่งขันของกีฬานั้น (หากีฬาให้จากชื่อ
  // นัดแข่งขัน ไม่กรองด้วยวันที่ เพราะนัดหนึ่งใช้เช็คชื่อย้อนหลัง/ล่วงหน้าได้ วันที่ของ checkin เป็นคนละเรื่องกับ
  // วันที่ตั้งไว้ของนัดแข่งขัน) ตำแหน่งทั่วไป (เจ้าหน้าที่ทีม, กองเชียร์ ฯลฯ) ไม่ผูกกับนัดแข่งขันใด
  const activityByRole = useMemo(() => {
    const map = new Map();
    for (const role of allRoleNames) {
      const sport = extractSport(role);
      const match = sport ? matchForRole(role, matches) : null;
      map.set(role, { sport, match, matchId: match ? match.id : null });
    }
    return map;
  }, [allRoleNames, matches]);

  // จัดกลุ่มเป็น "รายชื่อทั้งหมดของแต่ละตำแหน่ง" (เหมือนหน้าเช็คชื่อของนักศึกษา) ไม่ใช่แค่คนที่เช็คไปแล้ว —
  // ทำให้แอดมินเห็นครบทุกคนพร้อมปุ่มเช็คชื่อ/เช็คขาดให้คนที่ยังไม่เช็ค และแก้ไข/ลบให้คนที่เช็คไปแล้วได้ในที่เดียว
  const groups = useMemo(() => {
    const list = allRoleNames.map((role) => {
      const { sport, match, matchId } = activityByRole.get(role);
      const label = sport || role;
      const subtitle = sport
        ? match
          ? `เวลา ${formatShortTime(match.time)} น. · ${match.venue}${match.round ? " · " + match.round : ""}`
          : "ยังไม่มีนัดแข่งขันสำหรับกีฬานี้ในระบบ"
        : "เช็คชื่อทั่วไป ไม่ผูกกับนัดแข่งขัน";
      const roster = sortStudentsByYear(students.filter((s) => (s.role || "ไม่ระบุตำแหน่ง") === role)).map((student) => ({
        student,
        checkin: dayCheckins.find((c) => c.studentId === student.id && (c.matchId ?? null) === matchId) || null,
      }));
      return {
        key: `role-${role}`,
        label,
        subtitle,
        icon: sport ? Trophy : Users,
        sortKey: sport ? `0-${label}` : `1-${label}`,
        matchId,
        rows: roster,
      };
    });
    return list.filter((g) => g.rows.length > 0).sort((a, b) => a.sortKey.localeCompare(b.sortKey, "th"));
  }, [allRoleNames, activityByRole, students, dayCheckins]);

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

  const quickCheckin = async (student, matchId, status) => {
    try {
      const created = await api.createCheckin({ studentId: student.id, matchId, status, date: selectedDate });
      setCheckins((prev) => [...prev, created]);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

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

  // ตัวเลือก "ประเภทกิจกรรม" ในฟอร์มเพิ่มรายการ — ตัวแรกคือ "ทั่วไป" (ไม่ผูกกีฬา) ตามด้วยทุกตำแหน่งในระบบ
  // เรียงตามชื่อกีฬา/ตำแหน่งให้หาง่าย
  const activityOptions = useMemo(() => {
    const opts = allRoleNames.map((role) => {
      const { sport, matchId } = activityByRole.get(role);
      return { role, label: sport || role, matchId };
    });
    opts.sort((a, b) => a.label.localeCompare(b.label, "th"));
    return [{ role: "", label: "ทั่วไป (ไม่ผูกกิจกรรมกีฬา)", matchId: null }, ...opts];
  }, [allRoleNames, activityByRole]);

  const selectedAddActivity = activityOptions.find((o) => o.role === addRole) || activityOptions[0];
  const addMatchIdNum = selectedAddActivity.matchId;

  // นักศึกษาที่ค้นเจอสำหรับฟอร์ม "เพิ่มรายการ" — กันไม่ให้เลือกคนที่มีรายการของกิจกรรมเดียวกัน+วันเดียวกันซ้ำอยู่แล้ว
  const addQ = addStudentQuery.trim().toLowerCase();
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
      setAddRole("");
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
        {!isEventDay && (
          <div className="px-4 py-2 border-t border-red-500/20 bg-red-500/5">
            <span className="text-[11px] font-semibold text-red-500 dark:text-red-400">
              วันนี้ไม่ใช่วันจัดกิจกรรม จึงเช็คชื่อไม่ได้ — ไปที่ "วันจัดกิจกรรม" เพื่อเพิ่มวันนี้เข้าไป หรือเลือกวันที่อื่นที่มีกิจกรรม
            </span>
          </div>
        )}
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
            placeholder="ค้นหาชื่อหรือรหัสนักศึกษา"
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
              <label className="block text-[11px] text-slate-400 mb-1">ประเภทกิจกรรม</label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {activityOptions.map((o) => (
                  <option key={o.role || "general"} value={o.role}>
                    {o.label}
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
              disabled={!addStudent || !isEventDay}
              title={!isEventDay ? "วันที่นี้ไม่ใช่วันจัดกิจกรรม เช็คชื่อไม่ได้" : undefined}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700"
            >
              <Plus size={14} /> เพิ่มรายการ
            </button>
          </div>
        </Card>
      )}

      {error && <div className="text-xs text-red-400">{error}</div>}

      {/* ปุ่มลัดของแต่ละตำแหน่ง/กิจกรรม — ตอนกำลังค้นหาจะซ่อนแถบนี้ไปเลย เพราะค้นหาจะมองข้ามตำแหน่งที่เลือกไว้
          แล้วค้นทั่วทุกตำแหน่งให้แทน (เหมือนหน้าเช็คชื่อของนักศึกษา) */}
      {!searchQ && (
        <div className="flex gap-2 overflow-x-scroll pb-2 -mx-1 px-1">
          {groups.map((g) => {
            const Icon = g.icon;
            const checkedCount = g.rows.filter((r) => r.checkin).length;
            const isActive = selectedGroupKey === g.key;
            return (
              <button
                key={g.key}
                onClick={() => setSelectedGroupKey((prev) => (prev === g.key ? null : g.key))}
                className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
                }`}
              >
                <Icon size={13} className={isActive ? "text-white" : "text-indigo-400"} />
                {g.label} ({checkedCount}/{g.rows.length})
              </button>
            );
          })}
        </div>
      )}

      {!searchQ && !selectedGroupKey && (
        <Card className="p-8 text-center text-sm text-slate-400">เลือกตำแหน่ง/กิจกรรมด้านบนเพื่อดูรายชื่อและเช็คชื่อ</Card>
      )}

      {visibleGroups.length === 0 && (searchQ || selectedGroupKey) && (
        <Card className="p-8 text-center text-sm text-slate-400">
          {searchQ ? "ไม่พบนักศึกษาที่ตรงกับคำค้นหา" : "ยังไม่มีนักศึกษาในตำแหน่งนี้"}
        </Card>
      )}

      {(searchQ ? visibleGroups : visibleGroups.filter((g) => g.key === selectedGroupKey)).map((g) => {
        const Icon = g.icon;
        const checkedCount = g.rows.filter((r) => r.checkin).length;
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
              <span className="ml-auto shrink-0 text-xs font-semibold text-slate-400">
                เช็คแล้ว {checkedCount}/{g.rows.length} คน
              </span>
            </div>

            {g.rows.map(({ checkin, student }) => {
              const isEditing = checkin && editingId === checkin.id;
              return (
                <div key={student.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800/60 last:border-0 flex-wrap">
                  <button
                    onClick={() => setViewingStudent(student)}
                    className="flex items-center gap-2 min-w-0 text-left hover:opacity-80"
                    title="กดเพื่อดูข้อมูลนักศึกษา"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate underline decoration-dotted decoration-slate-400">
                        {student.name}
                      </div>
                      <div className="text-xs text-slate-400">รหัส {student.id} · {student.year || "ไม่ระบุชั้นปี"}</div>
                    </div>
                    <Badge team={student.team} />
                  </button>

                  {!checkin && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => quickCheckin(student, g.matchId, "present")}
                        disabled={!isEventDay}
                        title={!isEventDay ? "วันที่นี้ไม่ใช่วันจัดกิจกรรม เช็คชื่อไม่ได้" : undefined}
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700"
                      >
                        <CheckCircle2 size={14} /> เช็คชื่อ
                      </button>
                      <button
                        onClick={() => quickCheckin(student, g.matchId, "absent")}
                        disabled={!isEventDay}
                        title={!isEventDay ? "วันที่นี้ไม่ใช่วันจัดกิจกรรม เช็คชื่อไม่ได้" : undefined}
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white dark:bg-slate-900 text-red-400 border border-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold px-3.5 py-2 hover:bg-red-500/10"
                      >
                        <XCircle size={14} /> เช็คขาด
                      </button>
                    </div>
                  )}

                  {checkin && isEditing && (
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
                  )}

                  {checkin && !isEditing && (
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

      <StudentDetailModal
        student={viewingStudent}
        checkins={checkins}
        matches={matches}
        onClose={() => setViewingStudent(null)}
      />
    </div>
  );
}
