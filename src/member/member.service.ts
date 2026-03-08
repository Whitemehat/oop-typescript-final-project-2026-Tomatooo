import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './interfaces_member/member.interface';
import { MemberRole } from './enums/member-role.enums';
import { BookService } from '../book/book.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MemberService {
  private filePath = path.join(__dirname, '../../data/members.json');

  constructor(private readonly bookService: BookService) {}

  private readFile(): Member[] {
    if (!fs.existsSync(this.filePath)) return [];
    const data = fs.readFileSync(this.filePath, 'utf-8');
    return data ? JSON.parse(data) : [];
  }

  private writeFile(data: Member[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  // ตรวจสิทธิ์ admin โยน 403 ถ้าไม่ใช่
  private requireAdmin(role: string): void {
    if (role !== 'admin') throw new ForbiddenException('Permission denied');
  }

  // หา index สมาชิกตาม id โยน 404 ถ้าไม่เจอ
  private findMemberIndex(id: number, members: Member[]): number {
    const index = members.findIndex(m => m.id === id);
    if (index === -1) throw new NotFoundException('Member not found');
    return index;
  }

  findAll(role: string): Member[] {
    this.requireAdmin(role);
    return this.readFile();
  }

  findOne(id: number, role: string, memberId: string): Member {
    const members = this.readFile();
    const index = this.findMemberIndex(id, members);
    if (role !== 'admin' && +memberId !== id) {
      throw new ForbiddenException('Permission denied');
    }
    return members[index];
  }

  // role ถูก set เป็น student เสมอ, memberSince และ borrowedBooks ถูก set อัตโนมัติ
  create(createMemberDto: CreateMemberDto): Member {
    const members = this.readFile();
    const newMember: Member = {
      ...createMemberDto,
      id: members.length ? members[members.length - 1].id + 1 : 1,
      role: MemberRole.STUDENT,
      memberSince: new Date().toISOString().split('T')[0],
      borrowedBooks: [],
    };
    members.push(newMember);
    this.writeFile(members);
    return newMember;
  }

  update(id: number, updateMemberDto: UpdateMemberDto, role: string): Member {
    this.requireAdmin(role);
    const members = this.readFile();
    const index = this.findMemberIndex(id, members);
    members[index] = { ...members[index], ...updateMemberDto };
    this.writeFile(members);
    return members[index];
  }

  // role, memberSince, borrowedBooks เป็น system-managed fields ต้อง preserve ไว้เสมอ
  replace(id: number, replaceMemberDto: CreateMemberDto, role: string): Member {
    this.requireAdmin(role);
    const members = this.readFile();
    const index = this.findMemberIndex(id, members);
    const { id: existingId, role: existingRole, memberSince, borrowedBooks } = members[index];
    members[index] = { ...replaceMemberDto, id: existingId, role: existingRole, memberSince, borrowedBooks };
    this.writeFile(members);
    return members[index];
  }

  remove(id: number, role: string): void {
    this.requireAdmin(role);
    const members = this.readFile();
    const filtered = members.filter(m => m.id !== id);
    if (filtered.length === members.length) throw new NotFoundException('Member not found');
    this.writeFile(filtered);
  }

  // sync book.isRent = true และเพิ่ม bookId ใน borrowedBooks
  borrowBook(memberId: number, bookId: number, role: string, requesterId: string): Member {
    if (role !== 'admin' && +requesterId !== memberId) {
      throw new ForbiddenException('Permission denied');
    }
    const members = this.readFile();
    const index = this.findMemberIndex(memberId, members);
    const member = members[index];

    if (!member.isActive) throw new ForbiddenException('Member is not active');
    if (member.borrowedBooks.length >= member.maxBorrowLimit) throw new ForbiddenException('Borrow limit reached');
    if (member.borrowedBooks.includes(bookId)) throw new BadRequestException('Book already borrowed by this member');

    const book = this.bookService.findOne(bookId);
    if (book.isRent) throw new BadRequestException('Book is already rented');

    this.bookService.setRentStatus(bookId, true);
    member.borrowedBooks.push(bookId);
    this.writeFile(members);
    return member;
  }

  // sync book.isRent = false และลบ bookId ออกจาก borrowedBooks
  returnBook(memberId: number, bookId: number, role: string, requesterId: string): Member {
    if (role !== 'admin' && +requesterId !== memberId) {
      throw new ForbiddenException('Permission denied');
    }
    const members = this.readFile();
    const index = this.findMemberIndex(memberId, members);
    const member = members[index];

    if (!member.borrowedBooks.includes(bookId)) {
      throw new BadRequestException('This book is not borrowed by this member');
    }

    this.bookService.setRentStatus(bookId, false);
    member.borrowedBooks = member.borrowedBooks.filter(id => id !== bookId);
    this.writeFile(members);
    return member;
  }
}
