import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Put, HttpCode, Query } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

// รับ request ที่ขึ้นต้นด้วย /book ทั้งหมด
@ApiTags('Book')
@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  // เพิ่มหนังสือใหม่ ต้องเป็น admin ถึงทำได้
  @Post()
  @HttpCode(201)
  @ApiOperation({ description: 'Header: role=admin \nBody: name, author, category, language, uploadDate, isRent, star, review[], isEarlyAccess' })
  @ApiHeader({ name: 'role', description: 'admin', required: true })
  create(
    @Body() createBookDto: CreateBookDto,
    @Headers('role') role: string,
  ) {
    return this.bookService.create(createBookDto, role);
  }

  // ดึงหนังสือทั้งหมดออกมา ใครก็ดูได้
  @Get()
  @HttpCode(200)
  @ApiOperation({ description: 'ไม่ต้องใส่ header ใดๆ' })
  findAll() {
    return this.bookService.findAll();
  }

  // ค้นหาหนังสือด้วยชื่อหรือ id — ใครก็ค้นได้
  @Get('search')
  @HttpCode(200)
  @ApiOperation({ description: 'Query param: query = ชื่อหนังสือ (partial match) หรือ ID เป็นตัวเลข \nถ้าไม่เจอจะได้รับ message: No data found' })
  @ApiQuery({ name: 'query', description: 'ชื่อหนังสือ (partial) หรือ ID เช่น "Clean" หรือ "3"' })
  search(@Query('query') query: string) {
    return this.bookService.search(query ?? '');
  }

  // แก้ข้อมูลบางส่วน ต้องเป็น admin — รับ id หรือชื่อหนังสือก็ได้
  @Patch(':query')
  @HttpCode(200)
  @ApiOperation({ description: 'Path param: :query = ID หรือชื่อหนังสือ (exact match) เช่น "3" หรือ "Dune" \nHeader: role=admin \nBody: เฉพาะ field ที่ต้องการแก้ เช่น { star: 5 }' })
  @ApiHeader({ name: 'role', description: 'admin', required: true })
  update(
    @Param('query') query: string,
    @Body() updateBookDto: UpdateBookDto,
    @Headers('role') role: string,
  ) {
    return this.bookService.update(query, updateBookDto, role);
  }

  // แทนข้อมูลทั้งหมด ต้องเป็น admin — รับ id หรือชื่อหนังสือก็ได้
  @Put(':query')
  @HttpCode(200)
  @ApiOperation({ description: 'Path param: :query = ID หรือชื่อหนังสือ (exact match) \nHeader: role=admin \nBody: name, author, category, language, uploadDate, isRent, star, review[], isEarlyAccess (ครบทุก field)' })
  @ApiHeader({ name: 'role', description: 'admin', required: true })
  replace(
    @Param('query') query: string,
    @Body() createBookDto: CreateBookDto,
    @Headers('role') role: string,
  ) {
    return this.bookService.replace(query, createBookDto, role);
  }

  // ลบหนังสือ ต้องเป็น admin — รับ id หรือชื่อหนังสือก็ได้
  @Delete(':query')
  @HttpCode(200)
  @ApiOperation({ description: 'Path param: :query = ID หรือชื่อหนังสือ (exact match) เช่น "3" หรือ "Dune" \nHeader: role=admin \nID จะถูก resequence หลังลบ' })
  @ApiHeader({ name: 'role', description: 'admin', required: true })
  remove(
    @Param('query') query: string,
    @Headers('role') role: string,
  ) {
    return this.bookService.remove(query, role);
  }
}

