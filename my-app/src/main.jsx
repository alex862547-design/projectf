// จุดเริ่มต้นของทั้งแอป (entry point) — Vite โหลดไฟล์นี้เป็นไฟล์แรกตามที่ตั้งไว้ใน index.html
// หน้าที่: mount <App /> (ทุกอย่างของเว็บ) เข้าไปที่ <div id="root"> ใน index.html แค่นั้น ไม่มี logic อื่น
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
