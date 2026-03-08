import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
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

  // หา member 1 คนจาก query (id หรือชื่อ) โยน 404 ถ้าไม่เจอ, 400 ถ้าเจอหลายคน
  private findOneByQuery(query: string): Member {
    const members = this.readFile();
    const numQuery = Number(query);
    let matches: Member[];
    if (!isNaN(numQuery) && numQuery > 0) {
      matches = members.filter(m => m.id === numQuery);
    } else {
      const lower = query.toLowerCase();
      matches = members.filter(
        m => m.firstName.toLowerCase().includes(lower) || m.lastName.toLowerCase().includes(lower),
      );
    }
    if (matches.length === 0) throw new NotFoundException('Member not found');
    if (matches.length > 1) throw new BadRequestException('Multiple members found, be more specific');
    return matches[0];
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

  // ค้นหา member ด้วยชื่อ (firstName/lastName) หรือ id
  search(query: string, role: string): { responseMessage: string; data: Member[] } {
    this.requireAdmin(role);
    const members = this.readFile();
    const numQuery = Number(query);
    let matches: Member[];

    if (!isNaN(numQuery) && numQuery > 0) {
      matches = members.filter(m => m.id === numQuery);
    } else {
      const lower = query.toLowerCase();
      matches = members.filter(
        m =>
          m.firstName.toLowerCase().includes(lower) ||
          m.lastName.toLowerCase().includes(lower),
      );
    }

    if (matches.length === 0) {
      return { responseMessage: 'No data found', data: [] };
    }
    return {
      responseMessage: `Found ${matches.length} member(s): ${matches.map(m => `[ID ${m.id}] ${m.firstName} ${m.lastName} (${m.email})`).join(', ')}`,
      data: matches,
    };
  }

  // role ถูก set เป็น member เสมอ, memberSince และ borrowedBooks ถูก set อัตโนมัติ
  // email ต้องไม่ซ้ำกับ member คนอื่น
  create(createMemberDto: CreateMemberDto): Member {
    const members = this.readFile();

    const emailExists = members.some(
      m => m.email.toLowerCase() === createMemberDto.email.toLowerCase(),
    );
    if (emailExists) {
      throw new ConflictException('Email is already in use');
    }

    const newMember: Member = {
      ...createMemberDto,
      id: members.length ? members[members.length - 1].id + 1 : 1,
      role: MemberRole.MEMBER,
      memberSince: new Date().toISOString().split('T')[0],
      borrowedBooks: [],
    };
    members.push(newMember);
    this.writeFile(members);
    return newMember;
  }

  update(query: string, updateMemberDto: UpdateMemberDto, role: string): { responseMessage: string; data: Member } {
    this.requireAdmin(role);
    const target = this.findOneByQuery(query);
    const members = this.readFile();
    const index = this.findMemberIndex(target.id, members);
    members[index] = { ...members[index], ...updateMemberDto };
    this.writeFile(members);
    return { responseMessage: `Updated Member ID ${target.id} Successfully`, data: members[index] };
  }

  // role, memberSince, borrowedBooks เป็น system-managed fields ต้อง preserve ไว้เสมอ
  replace(query: string, replaceMemberDto: CreateMemberDto, role: string): { responseMessage: string; data: Member } {
    this.requireAdmin(role);
    const target = this.findOneByQuery(query);
    const members = this.readFile();
    const index = this.findMemberIndex(target.id, members);
    const { id: existingId, role: existingRole, memberSince, borrowedBooks } = members[index];
    members[index] = { ...replaceMemberDto, id: existingId, role: existingRole, memberSince, borrowedBooks };
    this.writeFile(members);
    return { responseMessage: `Replaced Member ID ${target.id} Successfully`, data: members[index] };
  }

  // หลังลบ member แล้ว resequence id ให้ต่อเนื่อง 1, 2, 3, ...
  remove(query: string, role: string): { responseMessage: string; data: null } {
    this.requireAdmin(role);
    const target = this.findOneByQuery(query);
    const members = this.readFile();
    const filtered = members.filter(m => m.id !== target.id);
    const resequenced = filtered.map((m, index) => ({ ...m, id: index + 1 }));
    this.writeFile(resequenced);
    return { responseMessage: `Deleted Member ID ${target.id} Successfully`, data: null };
  }

  // member แก้ไขข้อมูลส่วนตัวเอง (firstName, lastName, email, phone, address, dateOfBirth)
  updateProfile(memberId: number, dto: UpdateProfileDto): { responseMessage: string; data: Member } {
    const members = this.readFile();
    const index = this.findMemberIndex(memberId, members);
    if (dto.email && dto.email !== members[index].email) {
      const emailExists = members.some(
        m => m.id !== memberId && m.email.toLowerCase() === dto.email!.toLowerCase(),
      );
      if (emailExists) throw new ConflictException('Email is already in use');
    }
    const { firstName, lastName, email, phone, address, dateOfBirth } = dto;
    members[index] = {
      ...members[index],
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(dateOfBirth !== undefined && { dateOfBirth }),
    };
    this.writeFile(members);
    return { responseMessage: `Updated Member ID ${memberId} Successfully`, data: members[index] };
  }

  // sync book.isRent = true และเพิ่ม bookId ใน borrowedBooks
  // ต้องเป็น member หรือ admin เท่านั้นถึงยืมได้
  borrowBook(memberId: number, bookId: number, role: string): Member {
    if (role !== 'admin' && role !== 'member') {
      throw new ForbiddenException('Only members can borrow books');
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
  // ต้องเป็น member หรือ admin เท่านั้นถึงคืนได้
  returnBook(memberId: number, bookId: number, role: string): Member {
    if (role !== 'admin' && role !== 'member') {
      throw new ForbiddenException('Only members can return books');
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
