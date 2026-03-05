import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Put, HttpCode } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@ApiTags('Member')
@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  // สมัครสมาชิก ใครก็ทำได้ ไม่ต้องมี header พิเศษ
  @Post()
  @HttpCode(201)
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.memberService.create(createMemberDto);
  }

  // ดูสมาชิกทั้งหมด ต้องเป็น admin
  @Get()
  findAll(@Headers('role') role: string) {
    return this.memberService.findAll(role);
  }

  // ดูสมาชิกตาม id — admin ดูใครก็ได้ member ดูได้เฉพาะตัวเอง
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Headers('role') role: string,
    @Headers('memberId') memberId: string,
  ) {
    return this.memberService.findOne(+id, role, memberId);
  }

  // แก้ข้อมูลบางส่วน ต้องเป็น admin
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Headers('role') role: string,
  ) {
    return this.memberService.update(+id, updateMemberDto, role);
  }

  // แทนข้อมูลทั้งหมด ต้องเป็น admin (system-managed fields ถูก preserve อัตโนมัติ)
  @Put(':id')
  replace(
    @Param('id') id: string,
    @Body() createMemberDto: CreateMemberDto,
    @Headers('role') role: string,
  ) {
    return this.memberService.replace(+id, createMemberDto, role);
  }

  // ลบสมาชิก ต้องเป็น admin
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('role') role: string,
  ) {
    return this.memberService.remove(+id, role);
  }

  // ยืมหนังสือ — admin ทำได้ทุกคน member ทำได้เฉพาะตัวเอง
  @Post(':id/borrow/:bookId')
  borrowBook(
    @Param('id') id: string,
    @Param('bookId') bookId: string,
    @Headers('role') role: string,
    @Headers('memberId') memberId: string,
  ) {
    return this.memberService.borrowBook(+id, +bookId, role, memberId);
  }

  // คืนหนังสือ — admin ทำได้ทุกคน member ทำได้เฉพาะตัวเอง
  @Post(':id/return/:bookId')
  returnBook(
    @Param('id') id: string,
    @Param('bookId') bookId: string,
    @Headers('role') role: string,
    @Headers('memberId') memberId: string,
  ) {
    return this.memberService.returnBook(+id, +bookId, role, memberId);
  }
}
