import { Module } from '@nestjs/common';
import { BookController } from './book/book.controller';
import { BookModule } from './book/book.module';
import { MemberModule } from './member/member.module';

@Module({
  imports: [BookModule, MemberModule],
  controllers: [BookController],
  providers: [],
})
export class AppModule {}
