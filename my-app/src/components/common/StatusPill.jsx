import React from "react";

export default function StatusPill({ status }) {
  const done = status === "จบการแข่งขัน";
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        done ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
      }`}
    >
      {status}
    </span>
  );
}
