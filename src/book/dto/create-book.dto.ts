import { IsEnum , IsString , IsBoolean , IsNumber, IsArray , IsDateString} from 'class-validator';
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
    @IsDateString()
    uploadDate!: string;
    @IsBoolean()
    isRent! : boolean;
    @IsNumber()
    @Type(() => Number)
    star!: number;
    @IsArray()
    @IsString({ each: true })
    review!: string[];
    @IsBoolean()
    isEarlyAccess!: boolean;
    
}
