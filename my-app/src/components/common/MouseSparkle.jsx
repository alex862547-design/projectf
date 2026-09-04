import React, { useEffect, useRef } from "react";

const COLORS = ["#a5b4fc", "#818cf8", "#f0abfc", "#93c5fd", "#fde68a"];

// เอฟเฟกต์ประกายดาวไล่ตามเส้นทางที่เมาส์ขยับ — จัดการ DOM ตรงๆ ด้วย ref แทน React state
// เพื่อไม่ให้ทุกการขยับเมาส์ (ยิงถี่มาก) ทำให้ทั้งแอป re-render
export default function MouseSparkle() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastSpawn = 0;
    let lastPos = null;

    function spawnSparkle(x, y) {
      const el = document.createElement("span");
      const size = 4 + Math.random() * 5;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const dx = (Math.random() - 0.5) * 30;
      const dy = (Math.random() - 0.5) * 30 - 10;
      el.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 0 6px 1px ${color};
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.9;
        --dx: ${dx}px;
        --dy: ${dy}px;
        animation: sparkle-fade 0.7s ease-out forwards;
      `;
      container.appendChild(el);
      el.addEventListener("animationend", () => el.remove());
    }

    function handleMouseMove(e) {
      const now = performance.now();
      const prev = lastPos;
      const dist = prev ? Math.hypot(e.clientX - prev.x, e.clientY - prev.y) : Infinity;
      lastPos = { x: e.clientX, y: e.clientY };
      if (now - lastSpawn < 40 || dist < 6) return; // จำกัดความถี่ กันประกายถี่เกินไปจนหน่วง
      lastSpawn = now;
      spawnSparkle(e.clientX, e.clientY);
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden" aria-hidden="true" />;
}
