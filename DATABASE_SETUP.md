# PostgreSQL Database Setup

## 🚀 Quick Start

### 1. Install Docker (ถ้ายังไม่มี)
```bash
# Mac
brew install docker docker-compose

# หรือดาวนโหลดจาก https://docs.docker.com/get-docker/
```

### 2. เริ่มต้น Database
```bash
# รัน script ติดตั้ง
./setup-db.sh
```

### 3. เริ่ม Application
```bash
npm run dev
```

## 📋 Database Info

- **Host:** localhost
- **Port:** 5432  
- **Database:** myobt_complaints
- **User:** myobt_user
- **Password:** myobt_password

## 🔧 คำสั่งสำคัญ

```bash
# เริ่ม Database
docker-compose up -d

# หยุด Database  
docker-compose down

# ดู logs
docker-compose logs postgres

# เชื่อมต่อ Database
docker exec -it myobt-postgres psql -U myobt_user -d myobt_complaints

# Backup Database
docker exec myobt-postgres pg_dump -U myobt_user myobt_complaints > backup.sql

# Restore Database
docker exec -i myobt-postgres psql -U myobt_user myobt_complaints < backup.sql
```

## 🌱 ข้อมูลที่สร้างอัตโนมัติ

- **ผู้ใช้:** 3 บัญชี (Admin + Staff 2 คน)
- **ข่าว:** 5 รายการ (ภาษาไทย)
- **คำร้อง:** 300 รายการ (6 เดือนย้อนหลัง)

## 🎯 ข้อดี PostgreSQL

✅ **ข้อมูลไม่หาย** - ไม่เหมือน SQLite ในเครื่อง  
✅ **Multi-user** - ทีมงานทุกคนเห็นข้อมูลเดียวกัน  
✅ **Production Ready** - ใช้จริงได้  
✅ **Performance** - เร็วและเสถียร  
✅ **Backup** สำรองข้อมูลได้  

## 🔄 ย้ายข้อมูลเดิม (ถ้าต้องการ)

ข้อมูล SQLite เดิมจะอยู่ใน `prisma/dev.db`  
ถ้าต้องการย้ายข้อมูลเดิมไป PostgreSQL ให้แจ้ง!
