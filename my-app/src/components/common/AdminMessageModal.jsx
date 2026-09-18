import React, { useEffect, useState } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { api } from "../../api";

// ป็อปอัปห้องแชทระหว่างนักศึกษาคนหนึ่งกับแอดมิน (คนละเรื่องกับ AttendanceThreadModal ที่คุยกับ "ผู้เช็คชื่อ"
// เรื่องเช็คชื่อวันหนึ่งๆ) — ห้องนี้ไม่ผูกวันที่ นักศึกษาแต่ละคนมีห้องเดียวกับแอดมิน ใช้ร่วมกันทั้ง 2 ฝั่ง:
// ฝั่งนักศึกษาเปิดจากปุ่มโปรไฟล์ใน Shell.jsx (viewerRole="student"), ฝั่งแอดมินเปิดจากรายชื่อห้องแชท
// ใน AdminMessages.jsx (viewerRole="admin") — ใช้ viewerRole (ไม่ใช่ชื่อ) ตัดสินฝั่งบับเบิล กันกรณีชื่อซ้ำกัน
export default function AdminMessageModal({ open, studentId, viewerRole, title, subtitle, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !studentId) return;
    setLoading(true);
    setError("");
    api
      .getAdminMessages(studentId)
      .then(setMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, studentId]);

  if (!open) return null;

  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const created = await api.sendAdminMessage({ studentId, message: reply.trim() });
      setMessages((prev) => [...prev, created]);
      setReply("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle size={16} className="text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" style={{ fontFamily: "Kanit, sans-serif" }}>
                {title}
              </div>
              {subtitle && <div className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</div>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading && <div className="text-center text-xs text-slate-400 py-6">กำลังโหลด...</div>}
          {!loading && messages.length === 0 && (
            <div className="text-center text-xs text-slate-400 py-6">ยังไม่มีข้อความ ส่งข้อความแรกได้เลย</div>
          )}
          {messages.map((m) => {
            const isMine = m.senderRole === viewerRole;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                    isMine ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="text-[11px] font-semibold opacity-70 mb-0.5">
                    {isMine ? "คุณ" : m.senderName}
                  </div>
                  <div className="whitespace-pre-wrap break-words">{m.message}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          {error && <div className="mb-2 text-xs text-red-400">{error}</div>}
          <div className="flex gap-2">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={send}
              disabled={sending || !reply.trim()}
              className="rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send size={14} /> ส่ง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
