import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './interfaces_member/member.interface';
import { MemberRole } from './enums/member-role.enums';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MemberService {
  private filePath = path.join(__dirname, '../../data/members.json');

  private readFile(): Member[] {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    const data = fs.readFileSync(this.filePath, 'utf-8');
    return data ? JSON.parse(data) : [];
  }

  private writeFile(data: Member[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  findAll(role: string): Member[] {
    if (role !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    return this.readFile();
  }

  findOne(id: number, role: string, memberId: string): Member {
    const members = this.readFile();
    const member = members.find(member => member.id === id);
    if (!member) throw new NotFoundException('Member not found');
    if (role !== 'admin' && +memberId !== id) {
      throw new ForbiddenException('Permission denied');
    }
    return member;
  }

  create(createMemberDto: CreateMemberDto): Member {
    const members = this.readFile();
    const newMember: Member = {
      ...createMemberDto,
      role: MemberRole.STUDENT,
      id: members.length ? members[members.length - 1].id + 1 : 1,
    };
    members.push(newMember);
    this.writeFile(members);
    return newMember;
  }

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

  replace(id: number, replaceMemberDto: CreateMemberDto, role: string): Member {
    if (role !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    const members = this.readFile();
    const indexReplace = members.findIndex(member => member.id === id);
    if (indexReplace === -1) {
      throw new NotFoundException('Member not found');
    }
    const replacedMember: Member = {
      ...replaceMemberDto,
      id: members[indexReplace].id,
    };
    members[indexReplace] = replacedMember;
    this.writeFile(members);
    return replacedMember;
  }

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
}
