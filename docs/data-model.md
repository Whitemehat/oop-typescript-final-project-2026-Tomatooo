# Data Model — Library Management System

**Model Set:** 9 — Library Management System
**sumStudentId:** 272040809 (272040809 mod 10 = 9)

ระบบมี 2 data model หลัก: `Book` และ `Member`
ข้อมูลทั้งหมดถูกเก็บในไฟล์ JSON ที่ `data/books.json` และ `data/members.json`

---

## Book

เก็บข้อมูลหนังสือแต่ละเล่มในห้องสมุด

```typescript
interface Book {
    id: number;
    name: string;
    author: string;
    category: BookCategory;
    language: string;
    uploadDate: string;
    isRent: boolean;
    star: number;
    review: string[];
    isEarlyAccess: boolean;
}
```

### Fields

| Field | Type | คำอธิบาย | หมายเหตุ |
|-------|------|----------|---------|
| `id` | `number` | รหัสหนังสือ (primary key) | Auto-increment, ระบบ set ให้อัตโนมัติ |
| `name` | `string` | ชื่อหนังสือ | |
| `author` | `string` | ชื่อผู้แต่ง | |
| `category` | `BookCategory` | หมวดหมู่ | ต้องเป็นค่าใน `BookCategory` enum เท่านั้น |
| `language` | `string` | ภาษาของหนังสือ | เช่น "Thai", "English" |
| `uploadDate` | `string` | วันที่เพิ่มเข้าระบบ | รูปแบบ `YYYY-MM-DD` |
| `isRent` | `boolean` | เล่มนี้ถูกยืมอยู่หรือไม่ | `true` = ถูกยืม, `false` = ว่าง — ถูก sync อัตโนมัติโดย borrow/return |
| `star` | `number` | คะแนน/rating | |
| `review` | `string[]` | รายการ review จากผู้อ่าน | array ของ string |
| `isEarlyAccess` | `boolean` | เป็น early access หรือไม่ | |

### BookCategory Enum

```typescript
enum BookCategory {
    FICTION     = 'fiction'
    NON_FICTION = 'non-fiction'
    HORROR      = 'horror'
    SCIFI       = 'sci-fi'
    HISTORY     = 'history'
    FANTASY     = 'fantasy'
    ADVENTURE   = 'adventure'
    COMEDY      = 'comedy'
}
```

### ตัวอย่างข้อมูล

```json
{
  "id": 1,
  "name": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "category": "fiction",
  "language": "English",
  "uploadDate": "2024-01-15",
  "isRent": false,
  "star": 4,
  "review": ["เล่มดีมาก", "แนะนำ"],
  "isEarlyAccess": false
}
```

---

## Member

เก็บข้อมูลสมาชิกห้องสมุด

```typescript
interface Member {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: MemberRole;
    address: string;
    dateOfBirth: string;
    memberSince: string;
    isActive: boolean;
    borrowedBooks: number[];
    maxBorrowLimit: number;
}
```

### Fields

| Field | Type | คำอธิบาย | หมายเหตุ |
|-------|------|----------|---------|
| `id` | `number` | รหัสสมาชิก (primary key) | Auto-increment, ระบบ set ให้อัตโนมัติ |
| `firstName` | `string` | ชื่อจริง | |
| `lastName` | `string` | นามสกุล | |
| `email` | `string` | อีเมล | |
| `phone` | `string` | เบอร์โทร | |
| `role` | `MemberRole` | ประเภทสมาชิก | **System-managed** — set เป็น `student` อัตโนมัติตอนสมัคร |
| `address` | `string` | ที่อยู่ | |
| `dateOfBirth` | `string` | วันเกิด | รูปแบบ `YYYY-MM-DD` |
| `memberSince` | `string` | วันที่สมัครสมาชิก | **System-managed** — auto-set เป็นวันปัจจุบัน ตอนสมัคร |
| `isActive` | `boolean` | สถานะใช้งาน | ต้อง `true` ถึงยืมหนังสือได้ |
| `borrowedBooks` | `number[]` | รายการ `id` ของหนังสือที่ยืมอยู่ | **System-managed** — sync อัตโนมัติโดย borrow/return |
| `maxBorrowLimit` | `number` | จำนวนเล่มสูงสุดที่ยืมได้พร้อมกัน | กำหนดตอนสมัคร |

> **System-managed fields** คือ field ที่ระบบจัดการให้อัตโนมัติ ไม่ต้องส่งใน request body และจะไม่ถูกลบเมื่อทำ PUT

### MemberRole Enum

```typescript
enum MemberRole {
    STUDENT = 'student'
    ADMIN   = 'admin'
    GUEST   = 'guest'
}
```

> role สามารถเปลี่ยนได้ผ่าน PATCH `/member/:id` โดย admin เท่านั้น

### ตัวอย่างข้อมูล

```json
{
  "id": 1,
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "email": "somchai@example.com",
  "phone": "0812345678",
  "role": "student",
  "address": "123 ถ.สุขุมวิท กทม.",
  "dateOfBirth": "2000-05-20",
  "memberSince": "2026-02-26",
  "isActive": true,
  "borrowedBooks": [1, 3],
  "maxBorrowLimit": 3
}
```

---

## ความสัมพันธ์ระหว่าง Book และ Member

```
Member (1) ──< borrowed (N) Book
```

- Member เก็บ `borrowedBooks: number[]` ซึ่งเป็น array ของ `Book.id`
- เมื่อ **ยืมหนังสือ** (`borrow`): `book.isRent = true` และ `member.borrowedBooks.push(bookId)`
- เมื่อ **คืนหนังสือ** (`return`): `book.isRent = false` และ `member.borrowedBooks` ลบ bookId ออก
- ความสัมพันธ์นี้เป็นแบบ **many-to-many** (member ยืมได้หลายเล่ม แต่หนังสือ 1 เล่มยืมได้ทีละคน เพราะ `isRent` เป็น boolean)

---

## File Storage

```
data/
├── books.json     # เก็บหนังสือทั้งหมด (array of Book)
└── members.json   # เก็บสมาชิกทั้งหมด (array of Member)
```

ถ้าไฟล์ยังไม่มี ระบบจะ treat เป็น array เปล่าและสร้างไฟล์เมื่อมีข้อมูลใหม่
