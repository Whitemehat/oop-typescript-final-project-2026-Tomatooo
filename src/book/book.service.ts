import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './interfaces_book/book.interface';
import * as fs from 'fs';
import * as path from 'path';

// จัดการข้อมูลหนังสือ อ่านและเขียนลง books.json
@Injectable()
export class BookService {
  private filePath = path.join(__dirname, '../../data/books.json');

  // อ่านข้อมูลหนังสือทั้งหมดจากไฟล์ ถ้าไฟล์ยังไม่มีก็คืน array ว่าง
  private readFile(): Book[] {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    const data = fs.readFileSync(this.filePath, 'utf-8');
    return data ? JSON.parse(data) : [];
  }

  // บันทึกข้อมูลลงไฟล์ json
  private writeFile(data: Book[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  // คืนหนังสือทั้งหมด
  findAll(): Book[] {
    return this.readFile();
  }

  // หาหนังสือจาก id ถ้าไม่เจอโยน 404
  findOne(id: number): Book {
    const books = this.readFile();
    const book = books.find(book => book.id === id);
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  // เพิ่มหนังสือใหม่ เฉพาะ admin เท่านั้น id ต่อจากตัวสุดท้าย
  create(createBookDto: CreateBookDto, member: string): Book {
    if (member !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    const books = this.readFile();
    const newBook: Book = {
      ...createBookDto,
      id: books.length ? books[books.length - 1].id + 1 : 1,
    };
    books.push(newBook);
    this.writeFile(books);
    return newBook;
  }

  // แก้ข้อมูลบางส่วน เฉพาะ field ที่ส่งมา field อื่นคงเดิม
  update(id: number, updateBookDto: UpdateBookDto, member: string): Book {
    if (member !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    const books = this.readFile();
    const indexUpdate = books.findIndex(book => book.id === id);
    if (indexUpdate === -1) {
      throw new NotFoundException('Book not found');
    }
    const updateBook: Book = {
      ...books[indexUpdate],
      ...updateBookDto,
      id: books[indexUpdate].id,
    };
    books[indexUpdate] = updateBook;
    this.writeFile(books);
    return updateBook;
  }

  // แทนข้อมูลทั้งหมดของหนังสือ id เดิม แต่ข้อมูลใหม่ทั้งหมด
  replace(id: number, replaceDto: CreateBookDto, member: string): Book {
    if (member !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    const books = this.readFile();
    const indexReplace = books.findIndex(book => book.id === id);
    if (indexReplace === -1) {
      throw new NotFoundException('Book not found');
    }
    const replaceBook: Book = {
      ...replaceDto,
      id: books[indexReplace].id,
    };
    books[indexReplace] = replaceBook;
    this.writeFile(books);
    return replaceBook;
  }

  // ลบหนังสือออกจาก json ถ้าไม่เจอ id โยน 404
  remove(id: number, member: string): void {
    if (member !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    const books = this.readFile();
    const filtered = books.filter(book => book.id !== id);
    if (filtered.length === books.length) {
      throw new NotFoundException('Book not found');
    }
    this.writeFile(filtered);
  }
}
