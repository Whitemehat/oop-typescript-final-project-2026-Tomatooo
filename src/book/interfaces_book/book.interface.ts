import { BookCategory } from "../enums/book-catagories.enums";

export interface Book {
    id: number;
    name: string;
    author: string;
    category: BookCategory;
    language: string;
    uploadDate: string;
    isRent : boolean;
    star: number;
    review: string[];
    isEarlyAccess: boolean;
}