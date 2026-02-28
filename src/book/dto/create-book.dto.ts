import { IsArray, IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';
import { BookCategory } from '../enums/book-catagories.enums';
import { Type } from 'class-transformer';

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
    uploadDate!: string;

    @IsBoolean()
    isRent!: boolean;

    @IsNumber()
    star!: number;

    @IsArray()
    @IsString({ each: true })
    review!: string[];

    @IsBoolean()
    isEarlyAccess!: boolean;
}
