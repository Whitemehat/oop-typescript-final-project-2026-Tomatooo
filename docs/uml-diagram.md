# UML Diagram — Library Management System

---

## 1. Class Diagram — Data Models

แสดงโครงสร้างข้อมูลหลักและความสัมพันธ์

```mermaid
classDiagram
    class BookCategory {
        <<enumeration>>
        FICTION = fiction
        NON_FICTION = non-fiction
        HORROR = horror
        SCIFI = sci-fi
        HISTORY = history
        FANTASY = fantasy
        ADVENTURE = adventure
        COMEDY = comedy
    }

    class MemberRole {
        <<enumeration>>
        STUDENT = student
        ADMIN = admin
        GUEST = guest
    }

    class Book {
        <<interface>>
        +number id
        +string name
        +string author
        +BookCategory category
        +string language
        +string uploadDate
        +boolean isRent
        +number star
        +string[] review
        +boolean isEarlyAccess
    }

    class Member {
        <<interface>>
        +number id
        +string firstName
        +string lastName
        +string email
        +string phone
        +MemberRole role
        +string address
        +string dateOfBirth
        +string memberSince
        +boolean isActive
        +number[] borrowedBooks
        +number maxBorrowLimit
    }

    Book --> BookCategory : uses
    Member --> MemberRole : uses
    Member "1" --> "0..*" Book : borrows via borrowedBooks[]
```

---

## 2. Class Diagram — Architecture (Controllers & Services)

แสดงโครงสร้าง NestJS modules, controllers, และ services

```mermaid
classDiagram
    class BookController {
        -BookService bookService
        +findAll() Book[]
        +findOne(id) Book
        +create(dto, role) Book
        +update(id, dto, role) Book
        +replace(id, dto, role) Book
        +remove(id, role) void
    }

    class BookService {
        -string filePath
        -readFile() Book[]
        -writeFile(data) void
        +findAll() Book[]
        +findOne(id) Book
        +create(dto, role) Book
        +update(id, dto, role) Book
        +replace(id, dto, role) Book
        +remove(id, role) void
        +setRentStatus(id, isRent) Book
    }

    class MemberController {
        -MemberService memberService
        +create(dto) Member
        +findAll(role) Member[]
        +findOne(id, role, memberId) Member
        +update(id, dto, role) Member
        +replace(id, dto, role) Member
        +remove(id, role) void
        +borrowBook(id, bookId, role, memberId) Member
        +returnBook(id, bookId, role, memberId) Member
    }

    class MemberService {
        -string filePath
        -BookService bookService
        -readFile() Member[]
        -writeFile(data) void
        +create(dto) Member
        +findAll(role) Member[]
        +findOne(id, role, memberId) Member
        +update(id, dto, role) Member
        +replace(id, dto, role) Member
        +remove(id, role) void
        +borrowBook(memberId, bookId, role, reqId) Member
        +returnBook(memberId, bookId, role, reqId) Member
    }

    class CreateBookDto {
        +string name
        +string author
        +BookCategory category
        +string language
        +string uploadDate
        +boolean isRent
        +number star
        +string[] review
        +boolean isEarlyAccess
    }

    class CreateMemberDto {
        +string firstName
        +string lastName
        +string email
        +string phone
        +string address
        +string dateOfBirth
        +boolean isActive
        +number maxBorrowLimit
    }

    BookController --> BookService : injects
    MemberController --> MemberService : injects
    MemberService --> BookService : injects
    BookController ..> CreateBookDto : uses
    MemberController ..> CreateMemberDto : uses
    BookService ..> Book : manages
    MemberService ..> Member : manages
```

---

## 3. Module Dependency Diagram

แสดงความสัมพันธ์ระหว่าง NestJS Modules

```mermaid
graph TD
    AppModule["AppModule\n(Root)"]
    BookModule["BookModule\nexports: BookService"]
    MemberModule["MemberModule\nimports: BookModule"]

    AppModule --> BookModule
    AppModule --> MemberModule
    MemberModule --> BookModule

    BookModule --> BookController["BookController"]
    BookModule --> BookService["BookService"]
    MemberModule --> MemberController["MemberController"]
    MemberModule --> MemberService["MemberService"]

    MemberService -. "inject" .-> BookService
```

---
