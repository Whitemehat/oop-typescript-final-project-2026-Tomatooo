import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from '../../src/member/member.service';
import { BookService } from '../../src/book/book.service';
import * as fs from 'fs';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { createMockMember, createMockBook } from './test-utenstils/mock.fac' ;

jest.mock('fs');

describe('MemberService', () => {
  let service: MemberService;
  let bookService: BookService;

  const mockBookService = {
    findOne: jest.fn(),
    setRentStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: BookService, useValue: mockBookService },
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
    bookService = module.get<BookService>(BookService);

    jest.clearAllMocks();
  });

  describe('BorrowBook Logic', () => {
    it('should throw ForbiddenException if member is inactive', () => {
      const inactiveMember = createMockMember({ id: 1, isActive: false });
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([inactiveMember]));

      expect(() => 
        service.borrowBook(1, 101, 'student', '1')
      ).toThrow(ForbiddenException);
    });

    it('should successfully borrow and update book status', () => {
      const member = createMockMember({ id: 1, borrowedBooks: [] });
      const book = createMockBook({ id: 101, isRent: false });
      
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
      mockBookService.findOne.mockReturnValue(book);


      const result = service.borrowBook(1, 101, 'student', '1');

      expect(result.borrowedBooks).toContain(101); //check if bookId registered
      expect(mockBookService.setRentStatus).toHaveBeenCalledWith(101, true); //check if isRent status is changed
      expect(fs.writeFileSync).toHaveBeenCalled(); //check if changes were saved
    });
  });

  describe('MemberService BadRequest Cases', () =>{

    it('Borrowing:should throw BadRequest if book is already rented', () => {
      const member = createMockMember({ id: 1 });
      const rentedBook = createMockBook({ id: 101, isRent: true });
      
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
      mockBookService.findOne.mockReturnValue(rentedBook);

      expect(() => 
        service.borrowBook(1, 101, 'student', '1')
      ).toThrow(BadRequestException);
    });

    it('Returning: should throw BadRequest if the member never borrowed the book', () =>{
        const member = createMockMember({id:1,borrowedBooks:[55]});
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        expect(() =>
            service.returnBook(1,99,'student','1')
        ).toThrow(BadRequestException);
    });

});
});

//run with npx jest member.service.spec.ts
