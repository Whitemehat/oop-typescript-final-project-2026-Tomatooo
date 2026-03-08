import { Controller, Patch, Body, Headers, HttpCode, Param, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { MemberService } from './member.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MemberRole } from './enums/member-role.enums';

// endpoint สำหรับ member แก้ไขข้อมูลส่วนตัวของตนเอง
@ApiTags('Member Profile')
@Controller('member')
export class MemberProfileController {
  constructor(private readonly memberService: MemberService) {}

  // แก้ไขข้อมูลส่วนตัว — member หรือ admin ทำได้ ระบุ :id ของสมาชิกที่จะแก้
  @Patch(':id/profile')
  @HttpCode(200)
  @ApiOperation({
    description: 'Path param: :id = ID สมาชิกที่ต้องการแก้ไข\nHeader: role=member หรือ role=admin\nBody (optional fields): firstName, lastName, email, phone, address, dateOfBirth\nหมายเหตุ: ไม่สามารถแก้ไข role, isActive, maxBorrowLimit, borrowedBooks ผ่าน endpoint นี้ได้',
  })
  @ApiHeader({ name: 'role', description: 'member หรือ admin', required: true })
  updateProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @Headers('role') role: string,
  ) {
    if (role !== MemberRole.MEMBER && role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only members can edit their own profile');
    }
    return this.memberService.updateProfile(+id, updateProfileDto);
  }
}

