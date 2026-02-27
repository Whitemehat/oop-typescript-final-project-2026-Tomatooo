import { Controller, Get, Post, Body, Patch, Param, Delete, Headers , Put , HttpCode} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  @HttpCode(201)
  create(
    @Body() createBookDto: CreateBookDto,
    @Headers('role') role : string
  ) 
{
    return this.bookService.create(createBookDto , role);
  }

  @Get()
  @HttpCode(200)
  findAll() {
    return this.bookService.findAll();
  }

  @Get(':name')
  @HttpCode(200)
  findOne(@Param('name') name: string) {
    return this.bookService.findOne(name);
  }

  @Patch(':id')
  @HttpCode(200)
  update(
    @Param('id') id: string, 
    @Body() updateBookDto: UpdateBookDto,
    @Headers('role') role:string
  ) {
    return this.bookService.update(+id, updateBookDto, role);
  }

  @Put(':id')
  @HttpCode(200)
  replace(
    @Param('id') id: string, 
    @Body() updateBookDto: UpdateBookDto,
    @Headers('role') role:string
  ) {
    return this.bookService.update(+id, updateBookDto, role);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(
    @Param('id') id: string,
    @Headers('role') role:string
  ) 
  {
    return this.bookService.remove(+id , role);
  }
}
