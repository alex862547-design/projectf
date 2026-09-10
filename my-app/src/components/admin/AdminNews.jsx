import React, { useState } from "react";
import { Plus, Trash2, ChevronDown, Newspaper } from "lucide-react";
import Card from "../common/Card";
import { api } from "../../api";
import { formatThaiDate } from "../../utils/helpers";

// สีไอคอนของข่าวแต่ละชิ้นวนตามลำดับ ให้แยกแต่ละข่าวออกจากกันได้ง่ายด้วยตาแม้หัวข้อจะคล้ายกัน
const NEWS_COLORS = [
  { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-200 dark:border-rose-500/30" },
  { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-200 dark:border-amber-500/30" },
  { bg: "bg-sky-500/15", text: "text-sky-400", border: "border-sky-200 dark:border-sky-500/30" },
  { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/30" },
  { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-200 dark:border-violet-500/30" },
  { bg: "bg-fuchsia-500/15", text: "text-fuchsia-400", border: "border-fuchsia-200 dark:border-fuchsia-500/30" },
];

// เมนูแอดมิน "ข่าวสาร" — ประกาศ/ลบข่าวที่จะไปโชว์ในหน้าหลักของนักศึกษา (UserHome) และหน้าเยี่ยมชม (GuestHome)
// ข่าวแต่ละชิ้นเป็นการ์ดแยกของตัวเอง สีไอคอนวนตามลำดับ (NEWS_COLORS) ให้แยกแต่ละข่าวออกจากกันง่ายด้วยตา
export default function AdminNews({ news, setNews }) {
  const [form, setForm] = useState({ title: "", body: "" });
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const add = async () => {
    if (!form.title) return;
    try {
      const created = await api.createNews(form);
      setNews([created, ...news]);
      setForm({ title: "", body: "" });
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteNews(id);
      setNews(news.filter((n) => n.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="px-4 md:px-8 pb-10 space-y-5">
      <Card className="p-5" border="border-rose-200 dark:border-rose-500/30">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2.5 text-left"
          style={{ fontFamily: "Kanit, sans-serif" }}
        >
          <span className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
            <Newspaper size={15} />
          </span>
          ประกาศข่าวใหม่
          <ChevronDown size={16} className={`ml-auto text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded && (
          <div className="mt-3">
            <input placeholder="หัวข้อข่าว" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            <textarea placeholder="รายละเอียด" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3}/>
            <button onClick={add} className="mt-3 flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700">
              <Plus size={14}/> เผยแพร่ข่าว
            </button>
            {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
          </div>
        )}
      </Card>
      {news.length === 0 && (
        <Card className="p-8 text-center text-sm text-slate-400">ยังไม่มีข่าวสาร</Card>
      )}

      <div className="space-y-3">
        {news.map((n, i) => {
          const c = NEWS_COLORS[i % NEWS_COLORS.length];
          return (
            <Card key={n.id} className="p-5 flex items-start justify-between gap-3" border={c.border}>
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-lg ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
                  <Newspaper size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>{n.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{formatThaiDate(n.date)}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{n.body}</div>
                </div>
              </div>
              <button onClick={() => remove(n.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0">
                <Trash2 size={14}/>
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
