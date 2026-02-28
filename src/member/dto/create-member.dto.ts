import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateMemberDto {
    @IsString()
    firstName!: string;

    @IsString()
    lastName!: string;

    @IsString()
    email!: string;

    @IsString()
    phone!: string;

    @IsString()
    address!: string;

    @IsString()
    dateOfBirth!: string;

    @IsBoolean()
    isActive!: boolean;

    @IsNumber()
    maxBorrowLimit!: number;
}
