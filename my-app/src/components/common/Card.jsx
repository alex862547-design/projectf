import React from "react";

export default function Card({ children, className = "", border = "border-slate-200 dark:border-slate-800" }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${border} shadow-lg shadow-slate-300/50 dark:shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}
