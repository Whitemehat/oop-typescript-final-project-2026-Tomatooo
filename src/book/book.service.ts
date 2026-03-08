import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './interfaces_book/book.interface';
import { Member } from '../member/interfaces_member/member.interface';
import * as fs from 'fs';
import * as path from 'path';

// จัดการข้อมูลหนังสือ อ่านและเขียนลง books.json
@Injectable()
export class BookService {
  private filePath = path.join(__dirname, '../../data/books.json');
  private membersFilePath = path.join(__dirname, '../../data/members.json');

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

  private readMembers(): Member[] {
    if (!fs.existsSync(this.membersFilePath)) return [];
    const data = fs.readFileSync(this.membersFilePath, 'utf-8');
    return data ? JSON.parse(data) : [];
  }

  private writeMembers(data: Member[]): void {
    fs.writeFileSync(this.membersFilePath, JSON.stringify(data, null, 2));
  }

  // ส่งหนังสือทั้งหมดไปให้ user
  findAll(): Book[] {
    return this.readFile();
  }

  // หาหนังสือจาก id ถ้าไม่เจอโยน 404
  findOne(id: number): Book {
    if(!id){
      throw new NotFoundException('No input');
    }
    const books = this.readFile();
    const book = books.find(book => book.id === id);
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  // หาหนังสือ 1 เล่มจาก query (id หรือชื่อ) โยน 404 ถ้าไม่เจอ, 400 ถ้าเจอหลายเล่ม
  findOneByQuery(query: string): Book {
    const books = this.readFile();
    const numQuery = Number(query);
    let matches: Book[];
    if (!isNaN(numQuery) && numQuery > 0) {
      matches = books.filter(b => b.id === numQuery);
    } else {
      const lower = query.toLowerCase();
      matches = books.filter(b => b.name.toLowerCase().includes(lower));
    }
    if (matches.length === 0) throw new NotFoundException('Book not found');
    if (matches.length > 1) throw new BadRequestException('Multiple books found, be more specific');
    return matches[0];
  }

  // ค้นหาหนังสือด้วยชื่อ หรือ id
  search(query: string): { responseMessage: string; data: Book[] } {
    const books = this.readFile();
    const numQuery = Number(query);
    let matches: Book[];

    if (!isNaN(numQuery) && numQuery > 0) {
      matches = books.filter(b => b.id === numQuery);
    } else {
      const lower = query.toLowerCase();
      matches = books.filter(b => b.name.toLowerCase().includes(lower));
    }

    if (matches.length === 0) {
      return { responseMessage: 'No data found', data: [] };
    }
    return {
      responseMessage: `Found ${matches.length} book(s): ${matches.map(b => `[ID ${b.id}] ${b.name} by ${b.author}`).join(', ')}`,
      data: matches,
    };
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
  update(query: string, updateBookDto: UpdateBookDto, member: string): { responseMessage: string; data: Book } {
    if (member !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    const book = this.findOneByQuery(query);
    const books = this.readFile();
    const indexUpdate = books.findIndex(b => b.id === book.id);
    const updateBook: Book = {
      ...books[indexUpdate],
      ...updateBookDto,
      id: books[indexUpdate].id,
    };
    books[indexUpdate] = updateBook;
    this.writeFile(books);
    return { responseMessage: `Updated Book ID ${book.id} Successfully`, data: updateBook };
  }

  // แทนข้อมูลทั้งหมดของหนังสือ id เดิม แต่ข้อมูลใหม่ทั้งหมด
  replace(query: string, replaceDto: CreateBookDto, member: string): { responseMessage: string; data: Book } {
    if (member !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    const book = this.findOneByQuery(query);
    const books = this.readFile();
    const indexReplace = books.findIndex(b => b.id === book.id);
    const replaceBook: Book = {
      ...replaceDto,
      id: books[indexReplace].id,
    };
    books[indexReplace] = replaceBook;
    this.writeFile(books);
    return { responseMessage: `Replaced Book ID ${book.id} Successfully`, data: replaceBook };
  }

  // ลบหนังสือออกจาก json แล้ว resequence id และอัปเดต borrowedBooks ใน members
  remove(query: string, member: string): { responseMessage: string; data: null } {
    if (member !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    const book = this.findOneByQuery(query);
    const books = this.readFile();

    // สร้าง map จาก old id → new id หลัง resequence
    const filtered = books.filter(b => b.id !== book.id);
    const idMap = new Map<number, number>();
    filtered.forEach((b, i) => {
      idMap.set(b.id, i + 1);
    });
    const resequenced = filtered.map((b, i) => ({ ...b, id: i + 1 }));
    this.writeFile(resequenced);

    // อัปเดต borrowedBooks ใน members ให้สอดคล้องกับ id ใหม่
    const members = this.readMembers();
    const updatedMembers = members.map(m => ({
      ...m,
      borrowedBooks: m.borrowedBooks
        .filter(bid => bid !== book.id)               // ลบเล่มที่ถูกลบออก
        .map(bid => idMap.get(bid) ?? bid),           // แปลง id เก่าเป็น id ใหม่
    }));
    this.writeMembers(updatedMembers);
    return { responseMessage: `Deleted Book ID ${book.id} Successfully`, data: null };
  }

  // อัปเดต isRent โดยตรงสำหรับ borrow/return sync (ไม่ต้องเช็ค role)
  setRentStatus(id: number, isRent: boolean): Book {
    const books = this.readFile();
    const index = books.findIndex(book => book.id === id);
    if (index === -1) throw new NotFoundException('Book not found');
    books[index] = { ...books[index], isRent };
    this.writeFile(books);
    return books[index];
  }
}
