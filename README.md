# projectf

ระบบจัดการกีฬาสีภายในวิทยาลัย — ฝั่ง frontend (React + Vite)

## โครงสร้างโปรเจกต์
- `my-app/` — เว็บแอปฝั่งผู้ใช้ (นักศึกษา/แอดมิน)

Repo นี้เก็บเฉพาะ frontend เท่านั้น ต้องตั้งค่า `VITE_API_URL` ให้ชี้ไปที่ backend API ที่ deploy แยกไว้ต่างหาก

## เริ่มใช้งาน (development)
```bash
cd my-app
npm install
npm run dev
```

## รันทั้งระบบด้วย Docker (frontend + backend + database)
Repo นี้เก็บแค่ frontend แต่ถ้ามีโฟลเดอร์ `server/` วางอยู่ข้างๆ `my-app/` ในเครื่องเดียวกัน (ของโปรเจกต์เต็มบนเครื่องพัฒนา)
จะมี `docker-compose.yml` ที่รันทั้ง 3 ส่วนพร้อมกันได้ด้วยคำสั่งเดียว โดยไม่ต้องติดตั้ง Node.js หรือ PostgreSQL เอง:

```bash
docker compose up --build
```

จากนั้นเปิด `http://localhost:5173` ได้เลย (ครั้งแรกจะสร้างฐานข้อมูลใหม่พร้อมข้อมูลตัวอย่าง ไม่ใช่ข้อมูลจริงจาก production)

คำสั่งอื่นที่ใช้บ่อย:
- `docker compose up -d` — รันแบบ background
- `docker compose down` — หยุด container ทั้งหมด (ข้อมูลฐานข้อมูลยังอยู่)
- `docker compose down -v` — หยุดแล้วลบข้อมูลฐานข้อมูลด้วย (เริ่มใหม่หมด)
- `docker compose logs -f server` — ดู log ของ backend แบบเรียลไทม์

> หมายเหตุ: วิธีนี้ใช้ได้เฉพาะตอนมีโฟลเดอร์ `server/` อยู่ในเครื่องจริงเท่านั้น (repo `projectf` บน GitHub ไม่ได้เก็บ `server/` ไว้ เพราะแยก repo backend ไว้ต่างหากที่ `projectb`)
