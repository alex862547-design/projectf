# ขั้นตอนที่ 1: build ไฟล์ static ด้วย Node
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# ที่อยู่ backend ให้ตั้งตอน build image ผ่าน --build-arg (ค่า default ใช้ตอนรันคู่กับ docker-compose ในเครื่องนี้)
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ขั้นตอนที่ 2: เอาไฟล์ static ที่ build แล้วไปเสิร์ฟด้วย nginx (image เล็ก เบา เร็ว)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
