# UML Diagram — Library Management System

## Class Diagram

```
┌─────────────────────────────────────┐
│              <<enum>>               │
│            BookCategory             │
├─────────────────────────────────────┤
│  FICTION     = 'fiction'            │
│  NON_FICTION = 'non-fiction'        │
│  HORROR      = 'horror'             │
│  SCIFI       = 'sci-fi'             │
│  HISTORY     = 'history'            │
│  FANTASY     = 'fantasy'            │
│  ADVENTURE   = 'adventure'          │
│  COMEDY      = 'comedy'             │
└─────────────────────────────────────┘
              ▲
              │ uses
┌─────────────────────────────────────┐
│            <<interface>>            │
│                Book                 │
├─────────────────────────────────────┤
│  + id            : number           │
│  + name          : string           │
│  + author        : string           │
│  + category      : BookCategory     │
│  + language      : string           │
│  + date          : string           │
│  + isbn          : string           │
│  + publisher     : string           │
│  + totalPages    : number           │
│  + availableCopies : number         │
│  + totalCopies   : number           │
│  + description   : string           │
└─────────────────────────────────────┘


┌─────────────────────────────────────┐
│              <<enum>>               │
│            MemberRole               │
├─────────────────────────────────────┤
│  STUDENT = 'student'                │
│  ADMIN   = 'admin'                  │
│  GUEST   = 'guest'                  │
└─────────────────────────────────────┘
              ▲
              │ uses
┌─────────────────────────────────────┐
│            <<interface>>            │
│               Member                │
├─────────────────────────────────────┤
│  + id             : number          │
│  + firstName      : string          │
│  + lastName       : string          │
│  + email          : string          │
│  + phone          : string          │
│  + role           : MemberRole      │
│  + address        : string          │
│  + dateOfBirth    : string          │
│  + memberSince    : string          │
│  + isActive       : boolean         │
│  + borrowedBooks  : number[]        │
│  + maxBorrowLimit : number          │
└─────────────────────────────────────┘
              │
              │ borrowedBooks[ ] → Book.id
              ▼
┌─────────────────────────────────────┐
│            <<interface>>            │
│                Book                 │
└─────────────────────────────────────┘


## Relationship

Member ----< Book
(Member ยืมหนังสือได้หลายเล่ม โดยเก็บ book id ใน borrowedBooks[])
```
