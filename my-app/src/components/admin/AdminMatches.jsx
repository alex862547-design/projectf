import React, { useState } from "react";
import { Plus, Trash2, Clock, MapPin, Trophy, ChevronDown } from "lucide-react";
import Card from "../common/Card";
import StatusPill from "../common/StatusPill";
import { api } from "../../api";
import { teamById } from "../../utils/helpers";

// แปลงวันที่ "YYYY-MM-DD" ให้เป็น "D/M/YYYY" แบบไทย (เอาวันขึ้นก่อน ไม่ใช่ปี) เช่น 23/8/2569
function formatThaiDate(iso) {
  if (!iso) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y + 543}`;
}

const ROUNDS = ["รอบรองชนะเลิศ", "รอบชิงอันดับ 3", "รอบชิงชนะเลิศ"];

export default function AdminMatches({ matches, setMatches, teams }) {
  const [form, setForm] = useState({ sport: "", teamA: "red", teamB: "blue", date: "", time: "", venue: "", round: ROUNDS[0] });
  const [error, setError] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [expanded, setExpanded] = useState(false);

  const sports = [...new Set(matches.map((m) => m.sport))];
  const visibleMatches = selectedSport === "all" ? matches : matches.filter((m) => m.sport === selectedSport);

  const add = async () => {
    if (!form.sport || !form.date) return;
    try {
      const created = await api.createMatch(form);
      setMatches([...matches, created]);
      setForm({ sport: "", teamA: "red", teamB: "blue", date: "", time: "", venue: "", round: ROUNDS[0] });
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const updateRound = async (id, round) => {
    try {
      const updated = await api.updateMatch(id, { round });
      setMatches(matches.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      setError(err.message);
    }
  };

  const updateTeam = async (id, key, teamId) => {
    try {
      const updated = await api.updateMatch(id, { [key]: teamId });
      setMatches(matches.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteMatch(id);
      setMatches(matches.filter((m) => m.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // อัปเดตคะแนนในหน้าจอทันที (ตอบสนองไว) แล้วค่อยบันทึกลงฐานข้อมูลตอนออกจากช่อง (onBlur)
  const setScoreLocal = (id, key, val) =>
    setMatches(matches.map((m) => (m.id === id ? { ...m, [key]: val === "" ? null : Number(val) } : m)));

  const saveScore = async (id) => {
    const m = matches.find((x) => x.id === id);
    try {
      const updated = await api.updateMatch(id, { scoreA: m.scoreA, scoreB: m.scoreB });
      setMatches(matches.map((x) => (x.id === id ? updated : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  // แก้ไขเวลาแข่งขันของรายการที่มีอยู่แล้ว
  const setTimeLocal = (id, val) =>
    setMatches(matches.map((m) => (m.id === id ? { ...m, time: val } : m)));

  const saveTime = async (id) => {
    const m = matches.find((x) => x.id === id);
    try {
      const updated = await api.updateMatch(id, { time: m.time });
      setMatches(matches.map((x) => (x.id === id ? updated : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  // แก้ไขสถานที่จัดกิจกรรมของรายการที่มีอยู่แล้ว
  const setVenueLocal = (id, val) =>
    setMatches(matches.map((m) => (m.id === id ? { ...m, venue: val } : m)));

  const saveVenue = async (id) => {
    const m = matches.find((x) => x.id === id);
    try {
      const updated = await api.updateMatch(id, { venue: m.venue ?? "" });
      setMatches(matches.map((x) => (x.id === id ? updated : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  const finish = async (id) => {
    try {
      const updated = await api.updateMatch(id, { status: "จบการแข่งขัน" });
      setMatches(matches.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      setError(err.message);
    }
  };

  // พิมพ์ผลการแข่งขันเป็นข้อความ (เก็บแยกจากคะแนนตัวเลข เผื่ออยากอธิบายผลแบบอื่น เช่น "ชนะจุดโทษ")
  const setNoteLocal = (id, val) =>
    setMatches(matches.map((m) => (m.id === id ? { ...m, note: val } : m)));

  const saveNote = async (id) => {
    const m = matches.find((x) => x.id === id);
    try {
      const updated = await api.updateMatch(id, { note: m.note ?? "" });
      setMatches(matches.map((x) => (x.id === id ? updated : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="px-4 md:px-8 pb-10 space-y-5">
      <Card className="p-5" border="border-violet-200 dark:border-violet-500/30">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2.5 text-left"
          style={{ fontFamily: "Kanit, sans-serif" }}
        >
          <span className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
            <Trophy size={15} />
          </span>
          เพิ่มรายการแข่งขัน
          <ChevronDown size={16} className={`ml-auto text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded && (
          <div className="mt-3">
            <div className="grid sm:grid-cols-7 gap-2">
              <input placeholder="ชนิดกีฬา" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-2 text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              <select value={form.teamA} onChange={(e) => setForm({ ...form, teamA: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select value={form.teamB} onChange={(e) => setForm({ ...form, teamB: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:light] dark:[color-scheme:dark]"/>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:light] dark:[color-scheme:dark]"/>
              <select value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {ROUNDS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <input placeholder="สถานที่" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="mt-2 w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            <button onClick={add} className="mt-3 flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700">
              <Plus size={14}/> เพิ่มรายการแข่งขัน
            </button>
            {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
          </div>
        )}
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setSelectedSport("all")}
          className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
            selectedSport === "all"
              ? "bg-indigo-600 text-white"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
          }`}
        >
          ทั้งหมด ({matches.length})
        </button>
        {sports.map((sport) => {
          const count = matches.filter((m) => m.sport === sport).length;
          return (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                selectedSport === sport
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
              }`}
            >
              <Trophy size={13} className={selectedSport === sport ? "text-white" : "text-indigo-400"} /> {sport} ({count})
            </button>
          );
        })}
      </div>

      <Card className="p-0 overflow-hidden">
        {visibleMatches.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">ไม่พบรายการแข่งขัน</div>
        )}
        {visibleMatches.map((m) => (
          <div key={m.id} className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/60 last:border-0">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{m.sport}</div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock size={12}/>{formatThaiDate(m.date)} ·
                    <input
                      type="time"
                      value={(m.time || "").slice(0, 5)}
                      onChange={(e) => setTimeLocal(m.id, e.target.value)}
                      onBlur={() => saveTime(m.id)}
                      className="rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12}/>
                    <input
                      type="text"
                      placeholder="สถานที่"
                      value={m.venue ?? ""}
                      onChange={(e) => setVenueLocal(m.id, e.target.value)}
                      onBlur={() => saveVenue(m.id)}
                      className="w-32 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 placeholder-slate-500 px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </span>
                  <select
                    value={m.round || ROUNDS[0]}
                    onChange={(e) => updateRound(m.id, e.target.value)}
                    className="rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {ROUNDS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <select
                  value={m.teamA}
                  onChange={(e) => updateTeam(m.id, "teamA", e.target.value)}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  style={{ backgroundColor: `${teamById(m.teamA).accent}2E`, color: teamById(m.teamA).accent }}
                >
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input
                  type="number"
                  value={m.scoreA ?? ""}
                  onChange={(e) => setScoreLocal(m.id, "scoreA", e.target.value)}
                  onBlur={() => saveScore(m.id)}
                  className="w-12 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-slate-500">:</span>
                <input
                  type="number"
                  value={m.scoreB ?? ""}
                  onChange={(e) => setScoreLocal(m.id, "scoreB", e.target.value)}
                  onBlur={() => saveScore(m.id)}
                  className="w-12 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={m.teamB}
                  onChange={(e) => updateTeam(m.id, "teamB", e.target.value)}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  style={{ backgroundColor: `${teamById(m.teamB).accent}2E`, color: teamById(m.teamB).accent }}
                >
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                <StatusPill status={m.status}/>
                {m.status !== "จบการแข่งขัน" && (
                  <button onClick={() => finish(m.id)} className="text-xs font-semibold text-indigo-400 hover:underline">ปิดผลการแข่งขัน</button>
                )}
                <button onClick={() => remove(m.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <input
                type="text"
                placeholder="พิมพ์ผลการแข่งขันเป็นข้อความ (ไม่บังคับ)"
                value={m.note ?? ""}
                onChange={(e) => setNoteLocal(m.id, e.target.value)}
                onBlur={() => saveNote(m.id)}
                className="w-full sm:w-80 max-w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}