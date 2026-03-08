import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'John', description: 'ชื่อจริง' })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional({ example: 'Doe', description: 'นามสกุล' })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'อีเมล' })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ example: '0812345678', description: 'เบอร์โทรศัพท์' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: '123 Bangkok', description: 'ที่อยู่' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ example: '2000-01-01', description: 'วันเกิด (YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    dateOfBirth?: string;
}
