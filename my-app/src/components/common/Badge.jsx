import React from "react";
import { teamById } from "../../utils/helpers";

export default function Badge({ team }) {
  const t = teamById(team);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${t.accent}2E`, color: t.accent }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
      {t.name}
    </span>
  );
}
