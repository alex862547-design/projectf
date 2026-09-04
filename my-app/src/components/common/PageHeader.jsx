import React from "react";

export default function PageHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <span className="w-1.5 h-6 rounded-full bg-indigo-500 shrink-0" />
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
        )}
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Kanit, sans-serif" }}>
          {title}
        </h1>
      </div>
      {subtitle && <p className="text-sm text-slate-400 mt-1.5 ml-4">{subtitle}</p>}
    </div>
  );
}
