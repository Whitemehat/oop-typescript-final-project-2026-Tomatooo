import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from '../../src/member/member.service';
import { BookService } from '../../src/book/book.service';
import * as fs from 'fs';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { createMockMember, createMockBook } from './test-utenstils/mock.fac';

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

    // ------------------------------------------
    describe('findAll', () => {
      it('admin should get all members', () => {
        const members = [createMockMember({ id: 1 }), createMockMember({ id: 2 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        const result = memberService.findAll('admin');

        expect(result).toHaveLength(2);
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => memberService.findAll('student')).toThrow(ForbiddenException);
      });
    });

    // ------------------------------------------
    describe('findOne', () => {
      it('admin can access any member profile', () => {
        const members = [createMockMember({ id: 1 }), createMockMember({ id: 2 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        const result = memberService.findOne(2, 'admin', '1');

        expect(result.id).toBe(2);
      });

      it('student can access their own profile', () => {
        const member = createMockMember({ id: 1 });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        const result = memberService.findOne(1, 'student', '1');

        expect(result.id).toBe(1);
      });

      it('student accessing another member profile should throw ForbiddenException', () => {
        const members = [createMockMember({ id: 1 }), createMockMember({ id: 2 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        expect(() => memberService.findOne(2, 'student', '1')).toThrow(ForbiddenException);
      });

      it('should throw NotFoundException for non-existent member', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => memberService.findOne(999, 'admin', 'admin')).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('create', () => {
      it('should create member and force role to student regardless of input', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        const dto = {
          firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com',
          phone: '999', address: '456 Road', dateOfBirth: '2000-01-01',
          isActive: true, maxBorrowLimit: 3,
        };
        const result = memberService.create(dto as any);

        expect(result.role).toBe('student');
        expect(result.borrowedBooks).toEqual([]);
        expect(result.id).toBe(1);
      });

      it('should auto-increment id from last existing member', () => {
        const existing = [createMockMember({ id: 5 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(existing));

        const dto = {
          firstName: 'New', lastName: 'User', email: 'new@example.com',
          phone: '111', address: 'Addr', dateOfBirth: '2001-01-01',
          isActive: true, maxBorrowLimit: 2,
        };
        const result = memberService.create(dto as any);

        expect(result.id).toBe(6);
      });

      it('should set memberSince to today automatically', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        const today = new Date().toISOString().split('T')[0];
        const dto = {
          firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com',
          phone: '999', address: 'Addr', dateOfBirth: '2000-01-01',
          isActive: true, maxBorrowLimit: 3,
        };
        const result = memberService.create(dto as any);

        expect(result.memberSince).toBe(today);
      });
    });

    // ------------------------------------------
    describe('update', () => {
      it('admin can update specific member fields', () => {
        const existing = [createMockMember({ id: 1, firstName: 'John', maxBorrowLimit: 2 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(existing));

        const result = memberService.update(1, { maxBorrowLimit: 5 } as any, 'admin');

        expect(result.maxBorrowLimit).toBe(5);
        expect(result.firstName).toBe('John'); // untouched fields preserved
        expect(result.id).toBe(1);             // id preserved
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => memberService.update(1, {} as any, 'student')).toThrow(ForbiddenException);
      });

      it('updating a non-existent member should throw NotFoundException', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => memberService.update(999, {} as any, 'admin')).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('replace', () => {
      it('admin can replace a member and system fields are preserved', () => {
        const existing = [createMockMember({ id: 1, role: 'admin' as any, memberSince: '2025-01-01', borrowedBooks: [10, 20] })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(existing));

        const dto = {
          firstName: 'NewName', lastName: 'NewLast', email: 'new@example.com',
          phone: '000', address: 'New Addr', dateOfBirth: '1990-01-01',
          isActive: true, maxBorrowLimit: 2,
        };
        const result = memberService.replace(1, dto as any, 'admin');

        expect(result.firstName).toBe('NewName');
        expect(result.id).toBe(1);                       // preserved
        expect(result.role).toBe('admin');               // preserved
        expect(result.memberSince).toBe('2025-01-01');   // preserved
        expect(result.borrowedBooks).toEqual([10, 20]);  // preserved
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => memberService.replace(1, {} as any, 'student')).toThrow(ForbiddenException);
      });

      it('replacing a non-existent member should throw NotFoundException', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => memberService.replace(999, {} as any, 'admin')).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('remove', () => {
      it('admin can remove a member', () => {
        const members = [createMockMember({ id: 1 }), createMockMember({ id: 2 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        memberService.remove(1, 'admin');

        const written = (fs.writeFileSync as jest.Mock).mock.calls[0][1];
        const saved = JSON.parse(written);
        expect(saved.find((m: any) => m.id === 1)).toBeUndefined();
        expect(saved).toHaveLength(1);
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => memberService.remove(1, 'student')).toThrow(ForbiddenException);
      });

      it('removing a non-existent member should throw NotFoundException', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([createMockMember({ id: 5 })]));

        expect(() => memberService.remove(999, 'admin')).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('borrowBook', () => {
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

      it('admin can borrow on behalf of another member', () => {
        const member = createMockMember({ id: 2 });
        const book = createMockBook({ id: 50, isRent: false });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        mockBookService.findOne.mockReturnValue(book);

        const result = memberService.borrowBook(2, 50, 'admin', 'admin-id');

        expect(result.borrowedBooks).toContain(50);
        expect(mockBookService.setRentStatus).toHaveBeenCalledWith(50, true);
      });

      it('student trying to borrow for another member should throw ForbiddenException', () => {
        expect(() => memberService.borrowBook(2, 101, 'student', '1')).toThrow(ForbiddenException);
      });

      it('should throw NotFoundException if member does not exist', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => memberService.borrowBook(999, 101, 'admin', 'admin')).toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if account is inactive', () => {
        const member = createMockMember({ id: 1, isActive: false });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        expect(() => memberService.borrowBook(1, 101, 'student', '1')).toThrow(ForbiddenException);
      });

      it('should throw ForbiddenException if maxBorrowLimit is reached', () => {
        const member = createMockMember({ id: 1, maxBorrowLimit: 1, borrowedBooks: [999] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        expect(() => memberService.borrowBook(1, 101, 'student', '1')).toThrow(ForbiddenException);
      });

      it('should throw BadRequestException if member already has this book in their list', () => {
        const member = createMockMember({ id: 1, borrowedBooks: [101] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        expect(() => memberService.borrowBook(1, 101, 'student', '1')).toThrow(BadRequestException);
      });

      it('should throw BadRequestException if book is already rented by someone else', () => {
        const member = createMockMember({ id: 1 });
        const rentedBook = createMockBook({ id: 101, isRent: true });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        mockBookService.findOne.mockReturnValue(rentedBook);

        expect(() => memberService.borrowBook(1, 101, 'student', '1')).toThrow(BadRequestException);
      });
    });

    // ------------------------------------------
    describe('returnBook', () => {
      it('should successfully return a book', () => {
        const member = createMockMember({ id: 1, borrowedBooks: [101] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        mockBookService.findOne.mockReturnValue(createMockBook({ id: 101 }));

        const result = memberService.returnBook(1, 101, 'student', '1');

        expect(result.borrowedBooks).not.toContain(101);
        expect(mockBookService.setRentStatus).toHaveBeenCalledWith(101, false);
        expect(mockBookService.findOne).toHaveBeenCalledWith(101);
        expect(fs.writeFileSync).toHaveBeenCalled();
      });

      it('should only remove the returned book and leave others in borrowedBooks', () => {
        const member = createMockMember({ id: 1, borrowedBooks: [50, 101, 200] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        mockBookService.findOne.mockReturnValue(createMockBook({ id: 101 }));

        const result = memberService.returnBook(1, 101, 'student', '1');

        expect(result.borrowedBooks).toEqual([50, 200]);
      });

      it('student returning on behalf of another member should throw ForbiddenException', () => {
        expect(() => memberService.returnBook(2, 101, 'student', '1')).toThrow(ForbiddenException);
      });

      it('should throw NotFoundException if member does not exist', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => memberService.returnBook(999, 101, 'admin', 'admin')).toThrow(NotFoundException);
      });

      it('should throw BadRequestException if book is not in member borrowedBooks', () => {
        const member = createMockMember({ id: 1, borrowedBooks: [55] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        expect(() => memberService.returnBook(1, 99, 'student', '1')).toThrow(BadRequestException);
      });
    });
  });

  // ==========================================
  // BOOK SERVICE TESTS
  // ==========================================
  describe('BookService', () => {

    // ------------------------------------------
    describe('findAll', () => {
      it('should return all books', () => {
        const books = [createMockBook({ id: 1 }), createMockBook({ id: 2 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.findAll();

        expect(result).toHaveLength(2);
      });

      it('should return empty array when the data file does not exist', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);

        const result = bookService.findAll();

        expect(result).toEqual([]);
      });
    });

    // ------------------------------------------
    describe('findOne', () => {
      it('should return the correct book by id', () => {
        const books = [createMockBook({ id: 1 }), createMockBook({ id: 2, name: 'Target' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.findOne(2);

        expect(result.id).toBe(2);
        expect(result.name).toBe('Target');
      });

      it('should throw NotFoundException for a non-existent id', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => bookService.findOne(999)).toThrow(NotFoundException);
      });

      it('should throw NotFoundException when called with undefined', () => {
        expect(() => bookService.findOne(undefined as any)).toThrow(NotFoundException);
      });

      it('should throw NotFoundException when called with null', () => {
        expect(() => bookService.findOne(null as any)).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('create', () => {
      it('admin should create a book with id=1 for empty library', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);

        const dto = createMockBook();
        const result = bookService.create(dto as any, 'admin');

        expect(result.id).toBe(1);
        expect(fs.writeFileSync).toHaveBeenCalled();
      });

      it('admin should auto-increment id from last existing book', () => {
        const existing = [createMockBook({ id: 7 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(existing));

        const result = bookService.create(createMockBook() as any, 'admin');

        expect(result.id).toBe(8);
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => bookService.create(createMockBook() as any, 'student')).toThrow(ForbiddenException);
      });
    });

    // ------------------------------------------
    describe('update', () => {
      it('admin should update specified fields only and preserve the rest', () => {
        const books = [createMockBook({ id: 1, name: 'Old Name', star: 3 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.update(1, { name: 'New Name' } as any, 'admin');

        expect(result.name).toBe('New Name');
        expect(result.star).toBe(3);   // unchanged
        expect(result.id).toBe(1);     // id preserved
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => bookService.update(1, {} as any, 'student')).toThrow(ForbiddenException);
      });

      it('updating a non-existent book should throw NotFoundException', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => bookService.update(999, {} as any, 'admin')).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('replace', () => {
      it('admin should fully replace book data while preserving id', () => {
        const books = [createMockBook({ id: 1, name: 'Old Name' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const newData = createMockBook({ name: 'Brand New Book' });
        const result = bookService.replace(1, newData as any, 'admin');

        expect(result.name).toBe('Brand New Book');
        expect(result.id).toBe(1);
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => bookService.replace(1, createMockBook() as any, 'student')).toThrow(ForbiddenException);
      });

      it('replacing a non-existent book should throw NotFoundException', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => bookService.replace(999, createMockBook() as any, 'admin')).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('remove', () => {
      it('admin should remove the correct book and leave others intact', () => {
        const books = [createMockBook({ id: 1 }), createMockBook({ id: 2 }), createMockBook({ id: 3 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        bookService.remove(2, 'admin');

        const written = (fs.writeFileSync as jest.Mock).mock.calls[0][1];
        const saved = JSON.parse(written);
        expect(saved.find((b: any) => b.id === 2)).toBeUndefined();
        expect(saved).toHaveLength(2);
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => bookService.remove(1, 'student')).toThrow(ForbiddenException);
      });

      it('removing a non-existent book should throw NotFoundException', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([createMockBook({ id: 1 })]));

        expect(() => bookService.remove(999, 'admin')).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('setRentStatus', () => {
      it('should set isRent to true', () => {
        const books = [createMockBook({ id: 1, isRent: false })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.setRentStatus(1, true);

        expect(result.isRent).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalled();
      });

      it('should set isRent to false', () => {
        const books = [createMockBook({ id: 1, isRent: true })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.setRentStatus(1, false);

        expect(result.isRent).toBe(false);
      });

      it('should throw NotFoundException for a non-existent book', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => bookService.setRentStatus(999, true)).toThrow(NotFoundException);
      });
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});

// run with: npx jest library.service.spec.ts