# ระบบแจ้งเหตุ อบต (Complaint Reporting System)

ระบบร้องเรียนปัญหาออนไลน์สำหรับองค์การบริหารส่วนตำบล (อบต)

## ฟีเจอร์หลัก

### ส่วนที่ 1 — หน้าประชาชน (Public Portal)
- **กระดานข่าวชุมชน (Home)**: แสดงสถิติภาพรวม จำนวนเรื่องที่รับแจ้ง แก้ไขแล้ว และอัตราสำเร็จ พร้อม feed อัปเดตสถานะเคสล่าสุด
- **ข่าวสาร / ประชาสัมพันธ์**: แสดงข่าวสารและกิจกรรมในรูปแบบการ์ด มี category badge แยกประเภท และฝัง Facebook Page feed
- **ฟอร์มแจ้งปัญหา / ร้องเรียน**: กรอกข้อมูล รองรับการปักหมุดบน Google Maps และอัปโหลดรูปภาพได้สูงสุด 5 รูป

### ส่วนที่ 2 — หลังบ้านเจ้าหน้าที่ (Back-office)
- **Login**: เข้าใช้ได้เฉพาะเจ้าหน้าที่ที่มีบัญชีในระบบ
- **แดชบอร์ด**: สรุปสถิติภาพรวมและกราฟคำร้องรายเดือน
- **รายการคำร้อง**: ตารางคำร้องทั้งหมด ค้นหาและกรองตาม status ได้ พร้อมจัดการคำร้อง
- **ประชาสัมพันธ์**: CRUD ข่าวสารและกิจกรรม บันทึกแล้วแสดงบนหน้าประชาชนทันที
- **จัดการผู้ใช้ (admin เท่านั้น)**: สร้าง แก้ไข ตั้ง password มี 2 บทบาทคือ Admin และ Staff
- **Audit Log**: เก็บทุก action ในระบบ กรองตามผู้ใช้และช่วงเวลา

## เทคโนโลยีที่ใช้

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: SQLite (พร้อมสำหรับอัปเกรดเป็น PostgreSQL)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **UI Components**: Lucide React Icons

## การติดตั้ง

1. Clone repository
```bash
git clone <repository-url>
cd complaint-system
```

2. ติดตั้ง dependencies
```bash
npm install
```

3. ตั้งค่า environment variables
```bash
cp .env.example .env.local
```

แก้ไข `.env.local`:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

4. Setup database
```bash
npx prisma generate
npx prisma db push
```

5. สร้างข้อมูลตัวอย่าง (optional)
```bash
npx prisma db seed
```

6. เริ่ม development server
```bash
npm run dev
```

เปิด http://localhost:3000 ใน browser

## โครงสร้างโปรเจกต์

```
src/
├── app/
│   ├── portal/           # หน้าประชาชน
│   │   ├── page.tsx      # หน้าแรก - dashboard
│   │   ├── news/         # ข่าวสาร
│   │   └── complaint/    # ฟอร์มแจ้งปัญหา
│   ├── admin/            # หลังบ้านเจ้าหน้าที่
│   │   ├── login/        # หน้า login
│   │   ├── dashboard/    # dashboard
│   │   ├── complaints/   # จัดการคำร้อง
│   │   ├── news/         # จัดการข่าว
│   │   ├── users/        # จัดการผู้ใช้ (admin)
│   │   └── audit/        # audit log
│   └── api/              # API routes
│       ├── auth/         # authentication
│       ├── complaints/   # คำร้อง
│       ├── news/         # ข่าวสาร
│       └── users/        # ผู้ใช้
├── components/           # Reusable components
├── lib/                 # Utility functions
├── types/               # TypeScript types
└── hooks/              # Custom hooks
```

## การใช้งาน

### ประชาชน
1. เข้า http://localhost:3000/portal
2. ดูสถิติและคำร้องล่าสุดได้ที่หน้าแรก
3. อ่านข่าวสารได้ที่เมนู "ข่าวสาร"
4. แจ้งปัญหาได้ที่เมนู "แจ้งปัญหา"

### เจ้าหน้าที่
1. เข้า http://localhost:3000/admin/login
2. ใช้บัญชีที่ admin สร้างให้ในการ login
3. จัดการคำร้อง ข่าวสาร และผู้ใช้ได้ในหลังบ้าน

## บทบาทผู้ใช้

- **Admin**: ทำได้ทุกอย่าง - จัดการคำร้อง, ข่าวสาร, ผู้ใช้, ดู audit log
- **Staff**: จัดการคำร้องและข่าวสารได้ แต่ไม่สามารถจัดการผู้ใช้ได้

## การปรับใช้งานจริง

1. เปลี่ยนฐานข้อมูลจาก SQLite เป็น PostgreSQL
2. ตั้งค่า Facebook API สำหรับ feed integration
3. เชื่อมต่อ Google Maps API สำหรับการปักหมุดตำแหน่ง
4. ตั้งค่า email service สำหรับการแจ้งเตือน
5. ตั้งค่า file storage (S3, CloudFront) สำหรับรูปภาพ
6. เพิ่ม SSL certificate และ security headers
7. ตั้งค่า backup และ monitoring

## License

MIT
