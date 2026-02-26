import { IsEnum, IsNumber, IsString } from 'class-validator';
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

    @IsString()
    date!: string;

    @IsString()
    isbn!: string;

    @IsString()
    publisher!: string;

    @IsNumber()
    totalPages!: number;

    @IsNumber()
    availableCopies!: number;

    @IsNumber()
    totalCopies!: number;

    @IsString()
    description!: string;
}
