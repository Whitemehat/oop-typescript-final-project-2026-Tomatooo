import { Module } from '@nestjs/common';
import { BookModule } from './book/book.module';
import { MemberModule } from './member/member.module';

@Module({
  imports: [BookModule, MemberModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
