# API Specification — Library Management System

> Base URL: http://localhost:3000

**Authorization:** ระบบใช้ HTTP Headers แทน JWT
- `role` — ระบุสิทธิ์ (`admin` / `student` / `guest`)
- `memberId` — ระบุตัวตน member (ใช้เฉพาะ endpoint บางตัว)

**Response Format:** ทุก endpoint ใช้รูปแบบนี้เสมอ

```json
{
  "success": true,
  "message": "Request successful",
  "data": { ... }
}
```
หรือ

```json
{
  "success": false,
  "message": "คำอธิบาย error",
  "data": null
}
```

---

## 📚 Book Module — `/book`

### 🔴 GET /book
ดึงข้อมูลหนังสือทั้งหมด

**Response :**
* **200 (OK) :**  ดึงข้อมูลรายการหนังสือทั้งหมดสำเร็จ
```json
{
  "success": true,
  "message": "Request successful",
  "data": [
    {
      "id": 1,
      "name": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "category": "fiction",
      "language": "English",
      "uploadDate": "2024-01-15",
      "isRent": false,
      "star": 4,
      "review": ["เล่มนี้ดีมาก", "แนะนำเลย"],
      "isEarlyAccess": false
    }
  ]
}
```

---

### 🔴 GET /book/:id
ดึงหนังสือตาม ID ที่ระบุ

**Path Parameter:** `id` — รหัสหนังสือ (number)

**Response :**
* **200 (OK) :** ดึงข้อมูลหนังสือสำเร็จ
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "id": 1,
    "name": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "category": "fiction",
    "language": "English",
    "uploadDate": "2024-01-15",
    "isRent": false,
    "star": 4,
    "review": ["เล่มนี้ดีมาก"],
    "isEarlyAccess": false
  }
}
```

* **404 (Not Found) :** ไม่พบหนังสือที่ระบุจาก ID
```json
{ "success": false, "message": "Book not found", "data": null }
```

---

### 🔴 POST /book
เพิ่มหนังสือใหม่เข้าสู่ระบบ

**Access control :** `Admin`
**Headers :** `role: admin`

**Request Body:**
```json
{
  "name": "string",
  "author": "string",
  "category": "BookCategory",
  "language": "string",
  "uploadDate": "YYYY-MM-DD",
  "isRent": false,
  "star": 0,
  "review": ["string"],
  "isEarlyAccess": false
}
```

| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| name | string | ✅ | ชื่อหนังสือ |
| author | string | ✅ | ชื่อผู้แต่ง |
| category | enum (BookCategory) | ✅ | หมวดหมู่ |
| language | string | ✅ | ภาษาของหนังสือ |
| uploadDate | string | ✅ | วันที่เพิ่มเข้าระบบ |
| isRent | boolean | ✅ | สถานะการถูกยืม |
| star | number | ✅ | คะแนน |
| review | string[] | ✅ | รายการ review |
| isEarlyAccess | boolean | ✅ | หนังสือ early access หรือไม่ |

> **Category Support (BookCategory) :** `Fiction`,` Non-fiction`, `Horror`,` Sci-fi`, `History, Fantasy`,` Adventure, Comedy`

**Response :**
* **201 (created) :** เพิ่มหนังสือเข้าสู่ระบบสำเร็จ
```json
{
  "success": true,
  "message": "Request successful",
  "data": { "id": 2, "name": "...", ... }
}
```

* **400 (Bad Request)**  
> **Cause:** ข้อมูลไม่ครบถ้วน (Missing required fields) หรือประเภทข้อมูลไม่ถูกต้อง (Invalid data types)
```json
{ "success": false, "message": "...", "data": null }
```

* **403 (Forbidden)**
> **Cause :** สิทธิ์การเข้าถึงไม่เพียงพอ (Access denied: Admin role required)
```json
{ "success": false, "message": "Permission denied", "data": null }
```

---

### 🔴 PATCH /book/:id
แก้ข้อมูลหนังสือบางส่วน

**Access control :** `Admin`
**Headers :** `role: admin`

**Path Parameter:** `id` — รหัสหนังสือ

**Request Body:** 
> Optional: สามารถส่งเฉพาะ Field ที่ต้องการอัปเดตได้

```json
{
  "star": 5,
  "isRent": true
}
```

**Response :**

* **200 (OK) :** อัปเดตข้อมูลสำเร็จ และคืนข้อมูลหนังสือที่แก้ไขแล้ว
* **400 (Bad Request) :** ข้อมูลที่ส่งมาไม่ถูกต้อง
* **403 (Forbidden) :** สิทธิ์การเข้าถึงไม่เพียงพอ (Access denied: Admin role required)
* **404 (Not Found) :** ไม่พบหนังสือที่ระบุจาก ID (Book not found)

---

### 🔴 PUT /book/:id
แก้ไขและแทนที่ข้อมูลหนังสือแบบยกชุด (Full Update) โดยอ้างอิงจาก ID ที่ระบุ


**Access control :** `Admin`
**Headers :** `role: admin`


**Path Parameter:**  `id` — รหัสหนังสือ

**Request Body:** เหมือน POST /book 

```json
{

"name": "string",

"author": "string",

"category": "BookCategory",

"language": "string",

"uploadDate": "YYYY-MM-DD",

"isRent": false,

"star": 0,

"review": ["string"],

"isEarlyAccess": false

}
```
>ฟิลด์ `category` ให้ระบุค่าตาม enum **BookCategory** เท่านั้น (ได้แก่: `Fiction`, `Non-fiction`, `Horror`, `Sci-fi`, `History`, `Fantasy`, `Adventure`, `Comedy`)

**Response :**

* **200 (OK) :** อัปเดตข้อมูลสำเร็จ และคืนข้อมูลหนังสือที่แก้ไขแล้ว
* **400 (Bad Request) :** ข้อมูลที่ส่งมาไม่ถูกต้อง หรือ Field ไม่ครบตามที่กำหนด
* **403 (Forbidden) :** สิทธิ์การเข้าถึงไม่เพียงพอ (Access denied: Admin role required)
* **404 (Not Found) :** ไม่พบหนังสือที่ระบุจาก ID 

---

### 🔴 DELETE /book/:id
ลบข้อมูลหนังสือออกจากระบบอย่างถาวร โดยระบุผ่าน ID ที่ต้องการลบ

**Access control :** `Admin`
**Headers :** `role: admin`

**Path Parameter:**  `id` — รหัสหนังสือ


**Response :**
* **200 (OK) :** ลบข้อมูลสำเร็จ
```json
{ "success": true, "message": "Request successful", "data": null }
```

* **403 (Forbidden) :** สิทธิ์การเข้าถึงไม่เพียงพอ (Access denied: Admin role required)
* **404 (Not Found) :** ไม่พบหนังสือที่ระบุจาก ID 

---

## Member Module — `/member`

### POST /member
สมัครสมาชิกใหม่ ใครก็ทำได้ ไม่ต้องมี header

> **หมายเหตุ:** `role` จะถูก force เป็น `student` เสมอ, `memberSince` ถูก auto-set เป็นวันนี้,
> `borrowedBooks` เริ่มต้นเป็น `[]` ทั้งหมดนี้ไม่ต้องส่งใน body

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "isActive": true,
  "maxBorrowLimit": 3
}
```

| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| firstName | string | ✅ | ชื่อจริง |
| lastName | string | ✅ | นามสกุล |
| email | string | ✅ | อีเมล |
| phone | string | ✅ | เบอร์โทร |
| address | string | ✅ | ที่อยู่ |
| dateOfBirth | string | ✅ | วันเกิด (YYYY-MM-DD) |
| isActive | boolean | ✅ | สถานะใช้งาน |
| maxBorrowLimit | number | ✅ | จำนวนเล่มที่ยืมได้สูงสุด |

**Response 201**
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "id": 1,
    "firstName": "สมชาย",
    "role": "student",
    "memberSince": "2026-02-26",
    "borrowedBooks": [],
    ...
  }
}
```

**Response 400** — Validation error

---

### GET /member
ดูสมาชิกทั้งหมด เฉพาะ admin

**Headers:**
```
role: admin
```

**Response 200** — คืน array ของสมาชิกทั้งหมด
**Response 403** — ไม่ใช่ admin

---

### GET /member/:id
ดูสมาชิกตาม ID

- `admin` — ดูสมาชิกคนไหนก็ได้
- ไม่ใช่ admin — ต้องส่ง `memberId` header ตรงกับ `:id` ที่ขอ

**Headers:**
```
role: admin
```
หรือ
```
role: student
memberId: 5
```

**Response 200** — คืนข้อมูล member
**Response 403** — ไม่มีสิทธิ์ (ไม่ใช่ admin และ memberId ไม่ตรง)
**Response 404** — ไม่พบสมาชิก

---

### PATCH /member/:id
แก้ข้อมูลสมาชิกบางส่วน เฉพาะ admin

**Headers:**
```
role: admin
```

**Request Body:** field ใดก็ได้จาก CreateMemberDto (optional ทั้งหมด)
```json
{
  "isActive": false,
  "maxBorrowLimit": 5
}
```

**Response 200** | **400** | **403** | **404**

---

### PUT /member/:id
แทนข้อมูลสมาชิกทั้งหมด เฉพาะ admin

> **หมายเหตุ:** `role`, `memberSince`, `borrowedBooks` จะถูก **preserve** ไว้เสมอ (system-managed fields)
> แม้ไม่ได้ส่งมาใน body ค่าเหล่านี้จะไม่หาย

**Headers:**
```
role: admin
```

**Request Body:** เหมือน POST /member (ทุก field required)

**Response 200** | **400** | **403** | **404**

---

### DELETE /member/:id
ลบสมาชิกออกจากระบบ เฉพาะ admin

**Headers:**
```
role: admin
```

**Response 200**
```json
{ "success": true, "message": "Request successfull", "data": null }
```

**Response 403** | **404**

---

### POST /member/:id/borrow/:bookId
ยืมหนังสือ — sync `book.isRent = true` และเพิ่ม bookId ใน `member.borrowedBooks`

- `admin` — ยืมหนังสือให้สมาชิกคนไหนก็ได้
- ไม่ใช่ admin — ต้องส่ง `memberId` header ตรงกับ `:id`

**Headers:**
```
role: admin
```
หรือ
```
role: student
memberId: 5
```

**Path Parameters:**
- `:id` — รหัส member ที่ยืม
- `:bookId` — รหัสหนังสือที่ต้องการยืม

**Validation ที่ระบบตรวจ:**
- member ต้องมีอยู่ในระบบ
- member ต้องมี `isActive: true`
- จำนวนหนังสือที่ยืมอยู่ต้องไม่เกิน `maxBorrowLimit`
- member ต้องไม่ได้ยืมหนังสือเล่มนี้อยู่แล้ว
- book ต้องมีอยู่ในระบบ
- book ต้องมี `isRent: false` (ยังไม่ถูกยืม)

**Response 200** — คืน member ที่อัปเดตแล้ว (borrowedBooks มี bookId เพิ่มขึ้น)

**Response 400** — หนังสือถูกยืมแล้ว / member ยืมเล่มนี้อยู่แล้ว
```json
{ "success": false, "message": "Book is already rented", "data": null }
```

**Response 403** — ไม่มีสิทธิ์ / member ไม่ active / เกิน borrow limit
**Response 404** — ไม่พบ member / ไม่พบหนังสือ

---

### POST /member/:id/return/:bookId
คืนหนังสือ — sync `book.isRent = false` และลบ bookId ออกจาก `member.borrowedBooks`

- `admin` — คืนหนังสือแทนสมาชิกคนไหนก็ได้
- ไม่ใช่ admin — ต้องส่ง `memberId` header ตรงกับ `:id`

**Headers:**
```
role: admin
```
หรือ
```
role: student
memberId: 5
```

**Path Parameters:**
- `:id` — รหัส member ที่คืน
- `:bookId` — รหัสหนังสือที่ต้องการคืน

**Validation ที่ระบบตรวจ:**
- member ต้องมีอยู่ในระบบ
- book ต้องอยู่ใน `member.borrowedBooks` (member ต้องเป็นคนยืมเล่มนี้)
- book ต้องมีอยู่ในระบบ

**Response 200** — คืน member ที่อัปเดตแล้ว (bookId ถูกลบออกจาก borrowedBooks)

**Response 400** — member ไม่ได้ยืมหนังสือเล่มนี้
```json
{ "success": false, "message": "This book is not borrowed by this member", "data": null }
```

**Response 403** | **404**

---

## HTTP Status Codes สรุป

| Code | ความหมาย | ตัวอย่าง |
|------|----------|---------|
| 200 | สำเร็จ | GET, PUT, PATCH, DELETE, borrow, return |
| 201 | สร้างสำเร็จ | POST /book, POST /member |
| 400 | ข้อมูลไม่ถูกต้อง | field ขาด, type ผิด, หนังสือถูกยืมแล้ว |
| 403 | ไม่มีสิทธิ์ | role ไม่ใช่ admin, memberId ไม่ตรง, member ไม่ active |
| 404 | ไม่พบข้อมูล | id ไม่มีในระบบ |
| 500 | Server error | error ที่ไม่คาดคิด |
