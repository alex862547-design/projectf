import React, { useState } from "react";
import { Plus, Trash2, CalendarDays, Pencil, Check, X, ChevronDown } from "lucide-react";
import Card from "../common/Card";
import { api } from "../../api";

const THAI_DATE = (isoDate) => {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
};

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
// คีย์เดือน "YYYY-MM" ใช้จัดกลุ่มปุ่มลัด และแปลงเป็นป้ายเดือนภาษาไทย เช่น "สิงหาคม 2569"
const monthKeyOf = (iso) => (iso || "").slice(0, 7);
const monthLabelOf = (key) => {
  const [y, m] = key.split("-").map(Number);
  return `${THAI_MONTHS[m - 1]} ${y + 543}`;
};

// สร้างรายการวันที่ทั้งหมดตั้งแต่ from ถึง to (รวมทั้งสองฝั่ง) แบบ "YYYY-MM-DD"
function dateRange(from, to) {
  const dates = [];
  let cur = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export default function AdminEventDays({ eventDays, setEventDays }) {
  const [date, setDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("all");

  const months = [...new Set(eventDays.map((d) => monthKeyOf(d.date)))].sort();
  const visibleEventDays = selectedMonth === "all" ? eventDays : eventDays.filter((d) => monthKeyOf(d.date) === selectedMonth);

  const inputCls =
    "rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const dateInputCls = `${inputCls} [color-scheme:light] dark:[color-scheme:dark]`;

  const add = async () => {
    if (!date) return;
    try {
      let updated;
      if (toDate && toDate > date) {
        updated = await api.createEventDays(dateRange(date, toDate), label.trim() || null);
      } else {
        updated = await api.createEventDay(date, label.trim() || null);
      }
      setEventDays(updated);
      setDate("");
      setToDate("");
      setLabel("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      const updated = await api.deleteEventDay(id);
      setEventDays(updated);
      if (editingId === id) setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (d) => {
    setEditingId(d.id);
    setEditDate(d.date);
    setEditLabel(d.label || "");
    setError("");
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id) => {
    if (!editDate) return;
    try {
      const updated = await api.updateEventDay(id, editDate, editLabel.trim() || null);
      setEventDays(updated);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="px-4 md:px-8 pb-10 space-y-5">
      <Card className="p-5" border="border-amber-200 dark:border-amber-500/30">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2.5 text-left"
          style={{ fontFamily: "Kanit, sans-serif" }}
        >
          <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <CalendarDays size={15} />
          </span>
          เพิ่มวันจัดกิจกรรม
          <ChevronDown size={16} className={`ml-auto text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded && (
          <div className="mt-3">
            <p className="text-xs text-slate-400 mb-3">
              เลือกวันที่จากปฏิทินด้านล่าง — วันที่เหล่านี้จะใช้เป็นตัวตัดสินว่านักศึกษา "มา" หรือ "ไม่มา" ในหน้า "ประวัติของฉัน"
              (นับว่ามา ถ้ามีการเช็คชื่ออย่างน้อย 1 ครั้งในวันนั้น) — เลือก "ถึงวันที่" เพิ่มเติมเพื่อเพิ่มได้ทีละหลายวันติดต่อกัน
            </p>
            <div className="grid sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">จากวันที่</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`w-full ${dateInputCls}`} />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ถึงวันที่ (ไม่บังคับ)</label>
                <input type="date" value={toDate} min={date || undefined} onChange={(e) => setToDate(e.target.value)} className={`w-full ${dateInputCls}`} />
              </div>
              <input
                placeholder="ชื่อวัน (ไม่บังคับ) เช่น วันแข่งขันวันแรก"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className={`sm:col-span-2 self-end ${inputCls}`}
              />
            </div>
            <button onClick={add} className="mt-3 flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700">
              <Plus size={14} /> {toDate && toDate > date ? "เพิ่มหลายวัน" : "เพิ่มวันจัดกิจกรรม"}
            </button>
            {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
          </div>
        )}
      </Card>

      {months.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setSelectedMonth("all")}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
              selectedMonth === "all"
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
            }`}
          >
            ทุกเดือน ({eventDays.length})
          </button>
          {months.map((key) => {
            const count = eventDays.filter((d) => monthKeyOf(d.date) === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedMonth(key)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  selectedMonth === key
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
                }`}
              >
                {monthLabelOf(key)} ({count})
              </button>
            );
          })}
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        {eventDays.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">ยังไม่ได้กำหนดวันจัดกิจกรรม</div>
        )}
        {eventDays.length > 0 && visibleEventDays.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">ไม่มีวันจัดกิจกรรมในเดือนนี้</div>
        )}
        {visibleEventDays.map((d) => {
          const isEditing = editingId === d.id;
          return (
            <div key={d.id} className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/60 last:border-0">
              {isEditing ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className={dateInputCls} />
                  <input
                    placeholder="ชื่อวัน (ไม่บังคับ)"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className={`flex-1 min-w-[10rem] ${inputCls}`}
                  />
                  <button onClick={() => saveEdit(d.id)} className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-500/10" title="บันทึก">
                    <Check size={16} />
                  </button>
                  <button onClick={cancelEdit} className="p-2 rounded-lg text-slate-500 hover:bg-slate-500/10" title="ยกเลิก">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{THAI_DATE(d.date)}</div>
                    {d.label && <div className="text-xs text-slate-400">{d.label}</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(d)} className="p-2 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10" title="แก้ไข">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(d.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10" title="ลบ/ยกเลิก">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
