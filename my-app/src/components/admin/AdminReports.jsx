import React, { useMemo } from "react";
import { FileSpreadsheet, FileText, Printer, ClipboardList } from "lucide-react";
import Card from "../common/Card";
import { getTeams, teamById, formatThaiDate, sortStudentsByYear } from "../../utils/helpers";

// สร้างไฟล์ .doc แบบง่าย (HTML ที่ Word เปิดได้โดยตรง) ไม่ต้องพึ่งไลบรารีเพิ่ม — วิธีนี้ใช้กันทั่วไปสำหรับ
// "ส่งออกเป็น Word" จากหน้าเว็บ โดยไม่ต้องสร้างไฟล์ .docx (OOXML) จริงๆ ซึ่งซับซ้อนเกินความจำเป็นของรายงานนี้
function downloadAsWord(title, htmlBody) {
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><title>${title}</title>
      <style>
        body { font-family: 'Sarabun', 'Leelawadee UI', sans-serif; }
        h1 { font-size: 18pt; } h2 { font-size: 14pt; margin-top: 24pt; }
        table { border-collapse: collapse; width: 100%; margin-top: 8pt; }
        th, td { border: 1px solid #999; padding: 4pt 8pt; font-size: 10pt; text-align: left; }
        th { background: #eee; }
      </style>
    </head>
    <body>${htmlBody}</body>
  </html>`;
  const blob = new Blob(["﻿", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

// สรุปข้อมูลทั้งระบบ (นักศึกษา, อันดับคะแนน, ตารางแข่งขัน, สรุปการเช็คชื่อ) ให้แอดมินดูภาพรวม แล้วส่งออกเป็น
// ไฟล์ Excel/Word หรือพิมพ์เป็นเอกสารได้ — ใช้ข้อมูลชุดเดียวกับหน้าอื่นๆ ในระบบ (ไม่มี endpoint แยก)
// คำนวณสดจาก props ทุกครั้งที่เปิดหน้านี้ จึงตรงกับข้อมูลล่าสุดเสมอ
export default function AdminReports({ students, matches, checkins, eventDays }) {
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const sortedStudents = useMemo(() => sortStudentsByYear(students || []), [students]);

  const standingsRows = useMemo(() => {
    const TEAMS = getTeams();
    const pts = Object.fromEntries(TEAMS.map((t) => [t.id, { win: 0, played: 0 }]));
    (matches || []).forEach((m) => {
      if (m.status !== "จบการแข่งขัน") return;
      pts[m.teamA].played++;
      pts[m.teamB].played++;
      if (m.round !== "รอบชิงชนะเลิศ") return;
      if (m.scoreA > m.scoreB) pts[m.teamA].win++;
      else if (m.scoreB > m.scoreA) pts[m.teamB].win++;
    });
    return TEAMS.map((t) => ({ ...t, ...pts[t.id] }))
      .sort((a, b) => b.win - a.win)
      .map((t) => ({
        ทีม: t.name,
        แข่งแล้ว: t.played,
        ชนะแชมป์: t.win,
        อัตราชนะ: t.played > 0 ? `${Math.round((t.win / t.played) * 100)}%` : "0%",
      }));
  }, [matches]);

  const matchRows = useMemo(
    () =>
      [...(matches || [])]
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
        .map((m) => ({
          กีฬา: m.sport,
          รอบ: m.round || "",
          วันที่: formatThaiDate(m.date),
          เวลา: (m.time || "").slice(0, 5),
          สนาม: m.venue || "",
          ทีมเอ: teamById(m.teamA).name,
          คะแนนเอ: m.status === "จบการแข่งขัน" ? m.scoreA : "",
          ทีมบี: teamById(m.teamB).name,
          คะแนนบี: m.status === "จบการแข่งขัน" ? m.scoreB : "",
          สถานะ: m.status,
        })),
    [matches]
  );

  const attendanceRows = useMemo(() => {
    const possible = (eventDays || []).filter((d) => d.date <= today).length;
    return sortedStudents.map((s) => {
      const mine = (checkins || []).filter((c) => c.studentId === s.id);
      const present = mine.filter((c) => c.status !== "absent").length;
      const absent = mine.filter((c) => c.status === "absent").length;
      return {
        รหัส: s.id,
        ชื่อ: s.name,
        ทีม: teamById(s.team).name,
        ตำแหน่ง: s.role || "",
        มา: present,
        ขาด: absent,
        ทั้งหมดที่ควรเช็ค: possible,
        อัตรามา: possible > 0 ? `${Math.round((present / possible) * 100)}%` : "0%",
      };
    });
  }, [sortedStudents, checkins, eventDays, today]);

  // ประวัติการเข้าร่วมกิจกรรมแบบละเอียด (ทุกครั้งที่เช็คชื่อ/เช็คขาดของทุกคน) เรียงตามคนก่อน (ตามลำดับชั้นปี
  // เดียวกับตารางอื่นๆ) แล้วเรียงตามวันที่ภายในคนเดียวกันอีกที ให้อ่านประวัติของแต่ละคนต่อกันเป็นชุดง่ายๆ
  const historyRows = useMemo(() => {
    const rows = [];
    sortedStudents.forEach((s) => {
      const mine = [...(checkins || [])].filter((c) => c.studentId === s.id).sort((a, b) => a.date.localeCompare(b.date));
      mine.forEach((c) => {
        rows.push({
          รหัส: s.id,
          ชื่อ: s.name,
          ทีม: teamById(s.team).name,
          ตำแหน่ง: s.role || "",
          วันที่: formatThaiDate(c.date),
          สถานะ: c.status === "absent" ? "เช็คขาด" : "มาเข้าร่วม",
          เวลาที่เช็ค: c.status === "absent" ? "" : (c.time || "").slice(0, 5),
          ผู้เช็คชื่อ: c.checkedBy ? `${c.checkedBy.name}${c.checkedBy.code ? ` (${c.checkedBy.code})` : ""}` : "",
        });
      });
    });
    return rows;
  }, [sortedStudents, checkins]);

  // ประวัติละเอียดมีเป็นหมื่นแถว (นักศึกษา x วันจัดกิจกรรมทุกวัน) เกินกว่าจะแสดงบนหน้าเว็บ/พิมพ์/ใส่ใน Word
  // ได้ทั้งหมดโดยไม่หน่วง จึงโชว์แค่ตัวอย่าง N แถวแรกในหน้าเว็บ/Word/พิมพ์ ส่วนไฟล์ Excel ยังคงมีข้อมูลครบทุกแถว
  // (Excel รองรับข้อมูลจำนวนมากและใช้กรอง/เรียงข้อมูลเพิ่มเองได้อยู่แล้ว)
  const HISTORY_PREVIEW_LIMIT = 300;
  const historyRowsPreview = useMemo(() => historyRows.slice(0, HISTORY_PREVIEW_LIMIT), [historyRows]);

  const studentRows = useMemo(
    () =>
      sortedStudents.map((s) => ({
        รหัส: s.id,
        ชื่อ: s.name,
        ชั้นปี: s.year || "",
        ทีม: teamById(s.team).name,
        ตำแหน่ง: s.role || "",
        สิทธิ์เช็คชื่อ: s.canCheckin ? "มี" : "ไม่มี",
      })),
    [sortedStudents]
  );

  // โหลดไลบรารี xlsx แบบ dynamic import (โหลดเฉพาะตอนกดปุ่มนี้จริงๆ) กันไม่ให้ไปเพิ่มขนาดไฟล์ JS หลักที่ทุกคน
  // ต้องโหลดตั้งแต่เปิดเว็บ ทั้งที่มีแค่แอดมินที่ใช้หน้านี้
  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentRows), "รายชื่อนักศึกษา");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(standingsRows), "อันดับคะแนนรวม");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(matchRows), "ตารางการแข่งขัน");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attendanceRows), "สรุปการเช็คชื่อ");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(historyRows), "ประวัติการเข้าร่วมกิจกรรม");
    XLSX.writeFile(wb, `รายงานกีฬาสี ${formatThaiDate(today)}.xlsx`);
  };

  const tableToHtml = (title, rows) => {
    if (rows.length === 0) return `<h2>${title}</h2><p>ไม่มีข้อมูล</p>`;
    const cols = Object.keys(rows[0]);
    return `<h2>${title}</h2><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows
      .map((r) => `<tr>${cols.map((c) => `<td>${r[c] ?? ""}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;
  };

  const exportWord = () => {
    const title = `รายงานกีฬาสี ${formatThaiDate(today)}`;
    const body = `<h1>${title}</h1>
      ${tableToHtml("รายชื่อนักศึกษา", studentRows)}
      ${tableToHtml("อันดับคะแนนรวม", standingsRows)}
      ${tableToHtml("ตารางการแข่งขัน", matchRows)}
      ${tableToHtml("สรุปการเช็คชื่อ", attendanceRows)}
      ${tableToHtml("ประวัติการเข้าร่วมกิจกรรม", historyRowsPreview)}
      ${
        historyRows.length > HISTORY_PREVIEW_LIMIT
          ? `<p>แสดงตัวอย่าง ${HISTORY_PREVIEW_LIMIT} รายการแรกจากทั้งหมด ${historyRows.length} รายการ — ดูข้อมูลครบถ้วนได้ในไฟล์ Excel ที่ส่งออก</p>`
          : ""
      }`;
    downloadAsWord(title, body);
  };

  const printReport = () => window.print();

  const SECTIONS = [
    { title: "รายชื่อนักศึกษา", rows: studentRows },
    { title: "อันดับคะแนนรวม", rows: standingsRows },
    { title: "ตารางการแข่งขัน", rows: matchRows },
    { title: "สรุปการเช็คชื่อ", rows: attendanceRows },
    {
      title: "ประวัติการเข้าร่วมกิจกรรม",
      rows: historyRowsPreview,
      note:
        historyRows.length > HISTORY_PREVIEW_LIMIT
          ? `แสดงตัวอย่าง ${HISTORY_PREVIEW_LIMIT} รายการแรกจากทั้งหมด ${historyRows.length} รายการ (ข้อมูลนี้มีจำนวนมาก แสดงทั้งหมดได้ไม่ไหว) — ดูข้อมูลครบถ้วนได้ในไฟล์ Excel ที่ส่งออก`
          : null,
    },
  ];

  return (
    <div className="px-4 md:px-8 pb-10 space-y-5">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1 text-slate-900 dark:text-slate-100 font-bold" style={{ fontFamily: "Kanit, sans-serif" }}>
          <ClipboardList size={18} className="text-indigo-400" /> สรุปผล/ส่งออกข้อมูล
        </div>
        <div className="text-xs text-slate-400 mb-4">
          สรุปข้อมูลนักศึกษา อันดับคะแนน ตารางการแข่งขัน และการเช็คชื่อทั้งหมด ณ วันที่ {formatThaiDate(today)} — เลือกส่งออกเป็นไฟล์ หรือพิมพ์เป็นเอกสารได้ด้านล่าง
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportExcel} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-emerald-700">
            <FileSpreadsheet size={14} /> ส่งออก Excel
          </button>
          <button onClick={exportWord} className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-blue-700">
            <FileText size={14} /> ส่งออก Word
          </button>
          <button onClick={printReport} className="flex items-center gap-1.5 rounded-lg bg-slate-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-slate-700">
            <Printer size={14} /> พิมพ์เอกสาร
          </button>
        </div>
      </Card>

      <div id="report-print-area" className="space-y-5">
        <div className="hidden print:block text-lg font-bold mb-2">รายงานกีฬาสี {formatThaiDate(today)}</div>
        {SECTIONS.map((sec) => (
          <Card key={sec.title} className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
              {sec.title}
            </div>
            <div className="overflow-x-auto">
              {sec.rows.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">ไม่มีข้อมูล</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                      {Object.keys(sec.rows[0]).map((c) => (
                        <th key={c} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {sec.rows.map((r, i) => (
                      <tr key={i}>
                        {Object.keys(sec.rows[0]).map((c) => (
                          <td key={c} className="px-3 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {r[c]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {sec.note && (
              <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">{sec.note}</div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
