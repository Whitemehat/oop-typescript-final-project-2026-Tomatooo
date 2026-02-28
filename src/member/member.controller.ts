import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Put, HttpCode } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

// รับ request ที่ขึ้นต้นด้วย /member ทั้งหมด
@ApiTags('Member')
@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  // สมัครสมาชิก ใครก็ทำได้ ไม่ต้องมี header พิเศษ
  @Post()
  @HttpCode(201)
  create(
    @Body() createMemberDto: CreateMemberDto,
  ) {
    return this.memberService.create(createMemberDto);
  }

  // ดูสมาชิกทั้งหมด ต้องเป็น admin
  @Get()
  @HttpCode(200)
  findAll(@Headers('role') role: string) {
    return this.memberService.findAll(role);
  }

  // ดูสมาชิกตาม id ถ้าไม่ใช่ admin ต้องส่ง memberId ตรงกับ id ที่ขอ
  @Get(':id')
  @HttpCode(200)
  findOne(
    @Param('id') id: string,
    @Headers('role') role: string,
    @Headers('memberId') memberId: string,
  ) {
    return this.memberService.findOne(+id, role, memberId);
  }

  // แก้ข้อมูลบางส่วน ต้องเป็น admin
  @Patch(':id')
  @HttpCode(200)
  update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Headers('role') role: string,
  ) {
    return this.memberService.update(+id, updateMemberDto, role);
  }

  // แทนข้อมูลทั้งหมด ต้องเป็น admin
  @Put(':id')
  @HttpCode(200)
  replace(
    @Param('id') id: string,
    @Body() createMemberDto: CreateMemberDto,
    @Headers('role') role: string,
  ) {
    return this.memberService.replace(+id, createMemberDto, role);
  }

  // ลบสมาชิก ต้องเป็น admin
  @Delete(':id')
  @HttpCode(200)
  remove(
    @Param('id') id: string,
    @Headers('role') role: string,
  ) {
    return this.memberService.remove(+id, role);
  }

  // ยืมหนังสือ admin ทำได้ทุกคน member ทำได้เฉพาะตัวเอง
  @Post(':id/borrow/:bookId')
  @HttpCode(200)
  borrowBook(
    @Param('id') id: string,
    @Param('bookId') bookId: string,
    @Headers('role') role: string,
    @Headers('memberId') memberId: string,
  ) {
    return this.memberService.borrowBook(+id, +bookId, role, memberId);
  }

  // คืนหนังสือ admin ทำได้ทุกคน member ทำได้เฉพาะตัวเอง
  @Post(':id/return/:bookId')
  @HttpCode(200)
  returnBook(
    @Param('id') id: string,
    @Param('bookId') bookId: string,
    @Headers('role') role: string,
    @Headers('memberId') memberId: string,
  ) {
    return this.memberService.returnBook(+id, +bookId, role, memberId);
  }
}
