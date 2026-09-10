import React, { useState } from "react";
import { LogIn, Eye, EyeOff, Globe } from "lucide-react";
import { getTeams } from "../utils/helpers";
import { api, setAuthToken } from "../api";

// หน้าแรกสุดของเว็บที่ทุกคนเห็นก่อนเข้าระบบ (ยังไม่ล็อกอิน) — มี 2 ทางเลือก:
// 1) กรอกรหัสผู้ใช้/รหัสผ่านแล้วกด "เข้าสู่ระบบ" -> เรียก api.login() ถ้าถูกจะได้ token กลับมา (setAuthToken เก็บไว้)
//    แล้วเรียก onLogin(user) ให้ App.jsx เปลี่ยนไปโชว์หน้านักศึกษา/แอดมินตาม role ต่อ
// 2) กด "เยี่ยมชมเว็บไซต์" -> ไม่ต้องล็อกอิน เรียก onGuestView() ให้ App.jsx โชว์ GuestView แทน
export default function Login({ onLogin, onGuestView }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api.login(username, password);
      setAuthToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 font-body"
      style={{ background: "linear-gradient(160deg,#101223,#1c2340)" }}
    >
      <div className="w-full max-w-6xl grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl">
        <div
          className="hidden md:flex flex-col justify-between p-14 text-white"
          style={{ background: "linear-gradient(155deg,#3D348B,#7678ED)" }}
        >
          <div>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="โลโก้วิทยาลัย" className="w-14 h-14 object-contain shrink-0" />
              <div className="text-base font-semibold tracking-[0.15em] uppercase opacity-80">
                วิทยาลัยเทคโนโลยีอุดมศึกษาพณิชยการ
              </div>
            </div>
            <h1 className="mt-8 text-5xl font-black leading-tight font-display">
              ระบบจัดการ
              <br />
              กีฬาสีภายในวิทยาลัย
            </h1>
            <p className="mt-5 text-base opacity-80 leading-relaxed">
              เช็คชื่อ ติดตามตารางแข่งขัน อันดับคะแนน และข่าวสารกิจกรรม ได้ในที่เดียว
            </p>
          </div>
          <div className="flex gap-2">
            {getTeams().map((t) => (
              <div key={t.id} className="flex-1 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
            ))}
          </div>
        </div>

        <div className="bg-white p-10 md:p-14 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-slate-900 font-display">เข้าสู่ระบบ</h2>
          <p className="text-sm text-slate-500 mt-1">
            นักศึกษาใช้รหัสนักศึกษาเป็นทั้งชื่อผู้ใช้และรหัสผ่านตั้งต้น
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">ชื่อผู้ใช้</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="เช่น รหัสนักศึกษา"
                className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">รหัสผ่าน</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-11 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="mt-3 text-sm text-red-500">{error}</div>}

          <button
            onClick={submit}
            disabled={loading}
            className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white font-semibold py-3.5 text-base hover:bg-indigo-700 transition disabled:opacity-60"
          >
            <LogIn size={16} /> {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>

          {onGuestView && (
            <>
              <div className="mt-5 flex items-center gap-3 text-xs text-slate-400">
                <div className="flex-1 h-px bg-slate-200" />
                หรือ
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <button
                onClick={onGuestView}
                className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-slate-300 text-slate-600 font-semibold py-3.5 text-base hover:bg-slate-50 hover:border-slate-400 transition"
              >
                <Globe size={16} /> เยี่ยมชมเว็บไซต์ (สำหรับผู้ที่ไม่ใช่นักศึกษา)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
