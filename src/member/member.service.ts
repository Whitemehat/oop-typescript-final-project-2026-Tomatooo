import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './interfaces_member/member.interface';
import { MemberRole } from './enums/member-role.enums';
import { BookService } from '../book/book.service';
import * as fs from 'fs';
import * as path from 'path';

// จัดการข้อมูลสมาชิก อ่านและเขียนลง members.json
@Injectable()
export class MemberService {
  private filePath = path.join(__dirname, '../../data/members.json');

  constructor(private readonly bookService: BookService) {}

  // อ่านข้อมูลสมาชิกจากไฟล์ ถ้าไฟล์ไม่มีคืน array เปล่า
  private readFile(): Member[] {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    const data = fs.readFileSync(this.filePath, 'utf-8');
    return data ? JSON.parse(data) : [];                                                                                                                                        
  }

  // เขียนข้อมูลทับลงไฟล์
  private writeFile(data: Member[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  // คืนสมาชิกทั้งหมด เฉพาะ admin เท่านั้น
  findAll(role: string): Member[] {
    if (role !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    return this.readFile();
  }

  // ดูข้อมูลสมาชิก admin ดูใครก็ได้ ส่วน member ดูได้แค่ตัวเอง
  findOne(id: number, role: string, memberId: string): Member {
    const members = this.readFile();
    const member = members.find(member => member.id === id);
    if (!member) throw new NotFoundException('Member not found');
    if (role !== 'admin' && +memberId !== id) {
      throw new ForbiddenException('Permission denied');
    }
    return member;
  }

  // สมัครสมาชิก ใครก็ทำได้ role ถูก set เป็น student เสมอ
  // memberSince auto-set เป็นวันนี้ borrowedBooks เริ่มต้นว่าง
  create(createMemberDto: CreateMemberDto): Member {
    const members = this.readFile();
    const newMember: Member = {
      ...createMemberDto,
      role: MemberRole.STUDENT,
      memberSince: new Date().toISOString().split('T')[0],
      borrowedBooks: [],
      id: members.length ? members[members.length - 1].id + 1 : 1,
    };
    members.push(newMember);
    this.writeFile(members);
    return newMember;
  }

  // แก้ข้อมูลบางส่วน เฉพาะ admin
  update(id: number, updateMemberDto: UpdateMemberDto, role: string): Member {
    if (role !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    const members = this.readFile();
    const indexUpdate = members.findIndex(member => member.id === id);
    if (indexUpdate === -1) {
      throw new NotFoundException('Member not found');
    }
    const updatedMember: Member = {
      ...members[indexUpdate],
      ...updateMemberDto,
      id: members[indexUpdate].id,
    };
    members[indexUpdate] = updatedMember;
    this.writeFile(members);
    return updatedMember;
  }

  // แทนข้อมูลทั้งหมด id เดิม เฉพาะ admin
  // role, memberSince, borrowedBooks ถูก preserve ไว้ (system-managed fields)
  replace(id: number, replaceMemberDto: CreateMemberDto, role: string): Member {
    if (role !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    const members = this.readFile();
    const indexReplace = members.findIndex(member => member.id === id);
    if (indexReplace === -1) {
      throw new NotFoundException('Member not found');
    }
    const existing = members[indexReplace];
    const replacedMember: Member = {
      ...replaceMemberDto,
      id: existing.id,
      role: existing.role,
      memberSince: existing.memberSince,
      borrowedBooks: existing.borrowedBooks,
    };
    members[indexReplace] = replacedMember;
    this.writeFile(members);
    return replacedMember;
  }

  // ลบสมาชิก เฉพาะ admin ถ้าไม่เจอ id โยน 404
  remove(id: number, role: string): void {
    if (role !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    const members = this.readFile();
    const filtered = members.filter(member => member.id !== id);
    if (filtered.length === members.length) {
      throw new NotFoundException('Member not found');
    }
    this.writeFile(filtered);
  }

  // ยืมหนังสือ sync book.isRent = true และเพิ่ม bookId ใน member.borrowedBooks
  borrowBook(memberId: number, bookId: number, role: string, requesterId: string): Member {
    if (role !== 'admin' && +requesterId !== memberId) {
      throw new ForbiddenException('Permission denied');
    }
    const members = this.readFile();
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) throw new NotFoundException('Member not found');

    const member = members[memberIndex];
    if (!member.isActive) throw new ForbiddenException('Member is not active');
    if (member.borrowedBooks.length >= member.maxBorrowLimit) {
      throw new ForbiddenException('Borrow limit reached');
    }
    if (member.borrowedBooks.includes(bookId)) {
      throw new BadRequestException('Book already borrowed by this member');
    }

    const book = this.bookService.findOne(bookId);
    if (book.isRent) throw new BadRequestException('Book is already rented');

    this.bookService.setRentStatus(bookId, true);
    member.borrowedBooks.push(bookId);
    this.writeFile(members);
    return member;
  }

  // คืนหนังสือ sync book.isRent = false และลบ bookId ออกจาก member.borrowedBooks
  returnBook(memberId: number, bookId: number, role: string, requesterId: string): Member {
    if (role !== 'admin' && +requesterId !== memberId) {
      throw new ForbiddenException('Permission denied');
    }
    const members = this.readFile();
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) throw new NotFoundException('Member not found');

    const member = members[memberIndex];
    if (!member.borrowedBooks.includes(bookId)) {
      throw new BadRequestException('This book is not borrowed by this member');
    }

    this.bookService.findOne(bookId);
    this.bookService.setRentStatus(bookId, false);
    member.borrowedBooks = member.borrowedBooks.filter(id => id !== bookId);
    this.writeFile(members);
    return member;
  }
}
