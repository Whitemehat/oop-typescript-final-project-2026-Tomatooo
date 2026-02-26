# Data Model — Library Management System

Model Set: **9 — Library Management System**

---

## Book

เก็บข้อมูลหนังสือในห้องสมุด

| Field | Type | คำอธิบาย |
|-------|------|----------|
| id | number | รหัสหนังสือ (auto increment) |
| name | string | ชื่อหนังสือ |
| author | string | ชื่อผู้แต่ง |
| category | BookCategory | หมวดหมู่ (enum) |
| language | string | ภาษาของหนังสือ |
| date | string | วันที่วางจำหน่าย |
| isbn | string | รหัส ISBN |
| publisher | string | สำนักพิมพ์ |
| totalPages | number | จำนวนหน้าทั้งหมด |
| availableCopies | number | จำนวนเล่มที่พร้อมให้ยืม |
| totalCopies | number | จำนวนเล่มทั้งหมด |
| description | string | คำอธิบายเนื้อหา |

### BookCategory Enum

```typescript
enum BookCategory {
  FICTION    = 'fiction'
  NON_FICTION = 'non-fiction'
  HORROR     = 'horror'
  SCIFI      = 'sci-fi'
  HISTORY    = 'history'
  FANTASY    = 'fantasy'
  ADVENTURE  = 'adventure'
  COMEDY     = 'comedy'
}
```

---

## Member

เก็บข้อมูลสมาชิกห้องสมุด

| Field | Type | คำอธิบาย |
|-------|------|----------|
| id | number | รหัสสมาชิก (auto increment) |
| firstName | string | ชื่อจริง |
| lastName | string | นามสกุล |
| email | string | อีเมล |
| phone | string | เบอร์โทร |
| role | MemberRole | ประเภทสมาชิก (enum) |
| address | string | ที่อยู่ |
| dateOfBirth | string | วันเกิด |
| memberSince | string | วันที่สมัครสมาชิก |
| isActive | boolean | สถานะใช้งาน |
| borrowedBooks | number[] | รายการ id หนังสือที่ยืมอยู่ |
| maxBorrowLimit | number | จำนวนเล่มที่ยืมได้สูงสุด |

### MemberRole Enum

```typescript
enum MemberRole {
  STUDENT = 'student'
  ADMIN   = 'admin'
  GUEST   = 'guest'
}
```

> หมายเหตุ: เมื่อสมัครสมาชิกใหม่ role จะถูก set เป็น `student` เสมอ ไม่สามารถเลือกเองได้

---

## ความสัมพันธ์

```
Book (1) ←——— (N) Member.borrowedBooks
```

Member เก็บ array ของ book id ที่ยืมไว้ใน `borrowedBooks`
