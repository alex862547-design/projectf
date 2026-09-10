import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

// วาด QR code จากข้อความที่รับมาลงใน <canvas> ด้วยไลบรารี "qrcode" — สร้างเองในเบราว์เซอร์ทั้งหมด
// ไม่ต้องเรียก API ภายนอก (ต่างจากเว็บ generate QR ทั่วไปที่ส่งข้อมูลไปเซิร์ฟเวอร์คนอื่น) จึงใช้ได้แม้ QR
// จะเป็นรหัสนักศึกษาที่ไม่ควรรั่วไปที่อื่น จะรีวาดใหม่อัตโนมัติทุกครั้งที่ value เปลี่ยน
export default function QRCodeImage({ value, size = 220 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 1 }, (err) => {
      if (err) console.error("สร้าง QR code ไม่สำเร็จ:", err);
    });
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />;
}
