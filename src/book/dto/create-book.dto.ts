import { IsEnum , IsString } from 'class-validator';
import { BookCategory } from '../enums/book-catagories.enums';

export class CreateBookDto {
    @IsString()
    name!: string;
    @IsString()
    author!: string;
    @IsEnum(BookCategory)
    category!: BookCategory;
    @IsString()
    language!: string;
}
