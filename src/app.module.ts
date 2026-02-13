import { Module } from '@nestjs/common';
import { BookController } from './book/book.controller';
import { BookModule } from './book/book.module';

@Module({
  imports: [BookModule],
  controllers: [BookController],
  providers: [],
})
export class AppModule {}
