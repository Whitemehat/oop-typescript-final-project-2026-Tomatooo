import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Put, HttpCode } from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  @HttpCode(201)
  create(
    @Body() createMemberDto: CreateMemberDto,
  ) {
    return this.memberService.create(createMemberDto);
  }

  @Get()
  @HttpCode(200)
  findAll() {
    return this.memberService.findAll();
  }

  @Get(':id')
  @HttpCode(200)
  findOne(@Param('id') id: string) {
    return this.memberService.findOne(+id);
  }

  @Patch(':id')
  @HttpCode(200)
  update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Headers('role') role: string,
  ) {
    return this.memberService.update(+id, updateMemberDto, role);
  }

  @Put(':id')
  @HttpCode(200)
  replace(
    @Param('id') id: string,
    @Body() createMemberDto: CreateMemberDto,
    @Headers('role') role: string,
  ) {
    return this.memberService.replace(+id, createMemberDto, role);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(
    @Param('id') id: string,
    @Headers('role') role: string,
  ) {
    return this.memberService.remove(+id, role);
  }
}
