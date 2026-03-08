# API Specification — Library Management System

> Base URL: http://localhost:3000

**Authorization:** ระบบใช้ HTTP Headers แทน JWT
- `role` — ระบุสิทธิ์ (`admin` / `member` / `guest`)

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

### GET /book
ดึงข้อมูลหนังสือทั้งหมด ใครก็ดูได้ ไม่ต้องมี header

**Response 200**
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

### GET /book/search
ค้นหาหนังสือด้วย **ชื่อ** (partial match, case-insensitive) หรือ **ID** (ตัวเลข) ใครก็ค้นได้

**Query Parameter:** `query` — ชื่อหนังสือ หรือ id

**Response 200** — พร้อม message บอกผลการค้นหา
```json
{
  "success": true,
  "message": "Found 2 book(s): [ID 1] The Great Gatsby by F. Scott Fitzgerald, [ID 2] Dune by Frank Herbert",
  "data": [ { "id": 1, ... }, { "id": 2, ... } ]
}
```

หรือถ้าไม่เจอ:

```json
{
  "success": true,
  "message": "No data found",
  "data": []
}
```

---

### POST /book
เพิ่มหนังสือใหม่เข้าสู่ระบบ

**Access control:** `Admin`
**Headers:** `role: admin`

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

> **Category ที่รองรับ (BookCategory):** `fiction`, `non-fiction`, `horror`, `sci-fi`, `history`, `fantasy`, `adventure`, `comedy`

**Response 201**
```json
{
  "success": true,
  "message": "Request successful",
  "data": { "id": 2, "name": "...", ... }
}
```

**Response 400** — ข้อมูลไม่ครบถ้วน หรือประเภทข้อมูลไม่ถูกต้อง


**Response 403** — ไม่ใช่ admin
```json
{ "success": false, "message": "Access denied: Admin role required", "data": null }
```

---

### PATCH /book/:query
แก้ข้อมูลหนังสือบางส่วน

**Access control:** `Admin`
**Headers:** `role: admin`

**Path Parameter:** `:query` — ID (ตัวเลข) หรือชื่อหนังสือ (exact match) เช่น `"3"` หรือ `"Dune"`

**Request Body:** ส่งเฉพาะ field ที่ต้องการแก้ได้
```json
{
  "star": 5,
  "isRent": true
}
```

**Response 200** — คืนข้อมูลหนังสือที่แก้ไขแล้ว พร้อม message
```json
{
  "success": true,
  "message": "Updated Book ID 3 Successfully",
  "data": { "id": 3, ... }
}
```

**Response 400** — ข้อมูลไม่ถูกต้อง หรือ `:query` ตรงกับหนังสือมากกว่า 1 เล่ม (ambiguous)

**Response 403** — ไม่ใช่ admin

**Response 404** — ไม่พบหนังสือที่ระบุ

---

### PUT /book/:query
แก้ไขและแทนที่ข้อมูลหนังสือแบบยกชุด (Full Update)

**Access control:** `Admin`
**Headers:** `role: admin`

**Path Parameter:** `:query` — ID (ตัวเลข) หรือชื่อหนังสือ (exact match)

**Request Body:** เหมือน POST /book (ทุก field required)
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

**Response 200** — คืนข้อมูลหนังสือที่แทนที่แล้ว พร้อม message
```json
{
  "success": true,
  "message": "Replaced Book ID 3 Successfully",
  "data": { "id": 3, ... }
}
```

**Response 400** | **403** | **404**

---

### DELETE /book/:query
ลบข้อมูลหนังสือออกจากระบบอย่างถาวร

> **หมายเหตุ:** หลังจากลบแล้ว ระบบจะ **resequence id** ของหนังสือที่เหลืออยู่ให้ต่อเนื่องใหม่ (1, 2, 3, ...)
> และอัปเดต `borrowedBooks` ของ member ทุกคนให้สอดคล้องกับ id ใหม่โดยอัตโนมัติ

**Access control:** `Admin`
**Headers:** `role: admin`

**Path Parameter:** `:query` — ID (ตัวเลข) หรือชื่อหนังสือ (exact match)

**Response 200**
```json
{
  "success": true,
  "message": "Deleted Book ID 3 Successfully",
  "data": null
}
```

**Response 403** | **404**

---

## Member Module — `/member`

### POST /member
สมัครสมาชิกใหม่ ใครก็ทำได้ ไม่ต้องมี header

> **หมายเหตุ:**
> - `role` จะถูก force เป็น `member` เสมอ, `memberSince` ถูก auto-set เป็นวันนี้, `borrowedBooks` เริ่มต้นเป็น `[]` — ทั้งหมดนี้ไม่ต้องส่งใน body
> - **email ต้องไม่ซ้ำ** กับ member คนอื่นที่มีอยู่แล้ว

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
    "role": "member",
    "memberSince": "2026-02-26",
    "borrowedBooks": [],
    ...
  }
}
```

**Response 400** — Validation error

**Response 409 (Conflict)** — Email นี้ถูกใช้ไปแล้ว
```json
{ "success": false, "message": "Email is already in use", "data": null }
```

---

### GET /member
ดูสมาชิกทั้งหมด เฉพาะ admin

**Headers:** `role: admin`

**Response 200** — คืน array ของสมาชิกทั้งหมด

**Response 403** — ไม่ใช่ admin

---

### GET /member/search
ค้นหา member ด้วย **ชื่อ** (firstName/lastName, partial match) หรือ **ID** (ตัวเลข) เฉพาะ admin

**Headers:** `role: admin`

**Query Parameter:** `query` — ชื่อ หรือ id

**Response 200** — พร้อม message บอกผลการค้นหา
```json
{
  "success": true,
  "message": "Found 1 member(s): [ID 2] John Doe (john@example.com)",
  "data": [ { "id": 2, ... } ]
}
```

หรือถ้าไม่เจอ:
```json
{
  "success": true,
  "message": "No data found",
  "data": []
}
```

**Response 403** — ไม่ใช่ admin

---

### PATCH /member/:query
แก้ข้อมูลสมาชิกบางส่วน เฉพาะ admin

**Headers:** `role: admin`

**Path Parameter:** `:query` — ID (ตัวเลข) หรือชื่อสมาชิก (exact match) เช่น `"2"` หรือ `"John Doe"`

**Request Body:** field ใดก็ได้จาก CreateMemberDto (optional ทั้งหมด)
```json
{
  "isActive": false,
  "maxBorrowLimit": 5
}
```

**Response 200** — พร้อม message
```json
{
  "success": true,
  "message": "Updated Member ID 2 Successfully",
  "data": { "id": 2, ... }
}
```

**Response 400** | **403** | **404**

---

### PUT /member/:query
แทนข้อมูลสมาชิกทั้งหมด เฉพาะ admin

> **หมายเหตุ:** `role`, `memberSince`, `borrowedBooks` จะถูก **preserve** ไว้เสมอ (system-managed fields)
> แม้ไม่ได้ส่งมาใน body ค่าเหล่านี้จะไม่หาย

**Headers:** `role: admin`

**Path Parameter:** `:query` — ID (ตัวเลข) หรือชื่อสมาชิก (exact match)

**Request Body:** เหมือน POST /member (ทุก field required)

**Response 200** — พร้อม message
```json
{
  "success": true,
  "message": "Replaced Member ID 2 Successfully",
  "data": { "id": 2, ... }
}
```

**Response 400** | **403** | **404**

---

### DELETE /member/:query
ลบสมาชิกออกจากระบบ เฉพาะ admin

> **หมายเหตุ:** หลังจากลบแล้ว ระบบจะ **resequence id** ของสมาชิกที่เหลือให้ต่อเนื่องใหม่ (1, 2, 3, ...)

**Headers:** `role: admin`

**Path Parameter:** `:query` — ID (ตัวเลข) หรือชื่อสมาชิก (exact match)

**Response 200**
```json
{
  "success": true,
  "message": "Deleted Member ID 2 Successfully",
  "data": null
}
```

**Response 403** | **404**

---

### POST /member/:id/borrow/:bookId
ยืมหนังสือ — sync `book.isRent = true` และเพิ่ม bookId ใน `member.borrowedBooks`

- `admin` — ยืมหนังสือให้สมาชิกคนไหนก็ได้
- `member` — ยืมได้ (ระบุ `:id` ของสมาชิกที่ต้องการยืม)
- `guest` — **ไม่มีสิทธิ์ยืมหนังสือ**

**Headers:** `role: admin` หรือ `role: member`

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

**Response 403** — ไม่มีสิทธิ์ (guest) / member ไม่ active / เกิน borrow limit

**Response 404** — ไม่พบ member / ไม่พบหนังสือ

---

### POST /member/:id/return/:bookId
คืนหนังสือ — sync `book.isRent = false` และลบ bookId ออกจาก `member.borrowedBooks`

- `admin` — คืนหนังสือแทนสมาชิกคนไหนก็ได้
- `member` — คืนได้ (ระบุ `:id` ของสมาชิกที่ต้องการคืน)
- `guest` — **ไม่มีสิทธิ์คืนหนังสือ**

**Headers:** `role: admin` หรือ `role: member`

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

## 👤 Member Profile Module — `/member`

### PATCH /member/:id/profile
แก้ไขข้อมูลส่วนตัวสมาชิก เฉพาะ member หรือ admin

**Headers:** `role: member` หรือ `role: admin`

**Path Parameter:** `:id` — ID ของสมาชิกที่ต้องการแก้ไข

**Request Body (optional fields):**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "dateOfBirth": "YYYY-MM-DD"
}
```

> **หมายเหตุ:** ไม่สามารถแก้ไข `role`, `isActive`, `maxBorrowLimit`, `borrowedBooks` ผ่าน endpoint นี้ได้

**Response 200**
```json
{
  "success": true,
  "message": "Updated Member ID 1 Successfully",
  "data": { "id": 1, "firstName": "...", ... }
}
```

**Response 403** — guest ไม่มีสิทธิ์

**Response 404** — ไม่พบสมาชิก

**Response 409** — email ใหม่ซ้ำกับ member คนอื่น

---

## HTTP Status Codes สรุป

| Code | ความหมาย | ตัวอย่าง |
|------|----------|---------|
| 200 | สำเร็จ | GET, PUT, PATCH, DELETE, borrow, return |
| 201 | สร้างสำเร็จ | POST /book, POST /member |
| 400 | ข้อมูลไม่ถูกต้อง | field ขาด, type ผิด, หนังสือถูกยืมแล้ว |
| 403 | ไม่มีสิทธิ์ | role ไม่ใช่ admin, guest พยายามยืม/คืน, member ไม่ active |
| 404 | ไม่พบข้อมูล | id ไม่มีในระบบ |
| 409 | ข้อมูลซ้ำ | email ซ้ำ |
| 500 | Server error | error ที่ไม่คาดคิด |
