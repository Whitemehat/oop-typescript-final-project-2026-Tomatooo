import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMemberDto {
    @ApiProperty({ example: 'John', description: 'ชื่อจริง' })
    @IsString()
    firstName!: string;

    @ApiProperty({ example: 'Doe', description: 'นามสกุล' })
    @IsString()
    lastName!: string;

    @ApiProperty({ example: 'john.doe@example.com', description: 'อีเมล' })
    @IsString()
    email!: string;

    @ApiProperty({ example: '0812345678', description: 'เบอร์โทรศัพท์' })
    @IsString()
    phone!: string;

    @ApiProperty({ example: '123 Bangkok', description: 'ที่อยู่' })
    @IsString()
    address!: string;

    @ApiProperty({ example: '2000-01-01', description: 'วันเกิด (YYYY-MM-DD)' })
    @IsString()
    dateOfBirth!: string;

    @ApiProperty({ example: true, description: 'สถานะการใช้งาน' })
    @IsBoolean()
    isActive!: boolean;

    @ApiProperty({ example: 3, description: 'จำนวนหนังสือที่ยืมได้สูงสุด' })
    @IsNumber()
    maxBorrowLimit!: number;
}
