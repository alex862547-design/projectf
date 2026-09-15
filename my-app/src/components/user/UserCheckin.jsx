import React, { useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, Lock, Users, Trophy, MessageCircle, RotateCcw, QrCode, Search, CalendarDays, ChevronDown, Inbox } from "lucide-react";
import Card from "../common/Card";
import ConfirmDialog from "../common/ConfirmDialog";
import AbsentNoteDialog from "../common/AbsentNoteDialog";
import AttendanceThreadModal from "../common/AttendanceThreadModal";
import QRScannerModal from "../common/QRScannerModal";
import MessageInboxModal from "../common/MessageInboxModal";
import Toast from "../common/Toast";
import { api } from "../../api";
import { formatThaiDate, formatThaiFullDate, formatShortTime, sortStudentsByYear, parseCheckinQRValue } from "../../utils/helpers";

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

// หานัดแข่งขันที่ตรงกับตำแหน่งนี้ (ใช้เฉพาะตำแหน่งที่เป็นนักกีฬาเฉพาะทาง) — จับคู่แค่ชื่อกีฬา ไม่กรองด้วยวันที่ของนัด
// เพราะ "วันที่" ของ checkin (ที่เลือกเช็คชื่อย้อนหลังได้) เป็นแค่วันที่บันทึกว่าเช็คชื่อวันไหน ไม่ใช่ว่าต้องตรงกับ
// วันที่ตั้งไว้ของนัดแข่งขันเป๊ะๆ (นัดแข่งหนึ่งอาจถูกเลื่อน/เช็คชื่อล่วงหน้า-ย้อนหลังได้อยู่แล้วในทางปฏิบัติ)
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
// เพื่อนในทีมสีเดียวกันได้ ขอบเขตแบ่งเป็น 2 ระดับ: "หัวหน้าสี" เช็คชื่อได้ทุกตำแหน่งในสีตัวเอง (มีปุ่มลัดสลับ
// ตำแหน่งได้เหมือนเดิม) ส่วนตำแหน่งอื่นๆ ที่มี can_checkin เช็คได้แค่ "คนตำแหน่งเดียวกับตัวเอง" เท่านั้น (เช่น
// นักกีฬาฟุตบอลเช็คได้แค่นักกีฬาฟุตบอลคนอื่น) จึงไม่ต้องมีปุ่มลัดให้เลือก เพราะมีกลุ่มเดียวให้ดูอยู่แล้ว
// ถ้าตำแหน่งผูกกับกีฬาเฉพาะทาง (เช่น "นักกีฬาฟุตบอล") จะเช็คชื่อเข้าแมตช์ของกีฬานั้นโดยเฉพาะ
// ถ้าเป็นตำแหน่งทั่วไป (กองเชียร์, เจ้าหน้าที่ทีม) จะเช็คชื่อแบบรายวันทั่วไป ไม่ผูกกับแมตช์ใด
// เช็คชื่อได้ 2 ทาง: กดปุ่ม "เช็คชื่อ/เช็คขาด" เลือกจากลิสต์ตรงๆ หรือกด "สแกน QR เพื่อเช็คชื่อ" เปิดกล้อง
// สแกน QR ประจำตัวของเพื่อน (ดู QRScannerModal.jsx) ซึ่งจะหาคน+คำนวณแมตช์ให้เองแล้วเปิดกล่องยืนยันเดียวกัน
// ถ้าเช็คผิดคน/ผิดสถานะ กดปุ่ม "ยกเลิก" ที่โผล่มาหลังเช็คแล้วได้ เพื่อลบทิ้งแล้วเช็คใหม่ให้ถูกต้อง
// เลือก "วันที่" ที่จะเช็คชื่อให้ได้ (ค่าเริ่มต้น = วันนี้) เพื่อเช็คชื่อย้อนหลังกรณีลืมเช็คในวันจริง — เลือกได้แค่
// วันนี้หรือวันที่ผ่านมาแล้วเท่านั้น (ห้ามล่วงหน้า) ปุ่มจะรีเซ็ตตามวันที่เลือกไว้ ไม่ใช่ตามวันจริงเสมอไป
// มีปุ่ม "กล่องข้อความ" ไว้ดูข้อความที่นักศึกษาตอบกลับมาได้แบบรวมทุกคน/ทุกวัน ไม่ต้องไล่เปิดทีละคน
export default function UserCheckin({ student, students, matches, checkins, setCheckins, roles, checkerUnreadCount = 0 }) {
  // หัวหน้าสีเท่านั้นที่เช็คชื่อได้ทุกตำแหน่งในสีตัวเอง — server (assertCanActOnStudent) บังคับเงื่อนไขเดียวกันนี้
  // อยู่แล้ว ทำที่ frontend ด้วยเพื่อไม่ให้เห็น UI ของสิทธิ์ที่ทำจริงไม่ได้ (กดแล้วจะโดน 403 จาก server)
  const isTeamLead = student.role === "หัวหน้าสี";
  const [error, setError] = useState("");
  const [pendingCheckin, setPendingCheckin] = useState(null); // { studentId, matchId, name, sport }
  const [pendingAbsent, setPendingAbsent] = useState(null); // { studentId, name, matchId }
  const [pendingUndo, setPendingUndo] = useState(null); // { checkinId, name }
  const [threadFor, setThreadFor] = useState(null); // { studentId, date }
  const [toast, setToast] = useState(null); // { type: "success" | "error", message }
  const [selectedRole, setSelectedRole] = useState(null); // ตำแหน่งที่กำลังเปิดดูรายชื่ออยู่ (ปุ่มลัด)
  const [scannerOpen, setScannerOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dateInputRef = useRef(null); // ใช้เปิดปฏิทินเนทีฟผ่าน showPicker() ตอนกดที่การ์ดเลือกวันที่
  // วันที่กำลังเช็คชื่อให้อยู่ — ค่าเริ่มต้นเป็นวันนี้ตามเวลาเครื่อง เปลี่ยนได้เพื่อเช็คชื่อย้อนหลัง
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  // หาว่าใครเป็นคนเช็คชื่อ/เช็คขาดให้ในวันที่เปิดหน้าต่างข้อความอยู่ (โชว์ในหัวหน้าต่าง AttendanceThreadModal)
  // อยู่ก่อน early return ด้านล่างเสมอ เพื่อให้ลำดับ hook คงที่ทุกครั้งที่ render (ตามกฎของ React hooks)
  const threadCheckedBy = useMemo(() => {
    if (!threadFor) return null;
    const rec = checkins.find((c) => c.studentId === threadFor.studentId && c.date === threadFor.date && c.checkedBy);
    return rec ? rec.checkedBy : null;
  }, [checkins, threadFor]);

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

  // หัวหน้าสีเห็น/เช็คได้ทุกตำแหน่งในสีตัวเอง คนอื่นเห็น/เช็คได้แค่คนตำแหน่งเดียวกับตัวเองเท่านั้น
  const teammates = students.filter((s) => s.team === student.team && (isTeamLead || s.role === student.role));
  const roleList = roles && roles.length > 0 ? roles : [];

  const todayStr = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();
  const isRetroactive = selectedDate !== todayStr;
  // ใช้ต่อท้ายชื่อวัน/ข้อความแจ้งเตือนต่างๆ ให้ชัดว่ากำลังทำรายการของวันไหน (เฉพาะตอนไม่ใช่วันนี้ จะไม่พูดซ้ำว่า "วันนี้")
  const dateLabel = isRetroactive ? `วันที่ ${formatThaiDate(selectedDate)}` : "วันนี้";

  // เช็คชื่อทั่วไป (ตำแหน่งที่ไม่ผูกกีฬา) = checkin ที่ matchId เป็นค่าว่าง "ของวันที่เลือกไว้" โดยเฉพาะ
  const dateGeneralCheckin = (studentId) =>
    checkins.find((c) => c.studentId === studentId && c.matchId == null && c.date === selectedDate);

  // สถานะเช็คชื่อ/เช็คขาด ของนัดแข่งขันหนึ่งๆ (ใช้กับตำแหน่งนักกีฬาเฉพาะทาง) — นับเฉพาะของ "วันที่เลือกไว้"
  // เพื่อให้ปุ่มรีเซ็ตใหม่เมื่อสลับไปเช็คชื่อวันอื่น (ไม่ใช่รีเซ็ตตามวันจริงเสมอไป เผื่อเช็คย้อนหลัง)
  const matchRecord = (studentId, matchId) =>
    checkins.find((c) => c.studentId === studentId && c.matchId === matchId && c.date === selectedDate);

  const doCheckin = async (studentId, matchId, name, status = "present") => {
    try {
      const created = await api.createCheckin({
        studentId,
        matchId: matchId ?? null,
        status,
        date: selectedDate,
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      });
      setCheckins([...checkins, created]);
      setError("");
      setToast({ type: "success", message: `เช็คชื่อ "${name}" สำเร็จแล้ว${isRetroactive ? ` (${dateLabel})` : ""}` });
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
  // เช็คสถานะเดิมเทียบกับ "วันที่เลือกไว้" ด้วย เผื่อกำลังสแกนเพื่อเช็คชื่อย้อนหลัง ไม่ใช่วันนี้เสมอไป
  const handleScan = (text) => {
    setScannerOpen(false);
    const scannedId = parseCheckinQRValue(text);
    if (!scannedId) {
      setToast({ type: "error", message: "QR นี้ไม่ใช่ QR เช็คชื่อของระบบนี้" });
      return;
    }
    const target = teammates.find((t) => t.id === scannedId);
    if (!target) {
      setToast({
        type: "error",
        message: isTeamLead ? "ไม่พบนักศึกษาคนนี้ในสีเดียวกับคุณ" : "ไม่พบนักศึกษาคนนี้ในสีหรือตำแหน่งเดียวกับคุณ",
      });
      return;
    }
    const sport = extractSport(target.role);
    const match = sport ? matchForRole(target.role, matches) : null;
    if (sport && !match) {
      setToast({ type: "error", message: `ยังไม่มีนัดแข่งขันสำหรับตำแหน่งของ "${target.name}"` });
      return;
    }
    const existing = match ? matchRecord(target.id, match.id) : dateGeneralCheckin(target.id);
    if (existing) {
      setToast({
        type: "error",
        message: `"${target.name}" ${existing.status === "absent" ? "เช็คขาดไปแล้ว" : "เช็คชื่อไปแล้ว"}${isRetroactive ? ` ${dateLabel}` : "วันนี้"}`,
      });
      return;
    }
    setPendingCheckin({ studentId: target.id, matchId: match?.id ?? null, name: target.name, sport: match?.sport });
  };

  const doAbsent = async (studentId, name, message, matchId = null) => {
    try {
      const created = await api.createCheckin({ studentId, matchId: matchId ?? null, status: "absent", date: selectedDate });
      setCheckins([...checkins, created]);
      await api.sendAttendanceMessage({ studentId, date: selectedDate, message });
      setError("");
      setToast({ type: "success", message: `บันทึกเช็คขาดและส่งข้อความถึง "${name}" สำเร็จแล้ว${isRetroactive ? ` (${dateLabel})` : ""}` });
      // เปิดหน้าต่างข้อความให้เห็นเลยว่าข้อความที่พิมพ์ไปถูกส่งจริง และรอดูคำตอบกลับได้
      setThreadFor({ studentId, date: selectedDate });
    } catch (err) {
      setError(err.message);
      setToast({ type: "error", message: "บันทึกเช็คขาดไม่สำเร็จ: " + err.message });
    }
  };

  // ตำแหน่งที่กำลังดูอยู่ — หัวหน้าสีเลือกได้จากปุ่มลัด (กดปุ่มเดิมซ้ำเพื่อซ่อนข้อมูล) ส่วนตำแหน่งอื่นๆ
  // ตายตัวเป็นตำแหน่งของตัวเองเสมอ ไม่มีปุ่มลัดให้เลือก เพราะเช็คได้แค่กลุ่มเดียวอยู่แล้ว
  const activeRole = isTeamLead ? (selectedRole && roleList.includes(selectedRole) ? selectedRole : null) : student.role;
  const activeRoleSport = activeRole ? extractSport(activeRole) : null;
  const activeMatch = activeRole ? matchForRole(activeRole, matches) : null;

  // พิมพ์ค้นหาแล้วต้องเห็นผลทันทีโดยไม่ต้องกดปุ่มลัดตำแหน่งก่อน — ตอนกำลังค้นหาจะมองข้ามตำแหน่งที่เลือกไว้
  // แล้วค้นทั่วทั้งสีเดียวกันแทน (เรียงชั้นปีเหมือนเดิม) ส่วนตอนไม่ได้ค้นหาก็ยังคงต้องกดปุ่มลัดเหมือนเดิม
  const searchQ = searchQuery.trim().toLowerCase();
  const isSearching = searchQ.length > 0;
  const matchesSearch = (t) => t.name.toLowerCase().includes(searchQ) || t.id.toLowerCase().includes(searchQ);
  const activeMembers = isSearching
    ? sortStudentsByYear(teammates.filter(matchesSearch))
    : activeRole
    ? sortStudentsByYear(teammates.filter((t) => (t.role || "") === activeRole))
    : [];

  // สรุปว่า "กำลังเช็คชื่อกิจกรรมไหนอยู่" ให้เห็นชัดๆ แยกจากประโยคบอกสิทธิ์ด้านล่าง (คนละเรื่องกัน) — ตอนค้นหา
  // จะข้ามการเลือกตำแหน่งไปเลย เลยไม่มีกิจกรรมเดียวให้บอกตรงๆ ใช้ข้อความสรุปรวมแทน
  let ActivityIcon = Trophy;
  let activityTone = "indigo";
  let activityTitle = "";
  let activitySubtitle = "";
  if (isSearching) {
    ActivityIcon = Search;
    activityTitle = "กำลังค้นหาทั่วทั้งสี";
    activitySubtitle = `ข้ามการเลือกตำแหน่ง ค้นหาได้ครบทุกคนที่มีสิทธิ์เช็คชื่อ ${teammates.length} คน`;
  } else if (!activeRole) {
    activityTone = "slate";
    activityTitle = "ยังไม่ได้เลือกกิจกรรม";
    activitySubtitle = "เลือกตำแหน่ง/กีฬาด้านล่างเพื่อเริ่มเช็คชื่อ";
  } else if (activeRoleSport) {
    activityTitle = activeRoleSport;
    // ไม่ต้องซ้ำวันที่/เวลา/สนามที่นี่ — วันที่ก็โชว์อยู่แล้วในการ์ดเลือกวันที่ด้านบน ส่วนเวลา/สนามดูได้จาก
    // tooltip ตอนชี้ปุ่มเช็คชื่อของนักศึกษาแต่ละคน (แต่ยังต้องบอกไว้ถ้ากีฬานี้ยังไม่มีนัดแข่งขันเลย)
    if (!activeMatch) {
      activityTone = "amber";
      activitySubtitle = "ยังไม่มีนัดแข่งขันสำหรับกีฬานี้ในระบบ";
    }
  } else {
    ActivityIcon = Users;
    activityTitle = activeRole;
    activitySubtitle = "เช็คชื่อทั่วไป ไม่ผูกกับนัดแข่งขัน เช็คได้ตลอดทั้งวัน";
  }
  const activityToneClasses = {
    indigo: "bg-indigo-500/15 text-indigo-500 dark:text-indigo-400",
    amber: "bg-amber-500/15 text-amber-500",
    slate: "bg-slate-500/15 text-slate-400",
  }[activityTone];

  // เปิดปฏิทินเลือกวันของ input[type=date] ที่ซ่อนไว้ ให้กดได้จากทั้งการ์ด ไม่ใช่แค่ไอคอนปฏิทินของเบราว์เซอร์
  // (showPicker ใช้ได้กับ Chrome/Edge/Android ส่วนเบราว์เซอร์ที่ไม่รองรับ เช่น Safari เก่า จะ fallback ไป focus แทน)
  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        // เบราว์เซอร์บล็อก showPicker (เช่นไม่ได้มาจาก user gesture โดยตรง) ให้ fallback ไป focus แทน
      }
    }
    el.focus();
  };

  return (
    <div className="px-4 md:px-8 pb-10 space-y-5">
      {/* เลือกวันที่จะเช็คชื่อให้ได้ (ค่าเริ่มต้น = วันนี้) เพื่อเช็คชื่อย้อนหลังได้กรณีลืมเช็คในวันจริง
          เลือกได้แค่วันนี้/วันที่ผ่านมาแล้ว (max = วันนี้) กันเผลอเช็คชื่อล่วงหน้า
          ตัวการ์ดทั้งใบกดเปิดปฏิทินได้เลย ไม่ต้องเล็งกดแค่ไอคอนปฏิทิน ส่วน input[type=date] จริงถูกซ่อนไว้
          (opacity 0 แต่ยังอยู่ใน DOM) เพื่อให้ยังใช้ปฏิทินเนทีฟของเบราว์เซอร์/มือถือได้ตามปกติ */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div
          onClick={openDatePicker}
          className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isRetroactive
                ? "bg-amber-500/15 text-amber-500"
                : "bg-indigo-500/15 text-indigo-500 dark:text-indigo-400"
            }`}
          >
            <CalendarDays size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-400">เช็คชื่อสำหรับวันที่</div>
            <div className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {formatThaiFullDate(new Date(selectedDate + "T00:00:00"))}
            </div>
          </div>
          {isRetroactive && (
            <span className="shrink-0 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full px-2.5 py-1">
              ย้อนหลัง
            </span>
          )}
          <ChevronDown size={16} className="text-slate-400 shrink-0" />
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={(e) => setSelectedDate(e.target.value || todayStr)}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          />
        </div>
        {isRetroactive && (
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-amber-500/20 bg-amber-500/5">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              กำลังเช็คชื่อย้อนหลัง ข้อมูลจะถูกบันทึกลงวันที่นี้แทนวันนี้
            </span>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-400 dark:hover:text-indigo-300"
            >
              <RotateCcw size={11} /> กลับไปวันนี้
            </button>
          </div>
        )}
      </div>

      {/* บอกชัดๆ ว่ากำลังเช็คชื่อกิจกรรม/กีฬาไหนอยู่ (ตัวใหญ่ อ่านง่าย) แยกจากประโยคบอกสิทธิ์ด้านล่างซึ่งเป็นคนละเรื่อง
          (สิทธิ์ = เช็คได้กับใครบ้าง, การ์ดนี้ = ตอนนี้กำลังเช็คกิจกรรมอะไรอยู่) อัพเดทอัตโนมัติตามตำแหน่ง/การค้นหาที่เลือก */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${activityToneClasses}`}>
            <ActivityIcon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-400">กำลังเช็คชื่อกิจกรรม</div>
            <div className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {activityTitle}
            </div>
            {activitySubtitle && <div className="text-xs text-slate-400 mt-0.5 truncate">{activitySubtitle}</div>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Users size={13} />
          {isTeamLead ? (
            <>คุณเป็นหัวหน้าสี มีสิทธิ์เช็คชื่อนักศึกษาในสีเดียวกันทั้งหมด {teammates.length} คน แบ่งตามตำแหน่ง/ประเภทกีฬา (ตำแหน่งใหม่ที่แอดมินเพิ่มจะขึ้นที่นี่ให้อัตโนมัติ)</>
          ) : (
            <>คุณมีสิทธิ์เช็คชื่อเฉพาะนักศึกษาตำแหน่ง "{student.role || "ไม่ระบุตำแหน่ง"}" ในสีเดียวกัน ทั้งหมด {teammates.length} คน</>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setInboxOpen(true)}
            className="relative flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Inbox size={14} /> กล่องข้อความ
            {checkerUnreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {checkerUnreadCount > 99 ? "99+" : checkerUnreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setScannerOpen(true)}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700"
          >
            <QrCode size={14} /> สแกน QR เพื่อเช็คชื่อ
          </button>
        </div>
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

      {/* ปุ่มลัดสลับตำแหน่งมีไว้ให้หัวหน้าสีเท่านั้น (คนอื่นเช็คได้แค่ตำแหน่งเดียวกับตัวเอง ไม่มีตำแหน่งให้สลับ) */}
      {isTeamLead && (
        <>
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
        </>
      )}

      {(activeRole || isSearching) && (
        <Card className="p-0 overflow-hidden">
          {activeMembers.length === 0 && (
            <div className="px-5 py-8 text-center text-xs text-slate-400">
              {isSearching ? "ไม่พบนักศึกษาที่ตรงกับคำค้นหา" : "ยังไม่มีนักศึกษาในตำแหน่งนี้"}
            </div>
          )}

          {/* ตำแหน่งนักกีฬาเฉพาะทาง แต่ยังไม่มีนัดแข่งขันของกีฬานั้น (เฉพาะโหมดกดปุ่มลัด — ตอนค้นหาแต่ละแถวอาจ
              เป็นคนละตำแหน่งกัน จึงแยกไปเช็คเป็นรายแถวข้างล่างแทน ไม่ใช้ข้อความรวมแบบนี้บล็อกทั้งลิสต์) */}
          {!isSearching && activeMembers.length > 0 && activeRoleSport && !activeMatch && (
            <div className="px-5 py-8 text-center text-xs text-slate-400">ยังไม่มีนัดแข่งขันสำหรับตำแหน่งนี้</div>
          )}

          {activeMembers.length > 0 &&
            !(!isSearching && activeRoleSport && !activeMatch) &&
            activeMembers.map((t) => {
              // คำนวณกีฬา/นัดแข่งขันจากตำแหน่งของ "แถวนี้เอง" เสมอ (ไม่ใช่ของแท็บที่เลือกไว้) เพราะตอนค้นหา
              // แต่ละแถวอาจมีตำแหน่งต่างกัน — ตอนกดปุ่มลัดตามปกติ ทุกแถวก็มีตำแหน่งเดียวกับแท็บอยู่แล้วผลจะเหมือนเดิม
              const sport = extractSport(t.role);
              const match = sport ? matchForRole(t.role, matches) : null;

              // มีตำแหน่งผูกกีฬา แต่กีฬานั้นยังไม่มีนัดแข่งขันเลย — เกิดได้เฉพาะตอนค้นหา (โหมดปุ่มลัดถูกกันไว้แล้วด้านบน)
              if (sport && !match) {
                return (
                  <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-200 dark:border-slate-800/60 last:border-0 flex-wrap">
                    <div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.name}</div>
                      <div className="text-xs text-slate-400">รหัส {t.id} · {t.year || "ไม่ระบุชั้นปี"} · {t.role}</div>
                    </div>
                    <div className="text-xs text-slate-400 shrink-0">ยังไม่มีนัดแข่งขันสำหรับตำแหน่งนี้</div>
                  </div>
                );
              }

              const record = match ? matchRecord(t.id, match.id) : dateGeneralCheckin(t.id);
              const isPresent = record ? (record.status || "present") === "present" : false;
              const isAbsent = record?.status === "absent";
              const hasRecord = !!record;

              return (
                <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-200 dark:border-slate-800/60 last:border-0 flex-wrap">
                  <div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.name}</div>
                    <div className="text-xs text-slate-400">
                      รหัส {t.id} · {t.year || "ไม่ระบุชั้นปี"}
                      {isSearching ? ` · ${t.role || "ไม่ระบุตำแหน่ง"}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    <button
                      onClick={() => setPendingCheckin({ studentId: t.id, matchId: match?.id ?? null, name: t.name, sport: match?.sport })}
                      disabled={isPresent || isAbsent}
                      title={match ? `${formatThaiDate(match.date)} · ${formatShortTime(match.time)} · ${match.venue}` : undefined}
                      className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        isPresent
                          ? "bg-emerald-500/15 text-emerald-400 cursor-default"
                          : isAbsent
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      <CheckCircle2 size={14} className="shrink-0" /> {isPresent ? "เช็คชื่อแล้ว" : "เช็คชื่อ"}
                    </button>
                    <button
                      onClick={() => setPendingAbsent({ studentId: t.id, name: t.name, matchId: match?.id ?? null })}
                      disabled={isPresent || isAbsent}
                      title={match ? `${formatThaiDate(match.date)} · ${formatShortTime(match.time)} · ${match.venue}` : undefined}
                      className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        isAbsent
                          ? "bg-red-500/15 text-red-400 cursor-default"
                          : isPresent
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 text-red-400 border border-red-900/50 hover:bg-red-500/10"
                      }`}
                    >
                      <XCircle size={14} className="shrink-0" /> {isAbsent ? "เช็คขาดแล้ว" : "เช็คขาด"}
                    </button>
                    {hasRecord && (
                      <button
                        onClick={() => setThreadFor({ studentId: t.id, date: selectedDate })}
                        title={`ดูข้อความของ${dateLabel}`}
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <MessageCircle size={14} className="shrink-0" /> ดูข้อความ
                      </button>
                    )}
                    {hasRecord && (
                      <button
                        onClick={() => setPendingUndo({ checkinId: record.id, name: t.name })}
                        title="ยกเลิกรายการนี้ (กรณีเช็คผิด) — เช็คใหม่ได้ทันทีหลังยกเลิก"
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-amber-500 border border-amber-300 dark:border-amber-500/40 hover:bg-amber-500/10"
                      >
                        <RotateCcw size={14} className="shrink-0" /> ยกเลิก
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
          `เช็คชื่อให้ "${pendingCheckin.name}"${pendingCheckin.sport ? ` เข้าร่วม ${pendingCheckin.sport}` : ""}${
            isRetroactive ? ` สำหรับ${dateLabel}` : ""
          } ใช่หรือไม่?`
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
        checkedBy={threadCheckedBy}
        onClose={() => setThreadFor(null)}
      />

      <QRScannerModal open={scannerOpen} onScan={handleScan} onClose={() => setScannerOpen(false)} />

      <MessageInboxModal
        open={inboxOpen}
        onOpenThread={(studentId, date) => {
          setInboxOpen(false);
          setThreadFor({ studentId, date });
        }}
        onClose={() => setInboxOpen(false)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
