import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Put, HttpCode, Query } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiOperation, ApiHeader } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'สมัครสมาชิกใหม่ (ใครก็ทำได้)', description: 'Body: firstName, lastName, email, phone, address, dateOfBirth, isActive, maxBorrowLimit\nไม่ต้องใส่ header role' })
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.memberService.create(createMemberDto);
  }

  // ดูสมาชิกทั้งหมด ต้องเป็น admin
  @Get()
  @ApiOperation({ summary: 'ดูสมาชิกทั้งหมด (เฉพาะ admin)', description: 'Header: role=admin' })
  @ApiHeader({ name: 'role', description: 'admin', required: true })
  findAll(@Headers('role') role: string) {
    return this.memberService.findAll(role);
  }

  // ค้นหาสมาชิกด้วยชื่อหรือ id — ต้องเป็น admin
  @Get('search')
  @HttpCode(200)
  @ApiOperation({ summary: 'ค้นหาสมาชิกด้วยชื่อหรือ ID (เฉพาะ admin)', description: 'Query param: query = ชื่อ (firstName หรือ lastName, partial match) หรือ ID เป็นตัวเลข\nHeader: role=admin\nถ้าไม่เจอจะได้รับ message: No data found' })
  @ApiQuery({ name: 'query', description: 'ชื่อ (firstName/lastName) หรือ ID เช่น \"John\" หรือ \"2\"' })
  @ApiHeader({ name: 'role', description: 'admin', required: true })
  search(
    @Query('query') query: string,
    @Headers('role') role: string,
  ) {
    return this.memberService.search(query ?? '', role);
  }

  // แก้ข้อมูลบางส่วน ต้องเป็น admin — รับ id หรือชื่อสมาชิกก็ได้
  @Patch(':query')
  @ApiOperation({ summary: 'แก้สมาชิกบางส่วน (เฉพาะ admin)', description: 'Path param: :query = ID หรือชื่อสมาชิก (exact match) เช่น \"2\" หรือ \"John Doe\"\nHeader: role=admin\nBody: เฉพาะ field ที่ต้องการแก้ เช่น { maxBorrowLimit: 5 }' })
  @ApiHeader({ name: 'role', description: 'admin', required: true })
  update(
    @Param('query') query: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Headers('role') role: string,
  ) {
    return this.memberService.update(query, updateMemberDto, role);
  }

  // แทนข้อมูลทั้งหมด ต้องเป็น admin (system-managed fields ถูก preserve อัตโนมัติ) — รับ id หรือชื่อสมาชิกก็ได้
  @Put(':query')
  @ApiOperation({ summary: 'แทนแบบสมาชิกทั้งหมด (เฉพาะ admin)', description: 'Path param: :query = ID หรือชื่อสมาชิก (exact match)\nHeader: role=admin\nBody: firstName, lastName, email, phone, address, dateOfBirth, isActive, maxBorrowLimit (ครบทุก field)\nหมายเหตุ: role, memberSince, borrowedBooks จะถูก preserve ไว้เสมอ' })
  @ApiHeader({ name: 'role', description: 'admin', required: true })
  replace(
    @Param('query') query: string,
    @Body() createMemberDto: CreateMemberDto,
    @Headers('role') role: string,
  ) {
    return this.memberService.replace(query, createMemberDto, role);
  }

  // ลบสมาชิก ต้องเป็น admin — รับ id หรือชื่อสมาชิกก็ได้
  @Delete(':query')
  @ApiOperation({ summary: 'ลบสมาชิก (เฉพาะ admin)', description: 'Path param: :query = ID หรือชื่อสมาชิก (exact match) เช่น \"2\" หรือ \"John Doe\"\nHeader: role=admin\nID จะถูก resequence หลังลบ' })
  @ApiHeader({ name: 'role', description: 'admin', required: true })
  remove(
    @Param('query') query: string,
    @Headers('role') role: string,
  ) {
    return this.memberService.remove(query, role);
  }

  // ยืมหนังสือ — member หรือ admin ทำได้ ไม่ต้องส่ง memberId header
  @Post(':id/borrow/:bookId')
  @ApiOperation({ summary: 'ยืมหนังสือ (member หรือ admin)', description: 'Path param: :id = ID สมาชิกที่จะยืม, :bookId = ID หนังสือที่จะยืม\nHeader: role=member หรือ role=admin\nguest ยืมไม่ได้' })
  @ApiHeader({ name: 'role', description: 'member หรือ admin', required: true })
  borrowBook(
    @Param('id') id: string,
    @Param('bookId') bookId: string,
    @Headers('role') role: string,
  ) {
    return this.memberService.borrowBook(+id, +bookId, role);
  }

  // คืนหนังสือ — member หรือ admin ทำได้ ไม่ต้องส่ง memberId header
  @Post(':id/return/:bookId')
  @ApiOperation({ summary: 'คืนหนังสือ (member หรือ admin)', description: 'Path param: :id = ID สมาชิกที่จะคืน, :bookId = ID หนังสือที่จะคืน\nHeader: role=member หรือ role=admin\nguest คืนไม่ได้' })
  @ApiHeader({ name: 'role', description: 'member หรือ admin', required: true })
  returnBook(
    @Param('id') id: string,
    @Param('bookId') bookId: string,
    @Headers('role') role: string,
  ) {
    return this.memberService.returnBook(+id, +bookId, role);
  }
}

