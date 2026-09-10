import React, { useState, useEffect } from "react";
import { Plus, Trash2, ShieldCheck, Shield, Tag, Palette, Check, X, Pencil, GraduationCap, ChevronDown, Search, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import Card from "../common/Card";
import ConfirmDialog from "../common/ConfirmDialog";
import { api } from "../../api";

// ชื่อสีไทยที่รู้จัก -> โค้ดสีจริง (ใช้ตอนพิมพ์ชื่อสีทีมใหม่ จะได้เปลี่ยนสีให้ตรงกับชื่อโดยอัตโนมัติ)
const THAI_COLOR_MAP = {
  "สีแดง": "#D6402D",
  "สีน้ำเงิน": "#2C5EAA",
  "สีฟ้า": "#2E9BD6",
  "สีเขียว": "#2F8F5B",
  "สีเหลือง": "#D6A62D",
  "สีส้ม": "#D6752D",
  "สีชมพู": "#D6368B",
  "สีม่วง": "#7A3FD6",
  "สีดำ": "#3A3A3A",
  "สีขาว": "#CBD5E1",
  "สีเทา": "#6B7280",
  "สีน้ำตาล": "#8B5E3C",
};

// เมนูแอดมิน "จัดการนักศึกษา" — หน้าที่ใหญ่และสำคัญที่สุดของฝั่งแอดมิน รวม 4 ส่วนจัดการ (ตำแหน่ง/กีฬา,
// ชั้นปี, สีทีม, เพิ่มนักศึกษาใหม่) ไว้เป็นกล่องพับเก็บได้ด้านบน แล้วตามด้วยรายชื่อนักศึกษาทั้งหมด
// พร้อมช่องค้นหา + ปุ่มลัดกรองตามชั้นปี/ห้อง/ตำแหน่ง และแบ่งหน้า (pagination) หน้าละ 50 คน
// (เพราะมีนักศึกษาเป็นร้อยคน เรนเดอร์ทีเดียวหมดจะหน่วง) แก้ตำแหน่ง/สี/ชั้นปี/สิทธิ์เช็คชื่อของแต่ละคนได้ที่นี่
export default function AdminStudents({ students, setStudents, roles, setRoles, studentYears, setStudentYears, teams, setTeams }) {
  const [form, setForm] = useState({ id: "", name: "", team: "red", role: "", year: "" });
  const [newRole, setNewRole] = useState("");
  const [newYear, setNewYear] = useState("");
  const [error, setError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [yearError, setYearError] = useState("");
  const [pendingToggle, setPendingToggle] = useState(null); // student object pending confirmation
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamColor, setEditTeamColor] = useState("#000000");
  const [colorManuallyChanged, setColorManuallyChanged] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [expandedSections, setExpandedSections] = useState({ roles: false, years: false, teams: false, addForm: false });
  const [selectedYearGroup, setSelectedYearGroup] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRole, setSelectedRole] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const toggleSection = (key) => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const roleOptions = roles && roles.length > 0 ? roles : ["ผู้เข้าร่วมทั่วไป"];
  const yearOptions = studentYears && studentYears.length > 0 ? studentYears : ["ปีที่ 1"];

  // จัดกลุ่มชั้นปีของนักศึกษาสำหรับปุ่มลัด — ตัดเลขห้องออก (เช่น "ปวช.1/5" -> "ปวช.1") ให้เหลือกลุ่มที่มีความหมาย
  const yearGroupOf = (year) => (year || "").split("/")[0] || "ไม่ระบุ";
  const roomNumberOf = (year) => {
    const n = Number((year || "").split("/")[1]);
    return Number.isNaN(n) ? 0 : n;
  };
  const yearGroups = [...new Set(students.map((s) => yearGroupOf(s.year)))].sort();
  const roomsInGroup =
    selectedYearGroup === "all"
      ? []
      : [...new Set(students.filter((s) => yearGroupOf(s.year) === selectedYearGroup).map((s) => s.year))].sort(
          (a, b) => roomNumberOf(a) - roomNumberOf(b)
        );
  const selectYearGroup = (g) => {
    setSelectedYearGroup(g);
    setSelectedRoom(null);
  };
  const visibleStudents = students
    .filter((s) => selectedYearGroup === "all" || (yearGroupOf(s.year) === selectedYearGroup && (!selectedRoom || s.year === selectedRoom)))
    .filter((s) => selectedRole === "all" || s.role === selectedRole)
    .filter((s) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    });

  // แบ่งหน้าละ 50 คน — เรนเดอร์ทั้ง 497 คนพร้อมกันทำให้ DOM บวมมาก (นักศึกษา 1 แถวมี select 3 ตัว) หน้าเลยหน่วงเวลาเลื่อน/พิมพ์ค้นหา
  const totalPages = Math.max(1, Math.ceil(visibleStudents.length / PAGE_SIZE));
  const pageStudents = visibleStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // เปลี่ยนตัวกรองใดๆ แล้วให้กลับไปหน้าแรกเสมอ ไม่งั้นอาจเจอหน้าเปล่าถ้าเดิมอยู่หน้าท้ายๆ
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYearGroup, selectedRoom, selectedRole, searchQuery]);

  const add = async () => {
    if (!form.id || !form.name) return;
    try {
      const payload = { ...form, role: form.role || roleOptions[0], year: form.year || yearOptions[0] };
      const created = await api.createStudent(payload);
      setStudents([...students, created]);
      setForm({ id: "", name: "", team: "red", role: "", year: "" });
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteStudent(id);
      setStudents(students.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const updateTeam = async (id, team) => {
    try {
      const updated = await api.updateStudent(id, { team });
      setStudents(students.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      setError(err.message);
    }
  };

  const updateRole = async (id, role) => {
    try {
      const updated = await api.updateStudent(id, { role });
      setStudents(students.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      setError(err.message);
    }
  };

  const updateYear = async (id, year) => {
    try {
      const updated = await api.updateStudent(id, { year });
      setStudents(students.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleCheckinPermission = async (id, current) => {
    try {
      const updated = await api.updateStudent(id, { canCheckin: !current });
      setStudents(students.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      setError(err.message);
    }
  };

  const addRole = async () => {
    if (!newRole.trim()) return;
    try {
      const updatedRoles = await api.createRole(newRole.trim());
      setRoles(updatedRoles);
      setNewRole("");
      setRoleError("");
    } catch (err) {
      setRoleError(err.message);
    }
  };

  const addYear = async () => {
    if (!newYear.trim()) return;
    try {
      const updatedYears = await api.createStudentYear(newYear.trim());
      setStudentYears(updatedYears);
      setNewYear("");
      setYearError("");
    } catch (err) {
      setYearError(err.message);
    }
  };

  const removeRole = async (name) => {
    try {
      const updatedRoles = await api.deleteRole(name);
      setRoles(updatedRoles);
      setRoleError("");
    } catch (err) {
      setRoleError(err.message);
    }
  };

  const removeYear = async (label) => {
    try {
      const updatedYears = await api.deleteStudentYear(label);
      setStudentYears(updatedYears);
      setYearError("");
    } catch (err) {
      setYearError(err.message);
    }
  };

  const startEditTeam = (t) => {
    setEditingTeamId(t.id);
    setEditTeamName(t.name);
    setEditTeamColor(t.accent);
    setColorManuallyChanged(false);
    setTeamError("");
  };

  const cancelEditTeam = () => {
    setEditingTeamId(null);
    setEditTeamName("");
  };

  // พิมพ์ชื่อสีที่ระบบรู้จัก (เช่น "สีส้ม") ให้เปลี่ยนโค้ดสีตามชื่อให้อัตโนมัติ
  // (หยุดทำถ้าผู้ใช้กดเลือกสีเองไปแล้ว จะได้ไม่ทับสีที่ตั้งใจเลือกเอง)
  const changeEditTeamName = (value) => {
    setEditTeamName(value);
    if (!colorManuallyChanged) {
      const mapped = THAI_COLOR_MAP[value.trim()];
      if (mapped) setEditTeamColor(mapped);
    }
  };

  const saveTeamName = async (id) => {
    if (!editTeamName.trim()) {
      setTeamError("กรุณาพิมพ์ชื่อสีก่อนบันทึก");
      return;
    }
    try {
      const updated = await api.updateTeam(id, { name: editTeamName.trim(), accent: editTeamColor });
      setTeams(teams.map((t) => (t.id === id ? updated : t)));
      setEditingTeamId(null);
      setTeamError("");
    } catch (err) {
      setTeamError(err.message);
    }
  };

  // แถบเลื่อนหน้า ใช้ทั้งบนและใต้รายชื่อ ให้สลับหน้าได้โดยไม่ต้องเลื่อนไปมาไกลๆ
  const PaginationBar = () => (
    <div className="flex items-center justify-between gap-3 flex-wrap px-1 text-xs text-slate-400">
      <div>
        แสดง {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, visibleStudents.length)} จาก {visibleStudents.length} คน
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={13} /> ก่อนหน้า
        </button>
        <span className="px-2 font-semibold text-slate-600 dark:text-slate-300">
          หน้า {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 disabled:cursor-not-allowed"
        >
          ถัดไป <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="px-4 md:px-8 pb-10 space-y-5">
      <Card className="p-5" border="border-indigo-200 dark:border-indigo-500/30">
        <button
          onClick={() => toggleSection("roles")}
          className="w-full font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2.5 text-left"
          style={{ fontFamily: "Kanit, sans-serif" }}
        >
          <span className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
            <Tag size={15} />
          </span>
          ตำแหน่ง/ประเภทกีฬาที่มีในระบบ
          <span className="text-xs font-normal text-slate-500">({roleOptions.length})</span>
          <ChevronDown
            size={16}
            className={`ml-auto text-slate-500 transition-transform ${expandedSections.roles ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.roles && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {roleOptions.map((r) => (
                <span key={r} className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full pl-2.5 pr-1.5 py-1">
                  {r}
                  <button
                    onClick={() => removeRole(r)}
                    title="ลบตำแหน่งนี้"
                    className="rounded-full p-0.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                placeholder="พิมพ์ตำแหน่งใหม่ เช่น staff"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRole()}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={addRole} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700">
                <Plus size={14} /> เพิ่มตำแหน่งใหม่
              </button>
            </div>
            {roleError && <div className="mt-2 text-xs text-red-400">{roleError}</div>}
          </div>
        )}
      </Card>

      <Card className="p-5" border="border-sky-200 dark:border-sky-500/30">
        <button
          onClick={() => toggleSection("years")}
          className="w-full font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2.5 text-left"
          style={{ fontFamily: "Kanit, sans-serif" }}
        >
          <span className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <GraduationCap size={15} />
          </span>
          ชั้นปีที่มีในระบบ
          <span className="text-xs font-normal text-slate-500">({yearOptions.length})</span>
          <ChevronDown
            size={16}
            className={`ml-auto text-slate-500 transition-transform ${expandedSections.years ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.years && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {yearOptions.map((y) => (
                <span key={y} className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full pl-2.5 pr-1.5 py-1">
                  {y}
                  <button
                    onClick={() => removeYear(y)}
                    title="ลบชั้นปีนี้"
                    className="rounded-full p-0.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                placeholder="พิมพ์ชั้นปีใหม่ เช่น ปวช.1"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addYear()}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={addYear} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700">
                <Plus size={14} /> เพิ่มชั้นปีใหม่
              </button>
            </div>
            {yearError && <div className="mt-2 text-xs text-red-400">{yearError}</div>}
          </div>
        )}
      </Card>

      <Card className="p-5" border="border-fuchsia-200 dark:border-fuchsia-500/30">
        <button
          onClick={() => toggleSection("teams")}
          className="w-full font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2.5 text-left"
          style={{ fontFamily: "Kanit, sans-serif" }}
        >
          <span className="w-8 h-8 rounded-lg bg-fuchsia-500/15 text-fuchsia-400 flex items-center justify-center shrink-0">
            <Palette size={15} />
          </span>
          สีทีมที่มีในระบบ
          <span className="text-xs font-normal text-slate-500">({(teams || []).length})</span>
          <ChevronDown
            size={16}
            className={`ml-auto text-slate-500 transition-transform ${expandedSections.teams ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.teams && (
        <>
        <div className="flex flex-wrap gap-2 mt-3">
          {(teams || []).map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-1.5 rounded-full pl-1.5 pr-2.5 py-1"
              style={{ backgroundColor: `${(editingTeamId === t.id ? editTeamColor : t.accent)}26` }}
            >
              {editingTeamId === t.id ? (
                <>
                  <input
                    type="color"
                    value={editTeamColor}
                    onChange={(e) => {
                      setEditTeamColor(e.target.value);
                      setColorManuallyChanged(true);
                    }}
                    title="เลือกสีใหม่"
                    className="w-4 h-4 rounded-full shrink-0 border-0 bg-transparent p-0 cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
                  />
                  <input
                    autoFocus
                    value={editTeamName}
                    onChange={(e) => changeEditTeamName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveTeamName(t.id)}
                    className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-1.5 py-0.5 w-24"
                  />
                  <button onClick={() => saveTeamName(t.id)} className="text-emerald-400 hover:text-emerald-300">
                    <Check size={13} />
                  </button>
                  <button onClick={cancelEditTeam} className="text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                    <X size={13} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startEditTeam(t)}
                  className="text-xs font-semibold flex items-center gap-1.5"
                  style={{ color: t.accent }}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.accent }} />
                  {t.name} <Pencil size={11} className="opacity-50" />
                </button>
              )}
            </div>
          ))}
        </div>
        {teamError && <div className="mt-2 text-xs text-red-400">{teamError}</div>}
        <div className="text-xs text-slate-400 mt-2">
          กดชื่อสีเพื่อแก้ไข — พิมพ์ชื่อสีที่รู้จัก (เช่น สีส้ม สีฟ้า สีม่วง) จะเปลี่ยนโค้ดสีให้อัตโนมัติ หรือกดวงกลมสีเพื่อเลือกสีเองก็ได้ แล้วกด Enter หรือกดถูกเพื่อบันทึก
        </div>
        </>
        )}
      </Card>

      <Card className="p-5" border="border-emerald-200 dark:border-emerald-500/30">
        <button
          onClick={() => toggleSection("addForm")}
          className="w-full font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2.5 text-left"
          style={{ fontFamily: "Kanit, sans-serif" }}
        >
          <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <UserPlus size={15} />
          </span>
          เพิ่มนักศึกษา
          <ChevronDown
            size={16}
            className={`ml-auto text-slate-500 transition-transform ${expandedSections.addForm ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.addForm && (
          <div className="mt-3">
            <div className="grid sm:grid-cols-6 gap-2">
              <input placeholder="รหัสนักศึกษา" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-2 text-sm sm:col-span-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              <input placeholder="ชื่อ-นามสกุล" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-2 text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              <select value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select value={form.role || roleOptions[0]} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={form.year || yearOptions[0]} onChange={(e) => setForm({ ...form, year: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={add} className="mt-3 flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700">
              <Plus size={14}/> เพิ่มนักศึกษา
            </button>
          </div>
        )}
      </Card>

      <div className="text-xs text-slate-400 px-1">
        กดไอคอนโล่เพื่อมอบ/ยกเลิกสิทธิ์เช็คชื่อ — คนที่ได้รับสิทธิ์จะเช็คชื่อและปรับตำแหน่ง/กีฬาของนักศึกษาทุกคนในสีเดียวกันได้ (แต่ละคนเลือกได้แค่ 1 ตำแหน่งเท่านั้น)
        แต่ละสีรับนักกีฬาแต่ละชนิดได้ไม่เกิน 10 คน และหัวหน้าสีได้สีละ 1 คนเท่านั้น (กองเชียร์/เจ้าหน้าที่ทีมไม่จำกัด)
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาชื่อหรือรหัสนักศึกษา"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => selectYearGroup("all")}
          className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
            selectedYearGroup === "all"
              ? "bg-indigo-600 text-white"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
          }`}
        >
          ทั้งหมด ({students.length})
        </button>
        {yearGroups.map((g) => {
          const count = students.filter((s) => yearGroupOf(s.year) === g).length;
          return (
            <button
              key={g}
              onClick={() => selectYearGroup(selectedYearGroup === g ? "all" : g)}
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
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
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
            const count = students.filter((s) => s.year === room).length;
            return (
              <button
                key={room}
                onClick={() => setSelectedRoom((prev) => (prev === room ? null : room))}
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

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setSelectedRole("all")}
          className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
            selectedRole === "all"
              ? "bg-indigo-600 text-white"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
          }`}
        >
          ทุกตำแหน่ง
        </button>
        {roleOptions.map((r) => {
          const count = students.filter((s) => s.role === r).length;
          return (
            <button
              key={r}
              onClick={() => setSelectedRole((prev) => (prev === r ? "all" : r))}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                selectedRole === r
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
              }`}
            >
              {r} ({count})
            </button>
          );
        })}
      </div>

      {visibleStudents.length > 0 && <PaginationBar />}

      <Card className="p-0 overflow-hidden">
        {visibleStudents.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">ไม่พบนักศึกษาที่ค้นหา</div>
        )}
        {pageStudents.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/60 last:border-0 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
              {s.name.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-[140px]">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s.name}</div>
              <div className="text-xs text-slate-400">รหัส {s.id}</div>
            </div>
            <select value={s.year || yearOptions[0]} onChange={(e) => updateYear(s.id, e.target.value)} className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={s.team} onChange={(e) => updateTeam(s.id, e.target.value)} className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={s.role || roleOptions[0]} onChange={(e) => updateRole(s.id, e.target.value)} className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button
              onClick={() => setPendingToggle(s)}
              title={s.canCheckin ? "มีสิทธิ์เช็คชื่อ (กดเพื่อยกเลิก)" : "ไม่มีสิทธิ์เช็คชื่อ (กดเพื่อมอบสิทธิ์)"}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                s.canCheckin
                  ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {s.canCheckin ? <ShieldCheck size={14} /> : <Shield size={14} />}
              {s.canCheckin ? "มีสิทธิ์เช็คชื่อ" : "ไม่มีสิทธิ์"}
            </button>
            <button onClick={() => remove(s.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10">
              <Trash2 size={14}/>
            </button>
          </div>
        ))}
      </Card>

      {visibleStudents.length > 0 && <PaginationBar />}

      <ConfirmDialog
        open={!!pendingToggle}
        title={pendingToggle?.canCheckin ? "ยืนยันการยกเลิกสิทธิ์" : "ยืนยันการมอบสิทธิ์"}
        message={
          pendingToggle &&
          (pendingToggle.canCheckin
            ? `ต้องการยกเลิกสิทธิ์เช็คชื่อของ "${pendingToggle.name}" ใช่หรือไม่?`
            : `ต้องการมอบสิทธิ์เช็คชื่อให้ "${pendingToggle.name}" ใช่หรือไม่? (จะเช็คชื่อและปรับตำแหน่งเพื่อนในสีเดียวกันได้)`)
        }
        confirmLabel={pendingToggle?.canCheckin ? "ยกเลิกสิทธิ์" : "มอบสิทธิ์"}
        danger={!!pendingToggle?.canCheckin}
        onCancel={() => setPendingToggle(null)}
        onConfirm={() => {
          toggleCheckinPermission(pendingToggle.id, pendingToggle.canCheckin);
          setPendingToggle(null);
        }}
      />
    </div>
  );
}
