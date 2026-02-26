import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Put, HttpCode } from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

// รับ request ที่ขึ้นต้นด้วย /book ทั้งหมด
@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  // เพิ่มหนังสือใหม่ ต้องเป็น admin ถึงทำได้
  @Post()
  @HttpCode(201)
  create(
    @Body() createBookDto: CreateBookDto,
    @Headers('role') role: string,
  ) {
    return this.bookService.create(createBookDto, role);
  }

  // ดึงหนังสือทั้งหมดออกมา ใครก็ดูได้
  @Get()
  @HttpCode(200)
  findAll() {
    return this.bookService.findAll();
  }

  // ดึงหนังสือตาม id ที่ระบุ
  @Get(':id')
  @HttpCode(200)
  findOne(@Param('id') id: string) {
    return this.bookService.findOne(+id);
  }

  // แก้ข้อมูลบางส่วน ต้องเป็น admin
  @Patch(':id')
  @HttpCode(200)
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @Headers('role') role: string,
  ) {
    return this.bookService.update(+id, updateBookDto, role);
  }

  // แทนข้อมูลทั้งหมด ต้องเป็น admin
  @Put(':id')
  @HttpCode(200)
  replace(
    @Param('id') id: string,
    @Body() createBookDto: CreateBookDto,
    @Headers('role') role: string,
  ) {
    return this.bookService.replace(+id, createBookDto, role);
  }

  // ลบหนังสือ ต้องเป็น admin
  @Delete(':id')
  @HttpCode(200)
  remove(
    @Param('id') id: string,
    @Headers('role') role: string,
  ) {
    return this.bookService.remove(+id, role);
  }
}
