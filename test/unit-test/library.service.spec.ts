import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from '../../src/member/member.service';
import { BookService } from '../../src/book/book.service';
import * as fs from 'fs';
import { ForbiddenException, BadRequestException,NotFoundException } from '@nestjs/common';
import { createMockMember, createMockBook } from './test-utenstils/mock.fac' ;

jest.mock('fs');

describe('Library System Services', () => {
  let memberService: MemberService;
  let bookService: BookService;

  const mockBookService = {
    findOne: jest.fn(),
    setRentStatus: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    replace: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        BookService, 
        { provide: BookService, useValue: mockBookService }, 
      ],
    }).compile();

    memberService = module.get<MemberService>(MemberService);
    bookService = new (BookService as any)(); 

    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  // ==========================================
  // MEMBER SERVICE TESTS
  // ==========================================
  describe('MemberService', () => {
    
    describe('Happy Paths', () => {
      
      it('should successfully borrow a book', () => {
        const member = createMockMember({ id: 1 });
        const book = createMockBook({ id: 101, isRent: false });
        
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        mockBookService.findOne.mockReturnValue(book);

        const result = memberService.borrowBook(1, 101, 'student', '1');

        expect(result.borrowedBooks).toContain(101);
        expect(mockBookService.setRentStatus).toHaveBeenCalledWith(101, true);
        expect(fs.writeFileSync).toHaveBeenCalled();
      });

      it('should successfully return a book', () => {
        const member = createMockMember({ id: 1, borrowedBooks: [101] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        mockBookService.findOne.mockReturnValue(createMockBook({ id: 101 }));

        const result = memberService.returnBook(1, 101, 'student', '1');

        expect(result.borrowedBooks).not.toContain(101);
        expect(mockBookService.setRentStatus).toHaveBeenCalledWith(101, false);
      });
    });

    describe('Edge Cases', () => {

      it('should throw Forbidden if account is inactive', () => {
        const member = createMockMember({ id: 1, isActive: false });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        
        expect(() => memberService.borrowBook(1, 101, 'student', '1')).toThrow(ForbiddenException);
      });

      it('should throw Forbidden if maxBorrowLimit is reached', () => {
        const member = createMockMember({ maxBorrowLimit: 1, borrowedBooks: [999] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        expect(() => memberService.borrowBook(1, 101, 'student', '1')).toThrow(ForbiddenException);
      });


      it('Borrowing: should throw BadRequest if book is already rented', () => {
        const member = createMockMember();
        const rentedBook = createMockBook({ isRent: true });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        mockBookService.findOne.mockReturnValue(rentedBook);

        expect(() => memberService.borrowBook(1, 101, 'student', '1')).toThrow(BadRequestException);
      });

      it('Returning: should throw BadRequest if returning a book not in member list', () => {
        const member = createMockMember({ borrowedBooks: [55] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        expect(() => memberService.returnBook(1, 99, 'student', '1')).toThrow(BadRequestException);
      });
    });
  });
});
//run with npx jest member.service.spec.ts