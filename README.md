# projectf

ระบบจัดการกีฬาสีภายในวิทยาลัย — React + Vite frontend (`my-app/`) และ Express + PostgreSQL backend (`server/`)

## โครงสร้างโปรเจกต์
- `my-app/` — เว็บแอปฝั่งผู้ใช้ (นักศึกษา/แอดมิน)
- `server/` — REST API เชื่อมต่อฐานข้อมูล PostgreSQL

## เริ่มใช้งาน (development)
```bash
# backend
cd server
cp .env.example .env   # แล้วกรอกค่าให้ครบ
npm install
npm run dev

# frontend (อีก terminal)
cd my-app
npm install
npm run dev
```
