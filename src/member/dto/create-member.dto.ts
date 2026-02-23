import { IsArray, IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';
import { MemberRole } from '../enums/member-role.enums';

export class CreateMemberDto {
    @IsString()
    firstName!: string;

    @IsString()
    lastName!: string;

    @IsString()
    email!: string;

    @IsString()
    phone!: string;

    @IsEnum(MemberRole)
    role!: MemberRole;

    @IsString()
    address!: string;

    @IsString()
    dateOfBirth!: string;

    @IsString()
    memberSince!: string;

    @IsBoolean()
    isActive!: boolean;

    @IsArray()
    @IsNumber({}, { each: true })
    borrowedBooks!: number[];

    @IsNumber()
    maxBorrowLimit!: number;
}
