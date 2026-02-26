# API Specification — Library Management System

Base URL: `http://localhost:3000`

Response format ทุก endpoint:
```json
{
  "success": boolean,
  "message": string,
  "data": T | null
}
```

---

## Book `/book`

### GET /book
ดึงหนังสือทั้งหมด ไม่ต้องมี header

**Response 200**
```json
{
  "success": true,
  "message": "Request successfull",
  "data": [ { ...Book } ]
}
```

---

### GET /book/:id
ดึงหนังสือตาม id

**Response 200**
```json
{ "success": true, "message": "Request successfull", "data": { ...Book } }
```
**Response 404** — ไม่เจอ id
```json
{ "success": false, "message": "Book not found", "data": null }
```

---

### POST /book
เพิ่มหนังสือใหม่

**Headers:** `role: admin`

**Body:**
```json
{
  "name": "string",
  "author": "string",
  "category": "fiction | non-fiction | horror | sci-fi | history | fantasy | adventure | comedy",
  "language": "string",
  "date": "string",
  "isbn": "string",
  "publisher": "string",
  "totalPages": 0,
  "availableCopies": 0,
  "totalCopies": 0,
  "description": "string"
}
```

**Response 201**
```json
{ "success": true, "message": "Request successfull", "data": { ...Book } }
```
**Response 400** — validation error
**Response 403** — ไม่ใช่ admin

---

### PATCH /book/:id
แก้ข้อมูลบางส่วน

**Headers:** `role: admin`

**Body:** field ใดก็ได้ (optional ทั้งหมด)

**Response 200** | **404** | **403**

---

### PUT /book/:id
แทนข้อมูลทั้งหมด

**Headers:** `role: admin`

**Body:** เหมือน POST ครบทุก field

**Response 200** | **404** | **403**

---

### DELETE /book/:id
ลบหนังสือ

**Headers:** `role: admin`

**Response 200**
```json
{ "success": true, "message": "Request successfull", "data": null }
```
**Response 404** | **403**

---

## Member `/member`

### GET /member
ดูสมาชิกทั้งหมด

**Headers:** `role: admin`

**Response 200** | **403**

---

### GET /member/:id
ดูสมาชิกตาม id

**Headers:** `role: admin` หรือ `memberId: {id}`

**Response 200** | **403** | **404**

---

### POST /member
สมัครสมาชิก ใครก็ทำได้ role ถูก force เป็น student

**Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "role": "student | admin | guest",
  "address": "string",
  "dateOfBirth": "string",
  "memberSince": "string",
  "isActive": true,
  "borrowedBooks": [],
  "maxBorrowLimit": 0
}
```

> หมายเหตุ: field `role` ใน body จะถูกทับด้วย `student` เสมอ

**Response 201** | **400**

---

### PATCH /member/:id
แก้ข้อมูลสมาชิกบางส่วน

**Headers:** `role: admin`

**Response 200** | **403** | **404**

---

### PUT /member/:id
แทนข้อมูลสมาชิกทั้งหมด

**Headers:** `role: admin`

**Response 200** | **403** | **404**

---

### DELETE /member/:id
ลบสมาชิก

**Headers:** `role: admin`

**Response 200** | **403** | **404**

---

## HTTP Status Codes

| Code | ความหมาย |
|------|----------|
| 200 | สำเร็จ (GET, PUT, PATCH, DELETE) |
| 201 | สร้างข้อมูลสำเร็จ (POST) |
| 400 | ข้อมูลที่ส่งมาไม่ถูกต้อง |
| 403 | ไม่มีสิทธิ์ |
| 404 | ไม่พบข้อมูล |
| 500 | ข้อผิดพลาดของ server |
