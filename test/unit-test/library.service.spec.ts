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
        MemberService,BookService, 
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
    
    describe('Borrowing & Returning Logic', () => {
      
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

  // ==========================================
  // MEMBER SERVICE TESTS
  // ==========================================

  describe('BookService', () => {
    
    describe('Happy Paths', () => {

      it('should find all books', () => {
        const books = [createMockBook({ id: 1 }), createMockBook({ id: 2 })];
        
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.findAll();
        
        expect(result.length).toBe(2);
      });
    });

    describe('Edge Cases', () => {

      it('should throw Forbidden if non-admin tries to create a book', () => {
        const dto = createMockBook();

        expect(() => bookService.create(dto as any, 'student')).toThrow(ForbiddenException);
      });

      it('should throw NotFound if book does not exist', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => bookService.findOne(999)).toThrow(NotFoundException);
      });

      it('should throw NotFound if findOne is called wit hno ID', () => {
        expect(() => bookService.findOne(undefined as any)).toThrow(NotFoundException);
      });
    });
  });

  afterAll(async () => {
  jest.restoreAllMocks(); // Cleans up all mocks
});

});


//run with npx jest library.service.spec.ts
//also changed the jest's rootdir to have all access to files the project 
//also changed the test's script to '--forceExit'