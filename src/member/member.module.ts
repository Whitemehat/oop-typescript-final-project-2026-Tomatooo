import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { MemberProfileController } from './member.profile.controller';
import { BookModule } from '../book/book.module';

@Module({
  imports: [BookModule],
  // MemberProfileController ต้องอยู่ก่อน MemberController เพื่อให้ PATCH /member/:id/profile
  // ได้รับการ match ก่อน PATCH /member/:query
  controllers: [MemberProfileController, MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
