import React, { useState } from "react";
import { CheckCircle2, XCircle, Lock, Users, Trophy, MessageCircle, RotateCcw, QrCode } from "lucide-react";
import Card from "../common/Card";
import ConfirmDialog from "../common/ConfirmDialog";
import AbsentNoteDialog from "../common/AbsentNoteDialog";
import AttendanceThreadModal from "../common/AttendanceThreadModal";
import QRScannerModal from "../common/QRScannerModal";
import Toast from "../common/Toast";
import { api } from "../../api";
import { formatThaiDate, sortStudentsByYear, parseCheckinQRValue } from "../../utils/helpers";

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, "");
}

// ดึงชื่อกีฬาเฉพาะออกจากตำแหน่ง เช่น "นักกีฬาฟุตบอล" -> "ฟุตบอล"
// ถ้าตำแหน่งไม่ได้ขึ้นต้นด้วย "นักกีฬา" (เจ้าหน้าที่ทีม, กองเชียร์, staff ฯลฯ) -> null (ตำแหน่งทั่วไป ไม่ผูกกีฬาใดกีฬาหนึ่ง)
function extractSport(role) {
  if (!role) return null;
  const stripped = role.replace(/^นักกีฬา/, "").trim();
  if (stripped === role.trim()) return null;
  return stripped || null;
}

// หานัดแข่งขันที่ตรงกับตำแหน่งนี้ (ใช้เฉพาะตำแหน่งที่เป็นนักกีฬาเฉพาะทาง)
function matchForRole(role, matches) {
  const roleSport = extractSport(role);
  if (!roleSport) return null;
  const rs = normalize(roleSport);
  return matches.find((m) => {
    const ms = normalize(m.sport);
    return ms.includes(rs) || rs.includes(ms);
  });
}

// แท็บ "เช็คชื่อกิจกรรม" — ใช้ได้เฉพาะนักศึกษาที่ได้รับสิทธิ์ can_checkin (เจ้าหน้าที่ทีม) ให้เช็คชื่อ
// เพื่อนในทีมสีเดียวกันได้ แสดงเป็นปุ่มลัดตำแหน่ง กดตำแหน่งไหนโชว์รายชื่อของตำแหน่งนั้น (กดซ้ำ = ซ่อน)
// ถ้าตำแหน่งผูกกับกีฬาเฉพาะทาง (เช่น "นักกีฬาฟุตบอล") จะเช็คชื่อเข้าแมตช์วันนี้ของกีฬานั้นโดยเฉพาะ
// ถ้าเป็นตำแหน่งทั่วไป (กองเชียร์, เจ้าหน้าที่ทีม) จะเช็คชื่อแบบรายวันทั่วไป ไม่ผูกกับแมตช์ใด
export default function UserCheckin({ student, students, matches, checkins, setCheckins, roles }) {
  const [error, setError] = useState("");
  const [pendingCheckin, setPendingCheckin] = useState(null); // { studentId, matchId, name, sport }
  const [pendingAbsent, setPendingAbsent] = useState(null); // { studentId, name, matchId }
  const [pendingUndo, setPendingUndo] = useState(null); // { checkinId, name }
  const [threadFor, setThreadFor] = useState(null); // { studentId, date }
  const [toast, setToast] = useState(null); // { type: "success" | "error", message }
  const [selectedRole, setSelectedRole] = useState(null); // ตำแหน่งที่กำลังเปิดดูรายชื่ออยู่ (ปุ่มลัด)
  const [scannerOpen, setScannerOpen] = useState(false);

  if (!student.canCheckin) {
    return (
      <div className="px-4 md:px-8 pb-10">
        <Card className="p-8 text-center">
          <Lock size={28} className="mx-auto text-slate-600" />
          <div className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            คุณยังไม่ได้รับสิทธิ์เช็คชื่อ
          </div>
          <div className="mt-1 text-xs text-slate-400">
            กรุณาติดต่อผู้ดูแลระบบให้มอบสิทธิ์ก่อน จึงจะสามารถเช็คชื่อเพื่อนในสีเดียวกันได้
          </div>
        </Card>
      </div>
    );
  }

  const teammates = students.filter((s) => s.team === student.team);
  const roleList = roles && roles.length > 0 ? roles : [];

  const todayStr = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  // เช็คชื่อทั่วไป (ตำแหน่งที่ไม่ผูกกีฬา) = checkin ที่ matchId เป็นค่าว่าง "ของวันนี้" โดยเฉพาะ
  const todayGeneralCheckin = (studentId) =>
    checkins.find((c) => c.studentId === studentId && c.matchId == null && c.date === todayStr);

  // สถานะเช็คชื่อ/เช็คขาด ของนัดแข่งขันหนึ่งๆ (ใช้กับตำแหน่งนักกีฬาเฉพาะทาง) — นับเฉพาะของ "วันนี้" เพื่อให้ปุ่มรีเซ็ตทุกวันใหม่
  const matchRecord = (studentId, matchId) =>
    checkins.find((c) => c.studentId === studentId && c.matchId === matchId && c.date === todayStr);

  const doCheckin = async (studentId, matchId, name, status = "present") => {
    try {
      const created = await api.createCheckin({
        studentId,
        matchId: matchId ?? null,
        status,
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      });
      setCheckins([...checkins, created]);
      setError("");
      setToast({ type: "success", message: `เช็คชื่อ "${name}" สำเร็จแล้ว` });
    } catch (err) {
      setError(err.message);
      setToast({ type: "error", message: "เช็คชื่อไม่สำเร็จ: " + err.message });
    }
  };

  // ยกเลิกรายการที่เช็คผิด (เช็คชื่อ/เช็คขาดผิดคน) — ลบทิ้ง แล้วคนนั้นกลับไปสถานะ "ยังไม่เช็ค" ให้เช็คใหม่ได้ทันที
  const doUndo = async (checkinId, name) => {
    try {
      await api.deleteCheckin(checkinId);
      setCheckins(checkins.filter((c) => c.id !== checkinId));
      setToast({ type: "success", message: `ยกเลิกรายการเช็คชื่อของ "${name}" แล้ว` });
    } catch (err) {
      setToast({ type: "error", message: "ยกเลิกไม่สำเร็จ: " + err.message });
    }
  };

  // ประมวลผลข้อความที่ได้จากการสแกน QR — หาตัวนักศึกษาเจ้าของ QR ในสีเดียวกัน คำนวณ matchId ให้เองถ้าเป็น
  // ตำแหน่งนักกีฬาเฉพาะทาง (ไม่ต้องให้ผู้สแกนเลือกแท็บตำแหน่งก่อนสแกน) แล้วเปิดกล่องยืนยันเดียวกับตอนกดเช็คชื่อด้วยมือ
  const handleScan = (text) => {
    setScannerOpen(false);
    const scannedId = parseCheckinQRValue(text);
    if (!scannedId) {
      setToast({ type: "error", message: "QR นี้ไม่ใช่ QR เช็คชื่อของระบบนี้" });
      return;
    }
    const target = teammates.find((t) => t.id === scannedId);
    if (!target) {
      setToast({ type: "error", message: "ไม่พบนักศึกษาคนนี้ในสีเดียวกับคุณ" });
      return;
    }
    const sport = extractSport(target.role);
    const match = sport ? matchForRole(target.role, matches) : null;
    if (sport && !match) {
      setToast({ type: "error", message: `ยังไม่มีนัดแข่งขันสำหรับตำแหน่งของ "${target.name}"` });
      return;
    }
    const existing = match ? matchRecord(target.id, match.id) : todayGeneralCheckin(target.id);
    if (existing) {
      setToast({
        type: "error",
        message: `"${target.name}" ${existing.status === "absent" ? "เช็คขาดไปแล้ว" : "เช็คชื่อไปแล้ว"} วันนี้`,
      });
      return;
    }
    setPendingCheckin({ studentId: target.id, matchId: match?.id ?? null, name: target.name, sport: match?.sport });
  };

  const doAbsent = async (studentId, name, message, matchId = null) => {
    try {
      const created = await api.createCheckin({ studentId, matchId: matchId ?? null, status: "absent" });
      setCheckins([...checkins, created]);
      await api.sendAttendanceMessage({ studentId, date: todayStr, message });
      setError("");
      setToast({ type: "success", message: `บันทึกเช็คขาดและส่งข้อความถึง "${name}" สำเร็จแล้ว` });
      // เปิดหน้าต่างข้อความให้เห็นเลยว่าข้อความที่พิมพ์ไปถูกส่งจริง และรอดูคำตอบกลับได้
      setThreadFor({ studentId, date: todayStr });
    } catch (err) {
      setError(err.message);
      setToast({ type: "error", message: "บันทึกเช็คขาดไม่สำเร็จ: " + err.message });
    }
  };

  // ตำแหน่งที่กำลังดูอยู่ (ปุ่มลัด) — กดปุ่มเดิมซ้ำเพื่อซ่อนข้อมูล (toggle)
  const activeRole = selectedRole && roleList.includes(selectedRole) ? selectedRole : null;
  const activeRoleSport = activeRole ? extractSport(activeRole) : null;
  const activeMatch = activeRole ? matchForRole(activeRole, matches) : null;
  // เรียงรายชื่อจากชั้นปีต่ำไปสูง (ปวช.1 -> ปวส.2) ตามที่ขอ
  const activeMembers = activeRole ? sortStudentsByYear(teammates.filter((t) => (t.role || "") === activeRole)) : [];

  return (
    <div className="px-4 md:px-8 pb-10 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Users size={13} /> คุณมีสิทธิ์เช็คชื่อนักศึกษาในสีเดียวกันทั้งหมด {teammates.length} คน
          แบ่งตามตำแหน่ง/ประเภทกีฬา (ตำแหน่งใหม่ที่แอดมินเพิ่มจะขึ้นที่นี่ให้อัตโนมัติ)
        </div>
        <button
          onClick={() => setScannerOpen(true)}
          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700"
        >
          <QrCode size={14} /> สแกน QR เพื่อเช็คชื่อ
        </button>
      </div>
      {error && <div className="text-xs text-red-400">{error}</div>}

      {roleList.length === 0 && (
        <div className="text-xs text-slate-400">ยังไม่มีตำแหน่งในระบบ</div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {roleList.map((role) => {
          const count = teammates.filter((t) => (t.role || "") === role).length;
          const sport = extractSport(role);
          const isActive = activeRole === role;
          return (
            <button
              key={role}
              onClick={() => setSelectedRole((prev) => (prev === role ? null : role))}
              className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
              }`}
            >
              {sport ? (
                <Trophy size={13} className={isActive ? "text-white" : "text-indigo-400"} />
              ) : (
                <Users size={13} className={isActive ? "text-white" : "text-indigo-400"} />
              )}
              {sport || role} ({count})
            </button>
          );
        })}
      </div>

      {activeRole && (
        <Card className="p-0 overflow-hidden">
          {activeMembers.length === 0 && (
            <div className="px-5 py-8 text-center text-xs text-slate-400">ยังไม่มีนักศึกษาในตำแหน่งนี้</div>
          )}

          {/* ตำแหน่งนักกีฬาเฉพาะทาง แต่ยังไม่มีนัดแข่งขันของกีฬานั้น */}
          {activeMembers.length > 0 && activeRoleSport && !activeMatch && (
            <div className="px-5 py-8 text-center text-xs text-slate-400">ยังไม่มีนัดแข่งขันสำหรับตำแหน่งนี้</div>
          )}

          {activeMembers.length > 0 && activeMembers.map((t) => {
            // ตำแหน่งนักกีฬาเฉพาะทาง: เช็คชื่อ / เช็คขาด เข้านัดของกีฬานั้น
            if (activeRoleSport) {
              if (!activeMatch) return null;
              const record = matchRecord(t.id, activeMatch.id);
              const isPresent = record ? (record.status || "present") === "present" : false;
              const isAbsent = record?.status === "absent";
              const hasRecord = !!record;
              return (
                <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-200 dark:border-slate-800/60 last:border-0 flex-wrap">
                  <div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.name}</div>
                    <div className="text-xs text-slate-400">รหัส {t.id} · {t.year || "ไม่ระบุชั้นปี"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setPendingCheckin({ studentId: t.id, matchId: activeMatch.id, name: t.name, sport: activeMatch.sport })
                      }
                      disabled={isPresent || isAbsent}
                      title={`${formatThaiDate(activeMatch.date)} · ${activeMatch.time} · ${activeMatch.venue}`}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        isPresent
                          ? "bg-emerald-500/15 text-emerald-400 cursor-default"
                          : isAbsent
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      <CheckCircle2 size={14} /> {isPresent ? "เช็คชื่อแล้ว" : "เช็คชื่อ"}
                    </button>
                    <button
                      onClick={() => setPendingAbsent({ studentId: t.id, name: t.name, matchId: activeMatch.id })}
                      disabled={isPresent || isAbsent}
                      title={`${formatThaiDate(activeMatch.date)} · ${activeMatch.time} · ${activeMatch.venue}`}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        isAbsent
                          ? "bg-red-500/15 text-red-400 cursor-default"
                          : isPresent
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 text-red-400 border border-red-900/50 hover:bg-red-500/10"
                      }`}
                    >
                      <XCircle size={14} /> {isAbsent ? "เช็คขาดแล้ว" : "เช็คขาด"}
                    </button>
                    {hasRecord && (
                      <button
                        onClick={() => setThreadFor({ studentId: t.id, date: todayStr })}
                        title="ดูข้อความของวันนี้"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <MessageCircle size={14} /> ดูข้อความ
                      </button>
                    )}
                    {hasRecord && (
                      <button
                        onClick={() => setPendingUndo({ checkinId: record.id, name: t.name })}
                        title="ยกเลิกรายการนี้ (กรณีเช็คผิด) — เช็คใหม่ได้ทันทีหลังยกเลิก"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-amber-500 border border-amber-300 dark:border-amber-500/40 hover:bg-amber-500/10"
                      >
                        <RotateCcw size={14} /> ยกเลิก
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            // ตำแหน่งทั่วไป (ไม่ผูกกีฬา): เช็คชื่อ / เช็คขาด ของวันนี้
            const todayRecord = todayGeneralCheckin(t.id);
            const isPresent = todayRecord?.status === "present";
            const isAbsent = todayRecord?.status === "absent";
            const hasRecordToday = isPresent || isAbsent;
            return (
              <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-200 dark:border-slate-800/60 last:border-0 flex-wrap">
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.name}</div>
                  <div className="text-xs text-slate-400">รหัส {t.id} · {t.year || "ไม่ระบุชั้นปี"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPendingCheckin({ studentId: t.id, matchId: null, name: t.name })}
                    disabled={isPresent || isAbsent}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                      isPresent
                        ? "bg-emerald-500/15 text-emerald-400 cursor-default"
                        : isAbsent
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    <CheckCircle2 size={14} /> {isPresent ? "เช็คชื่อแล้ว" : "เช็คชื่อ"}
                  </button>
                  <button
                    onClick={() => setPendingAbsent({ studentId: t.id, name: t.name, matchId: null })}
                    disabled={isPresent || isAbsent}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                      isAbsent
                        ? "bg-red-500/15 text-red-400 cursor-default"
                        : isPresent
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-white dark:bg-slate-900 text-red-400 border border-red-900/50 hover:bg-red-500/10"
                    }`}
                  >
                    <XCircle size={14} /> {isAbsent ? "เช็คขาดแล้ว" : "เช็คขาด"}
                  </button>
                  {hasRecordToday && (
                    <button
                      onClick={() => setThreadFor({ studentId: t.id, date: todayStr })}
                      title="ดูข้อความของวันนี้"
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <MessageCircle size={14} /> ดูข้อความ
                    </button>
                  )}
                  {hasRecordToday && (
                    <button
                      onClick={() => setPendingUndo({ checkinId: todayRecord.id, name: t.name })}
                      title="ยกเลิกรายการนี้ (กรณีเช็คผิด) — เช็คใหม่ได้ทันทีหลังยกเลิก"
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-amber-500 border border-amber-300 dark:border-amber-500/40 hover:bg-amber-500/10"
                    >
                      <RotateCcw size={14} /> ยกเลิก
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <ConfirmDialog
        open={!!pendingCheckin}
        title="ยืนยันการเช็คชื่อ"
        message={
          pendingCheckin &&
          `เช็คชื่อให้ "${pendingCheckin.name}"${pendingCheckin.sport ? ` เข้าร่วม ${pendingCheckin.sport}` : ""} ใช่หรือไม่?`
        }
        confirmLabel="ยืนยันเช็คชื่อ"
        onCancel={() => setPendingCheckin(null)}
        onConfirm={() => {
          doCheckin(pendingCheckin.studentId, pendingCheckin.matchId, pendingCheckin.name);
          setPendingCheckin(null);
        }}
      />

      <ConfirmDialog
        open={!!pendingUndo}
        title="ยกเลิกการเช็คชื่อ"
        message={
          pendingUndo &&
          `ยกเลิกรายการเช็คชื่อ/เช็คขาดของ "${pendingUndo.name}" ใช่หรือไม่? หลังยกเลิกจะเช็คใหม่ให้ถูกต้องได้ทันที`
        }
        confirmLabel="ยืนยันยกเลิก"
        danger
        onCancel={() => setPendingUndo(null)}
        onConfirm={() => {
          doUndo(pendingUndo.checkinId, pendingUndo.name);
          setPendingUndo(null);
        }}
      />

      <AbsentNoteDialog
        open={!!pendingAbsent}
        studentName={pendingAbsent?.name}
        onCancel={() => setPendingAbsent(null)}
        onConfirm={(message) => {
          doAbsent(pendingAbsent.studentId, pendingAbsent.name, message, pendingAbsent.matchId);
          setPendingAbsent(null);
        }}
      />

      <AttendanceThreadModal
        open={!!threadFor}
        studentId={threadFor?.studentId}
        date={threadFor?.date}
        viewerName={student.name}
        onClose={() => setThreadFor(null)}
      />

      <QRScannerModal open={scannerOpen} onScan={handleScan} onClose={() => setScannerOpen(false)} />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
