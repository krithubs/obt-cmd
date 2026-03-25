# E2E Testing Report - ระบบรับเรื่องร้องเรียน อบต.โหล่งขอด

**ทดสอบเมื่อ:** March 24, 2026  
**ทดสอบโดย:** Cascade AI  
**ระบบ:** Next.js 14 + Prisma + SQLite

---

## สรุปผลการทดสอบ

| ระดับ | จำนวน |
|-------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 4 |
| 🟡 Medium | 4 |
| 🔵 Low | 3 |

---

## 🔴 Critical Issues

### 1. ไม่มี Authentication/Authorization บน API
**ปัญหา:** ทุก API endpoint (`GET`, `POST`, `PUT`, `DELETE`) เปิดให้เข้าถึงได้โดยไม่ต้อง login  
**ทดสอบ:**
- `DELETE /api/complaints/{id}` — ลบคำร้องได้โดยไม่ต้อง login ✅ สำเร็จ
- `PUT /api/complaints/{id}` — เปลี่ยนสถานะคำร้องได้โดยไม่ต้อง login ✅ สำเร็จ
- `GET /api/complaints` — ดูข้อมูลส่วนตัวของผู้ร้องทุกคนได้ (ชื่อ, เบอร์โทร) ✅ สำเร็จ

**ผลกระทบ:** ใครก็ตามที่รู้ URL สามารถลบ/แก้ไขคำร้องทั้งหมด และเข้าถึงข้อมูลส่วนตัวของชาวบ้านได้  
**แนะนำ:** เพิ่ม middleware ตรวจสอบ session/token สำหรับ `PUT`, `DELETE` และจำกัด fields ที่ return ใน public `GET`

### 2. ไม่มี Status Validation — ใส่ค่าอะไรก็ได้
**ปัญหา:** สามารถตั้งค่า status เป็นค่าใดก็ได้ผ่าน API  
**ทดสอบ:**
```
PUT /api/complaints/{id} {"status": "HACKED"}
→ สถานะเปลี่ยนเป็น "HACKED" สำเร็จ
```
**ผลกระทบ:** ข้อมูลสถานะไม่น่าเชื่อถือ, UI อาจแสดงผลผิดพลาด  
**แนะนำ:** Validate ว่า status ต้องเป็น `PENDING | IN_PROGRESS | RESOLVED` เท่านั้น

### 3. XSS (Cross-Site Scripting) — ไม่มีการ Sanitize Input
**ปัญหา:** สามารถส่ง HTML/JavaScript ผ่านทุก field ได้  
**ทดสอบ:**
```json
{
  "name": "<script>alert('XSS')</script>",
  "description": "<img src=x onerror=alert(1)>",
  "location": "<svg onload=alert(1)>"
}
→ บันทึกสำเร็จ, ข้อมูลถูกเก็บตรงๆ ไม่มี sanitization
```
**ผลกระทบ:** หากหน้า admin แสดง data โดยใช้ `dangerouslySetInnerHTML` จะถูกโจมตีได้ (React ป้องกัน XSS เบื้องต้นด้วย auto-escaping แต่ควร sanitize ที่ API ด้วย)  
**แนะนำ:** Sanitize input ด้วย library เช่น `DOMPurify` หรือ strip HTML tags ที่ API layer

---

## 🟠 High Issues

### 4. ไม่มี Rate Limiting — Spam ได้ไม่จำกัด
**ปัญหา:** ไม่มีการจำกัดจำนวนคำร้องต่อ IP/ช่วงเวลา  
**ทดสอบ:** ส่ง 5 requests พร้อมกัน → 2 สำเร็จ, 3 ล้มเหลวเพราะ ticket collision (ไม่ใช่เพราะ rate limit)  
**ผลกระทบ:** ใครก็ตามสามารถ spam คำร้องเป็นพันๆ รายการได้  
**แนะนำ:** เพิ่ม rate limiting เช่น จำกัด 5 คำร้อง/IP/ชั่วโมง

### 5. Ticket Number Collision — ซ้ำได้เมื่อส่งพร้อมกัน
**ปัญหา:** Ticket number ใช้ `Math.random() * 10000` → 4 หลักสุ่ม, มีโอกาสซ้ำกัน  
**ทดสอบ:** ส่ง 5 requests พร้อมกัน → 3 จาก 5 ได้ HTTP 500 (ticket number ซ้ำ, unique constraint violation)  
**ผลกระทบ:** ชาวบ้านส่งคำร้องไม่สำเร็จเมื่อมีคนอื่นส่งพร้อมกัน  
**แนะนำ:** ใช้ UUID หรือ auto-increment + retry logic สำหรับ ticket number

### 6. ไม่มี Input Length Validation — ส่งข้อมูลขนาดใหญ่ได้
**ปัญหา:** ไม่จำกัดความยาวของ text fields  
**ทดสอบ:**
```
name: 10,000 ตัวอักษร ✅ สำเร็จ
description: 50,000 ตัวอักษร ✅ สำเร็จ
ขนาด request: 70KB+ ✅ สำเร็จ
```
**ผลกระทบ:** Database โตเร็วผิดปกติ, UI แสดงผลเพี้ยน  
**แนะนำ:** จำกัด name ≤ 100, phone ≤ 20, description ≤ 2000, location ≤ 200 ตัวอักษร

### 7. Images เก็บเป็น blob:// URL — ไม่ทำงานจริง
**ปัญหา:** Frontend ส่ง `URL.createObjectURL(file)` ซึ่งเป็น local blob URL ไปเก็บใน DB  
**ทดสอบ:** URL ที่เก็บเป็น `blob:http://localhost:3000/...` ซึ่งใช้ได้เฉพาะ browser ที่สร้าง  
**ผลกระทบ:** รูปภาพจะไม่แสดงในหน้า admin หรือเครื่องอื่น  
**แนะนำ:** Upload ไฟล์จริงไปยัง storage (local disk หรือ cloud) แล้วเก็บ path/URL ที่เข้าถึงได้

---

## 🟡 Medium Issues

### 8. Whitespace-only Input ผ่าน Validation
**ปัญหา:** ส่งชื่อ/ประเภท/รายละเอียดเป็นช่องว่าง "   " ผ่านได้  
**ทดสอบ:**
```json
{"name": "   ", "type": "   ", "description": "   "}
→ HTTP 201 สำเร็จ
```
**แนะนำ:** `.trim()` ก่อน validate

### 9. Phone ไม่มี Format Validation
**ปัญหา:** ส่งเบอร์โทรเป็นข้อความอะไรก็ได้  
**ทดสอบ:** `"phone": "abc-not-a-phone"` → ผ่าน  
**แนะนำ:** Validate format เบอร์โทรไทย (0x-xxxx-xxxx)

### 10. Type ไม่มี Enum Validation
**ปัญหา:** ส่งประเภทคำร้องเป็นค่าอะไรก็ได้  
**ทดสอบ:** `"type": "INVALID_TYPE_XYZ"` → ผ่าน  
**แนะนำ:** จำกัดเฉพาะค่าที่กำหนด: `ถนน | ไฟฟ้า | น้ำประปา | สิ่งแวดล้อม | อื่นๆ`

### 11. ข้อมูลส่วนตัวถูกเปิดเผยใน GET /api/complaints
**ปัญหา:** API ส่งข้อมูลทั้งหมดรวมถึง name, phone ของผู้ร้อง  
**ผลกระทบ:** Portal page fetch complaints ทั้งหมดมาแสดง = ข้อมูลส่วนตัวรั่วไหล  
**แนะนำ:** สร้าง public API แยก ที่ return เฉพาะ fields ที่จำเป็น (ticketNo, type, status, createdAt)

---

## 🔵 Low Issues

### 12. Type Confusion — ส่ง non-string ค่า error ไม่ชัดเจน
**ปัญหา:** ส่ง number แทน string → HTTP 500 generic error  
**ทดสอบ:** `{"name": 12345, "type": true, "description": ["array"]}` → 500  
**แนะนำ:** Validate types และ return error message ที่ชัดเจน

### 13. PUT ไม่สามารถแก้ไข name/description ได้
**ปัญหา (ดี):** PUT endpoint ใช้ spread ที่จำกัดเฉพาะ status, notes, assignedTo  
**ผล:** ส่ง `{"name":"HACKED"}` → ไม่เปลี่ยน (ป้องกันได้ดี)  
**หมายเหตุ:** นี่เป็นจุดที่ดีของระบบ แต่ควรมี explicit whitelist + error response

### 14. Audit Log userId ใช้ complaint ID เป็น fallback
**ปัญหา:** ถ้าไม่มี admin user → `userId = newComplaint.id` ซึ่งไม่ใช่ user ID จริง  
**ผลกระทบ:** Foreign key constraint อาจล้มเหลว หรือ audit log ไม่ถูกต้อง

---

## ✅ สิ่งที่ระบบทำได้ดี

| รายการ | สถานะ |
|--------|--------|
| SQL Injection ป้องกันได้ (Prisma ORM) | ✅ |
| PUT จำกัด fields ที่แก้ไขได้ | ✅ |
| React auto-escape ป้องกัน XSS เบื้องต้น | ✅ |
| Audit log บันทึกทุก action | ✅ |
| Empty string validation | ✅ |
| Error handling ไม่ crash server | ✅ |

---

## 🎯 แนะนำลำดับการแก้ไข

| ลำดับ | รายการ | ความยาก |
|-------|--------|---------|
| 1 | เพิ่ม Auth middleware บน PUT/DELETE API | ⭐⭐ |
| 2 | Validate status enum | ⭐ |
| 3 | Input sanitization + length limits | ⭐⭐ |
| 4 | แก้ ticket number generation (UUID/retry) | ⭐ |
| 5 | Phone/Type validation | ⭐ |
| 6 | Trim whitespace | ⭐ |
| 7 | Rate limiting | ⭐⭐ |
| 8 | แยก public/private API | ⭐⭐ |
| 9 | แก้ image upload เป็น file upload จริง | ⭐⭐⭐ |
