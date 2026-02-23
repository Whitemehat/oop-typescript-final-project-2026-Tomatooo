import { MemberRole } from '../enums/member-role.enums';

export interface Member {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: MemberRole;
    address: string;
    dateOfBirth: string;
    memberSince: string;
    isActive: boolean;
    borrowedBooks: number[];
    maxBorrowLimit: number;
}
