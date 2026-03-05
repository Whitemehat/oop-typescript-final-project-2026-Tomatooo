import { IsArray, IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookCategory } from '../enums/book-catagories.enums';

export class CreateBookDto {
    @ApiProperty({ example: 'Dune', description: 'ชื่อหนังสือ' })
    @IsString()
    name!: string;

    @ApiProperty({ example: 'Frank Herbert', description: 'ชื่อผู้แต่ง' })
    @IsString()
    author!: string;

    @ApiProperty({ enum: BookCategory, example: BookCategory.SCIFI, description: 'หมวดหมู่หนังสือ' })
    @IsEnum(BookCategory)
    category!: BookCategory;

    @ApiProperty({ example: 'English', description: 'ภาษาของหนังสือ' })
    @IsString()
    language!: string;

    @ApiProperty({ example: '2024-01-15', description: 'วันที่อัปโหลด (YYYY-MM-DD)' })
    @IsString()
    uploadDate!: string;

    @ApiProperty({ example: false, description: 'สถานะการถูกยืม' })
    @IsBoolean()
    isRent!: boolean;

    @ApiProperty({ example: 4, description: 'คะแนนรีวิว (1-5)' })
    @IsNumber()
    star!: number;

    @ApiProperty({ type: [String], example: ['Great read!', 'Highly recommended'], description: 'รายการรีวิว' })
    @IsArray()
    @IsString({ each: true })
    review!: string[];

    @ApiProperty({ example: false, description: 'หนังสือ Early Access (ยังไม่เปิดให้ทั่วไป)' })
    @IsBoolean()
    isEarlyAccess!: boolean;
}
