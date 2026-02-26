import { BookCategory } from "../enums/book-catagories.enums";

// โครงสร้างข้อมูลหนังสือ 1 เล่ม
export interface Book {
    id: number;
    name: string;
    author: string;
    category: BookCategory;
    language: string;
    date: string;
    isbn: string;
    publisher: string;
    totalPages: number;
    availableCopies: number;
    totalCopies: number;
    description: string;
}