import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from '../../src/member/member.service';
import { BookService } from '../../src/book/book.service';
import * as fs from 'fs';
import { ForbiddenException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
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
        expect(() => memberService.findAll('member')).toThrow(ForbiddenException);
      });

      it('guest should throw ForbiddenException', () => {
        expect(() => memberService.findAll('guest')).toThrow(ForbiddenException);
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

      it('member can access their own profile', () => {
        const member = createMockMember({ id: 1 });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        const result = memberService.findOne(1, 'member', '1');

        expect(result.id).toBe(1);
      });

      it('member accessing another member profile should throw ForbiddenException', () => {
        const members = [createMockMember({ id: 1 }), createMockMember({ id: 2 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        expect(() => memberService.findOne(2, 'member', '1')).toThrow(ForbiddenException);
      });

      it('should throw NotFoundException for non-existent member', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => memberService.findOne(999, 'admin', 'admin')).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('search', () => {
      it('admin can search members by firstName', () => {
        const members = [
          createMockMember({ id: 1, firstName: 'Alice', lastName: 'Smith' }),
          createMockMember({ id: 2, firstName: 'Bob', lastName: 'Jones' }),
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        const result = memberService.search('alice', 'admin');

        expect(result.data).toHaveLength(1);
        expect(result.data[0].firstName).toBe('Alice');
      });

      it('admin can search members by lastName', () => {
        const members = [
          createMockMember({ id: 1, firstName: 'Alice', lastName: 'Smith' }),
          createMockMember({ id: 2, firstName: 'Bob', lastName: 'Smith' }),
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        const result = memberService.search('smith', 'admin');

        expect(result.data).toHaveLength(2);
      });

      it('admin can search members by id', () => {
        const members = [createMockMember({ id: 1 }), createMockMember({ id: 2 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        const result = memberService.search('2', 'admin');

        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe(2);
      });

      it('search returns No data found message when no match', () => {
        const members = [createMockMember({ id: 1, firstName: 'Alice' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        const result = memberService.search('zzz', 'admin');

        expect(result.data).toHaveLength(0);
        expect(result.responseMessage).toBe('No data found');
      });

      it('search responseMessage contains member name and email when found', () => {
        const members = [createMockMember({ id: 1, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        const result = memberService.search('alice', 'admin');

        expect(result.responseMessage).toContain('Alice Smith');
        expect(result.responseMessage).toContain('alice@example.com');
        expect(result.responseMessage).toContain('[ID 1]');
      });

      it('non-admin should throw ForbiddenException on search', () => {
        expect(() => memberService.search('Alice', 'member')).toThrow(ForbiddenException);
      });
    });

    // ------------------------------------------
    describe('create', () => {
      it('should create member and force role to member regardless of input', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        const dto = {
          firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com',
          phone: '999', address: '456 Road', dateOfBirth: '2000-01-01',
          isActive: true, maxBorrowLimit: 3,
        };
        const result = memberService.create(dto as any);

        expect(result.role).toBe('member');
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

      it('should throw ConflictException if email already exists', () => {
        const existing = [createMockMember({ id: 1, email: 'duplicate@example.com' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(existing));

        const dto = {
          firstName: 'Other', lastName: 'Person', email: 'duplicate@example.com',
          phone: '222', address: 'Addr', dateOfBirth: '2000-01-01',
          isActive: true, maxBorrowLimit: 2,
        };

        expect(() => memberService.create(dto as any)).toThrow(ConflictException);
      });

      it('should throw ConflictException for case-insensitive duplicate email', () => {
        const existing = [createMockMember({ id: 1, email: 'user@example.com' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(existing));

        const dto = {
          firstName: 'Other', lastName: 'Person', email: 'USER@EXAMPLE.COM',
          phone: '333', address: 'Addr', dateOfBirth: '2000-01-01',
          isActive: true, maxBorrowLimit: 2,
        };

        expect(() => memberService.create(dto as any)).toThrow(ConflictException);
      });
    });

    // ------------------------------------------
    describe('update', () => {
      it('admin can update specific member fields', () => {
        const existing = [createMockMember({ id: 1, firstName: 'John', maxBorrowLimit: 2 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(existing));

        const result = memberService.update('1', { maxBorrowLimit: 5 } as any, 'admin');

        expect(result.data.maxBorrowLimit).toBe(5);
        expect(result.data.firstName).toBe('John'); // untouched fields preserved
        expect(result.data.id).toBe(1);             // id preserved
        expect(result.responseMessage).toBe('Updated Member ID 1 Successfully');
      });

      it('admin can update by name query', () => {
        const existing = [createMockMember({ id: 1, firstName: 'John', lastName: 'Doe' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(existing));

        const result = memberService.update('john', { maxBorrowLimit: 5 } as any, 'admin');

        expect(result.data.id).toBe(1);
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => memberService.update('1', {} as any, 'member')).toThrow(ForbiddenException);
      });

      it('updating a non-existent member should throw NotFoundException', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => memberService.update('999', {} as any, 'admin')).toThrow(NotFoundException);
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
        const result = memberService.replace('1', dto as any, 'admin');

        expect(result.data.firstName).toBe('NewName');
        expect(result.data.id).toBe(1);                       // preserved
        expect(result.data.role).toBe('admin');               // preserved
        expect(result.data.memberSince).toBe('2025-01-01');   // preserved
        expect(result.data.borrowedBooks).toEqual([10, 20]);  // preserved
        expect(result.responseMessage).toBe('Replaced Member ID 1 Successfully');
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => memberService.replace('1', {} as any, 'member')).toThrow(ForbiddenException);
      });

      it('replacing a non-existent member should throw NotFoundException', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => memberService.replace('999', {} as any, 'admin')).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('remove', () => {
      it('admin can remove a member and remaining members are resequenced', () => {
        const members = [
          createMockMember({ id: 1, email: 'keep1@example.com' }),
          createMockMember({ id: 2, email: 'delete@example.com' }),
          createMockMember({ id: 3, email: 'keep3@example.com' }),
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        memberService.remove('2', 'admin');

        const written = (fs.writeFileSync as jest.Mock).mock.calls[0][1];
        const saved = JSON.parse(written);
        expect(saved.find((m: any) => m.email === 'delete@example.com')).toBeUndefined();
        expect(saved).toHaveLength(2);
        expect(saved[0].id).toBe(1);
        expect(saved[1].id).toBe(2); // resequenced from 3 → 2
        expect(saved[1].email).toBe('keep3@example.com');
      });

      it('admin can remove a member and get success message', () => {
        const members = [createMockMember({ id: 1 }), createMockMember({ id: 2, email: 'del@example.com' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        const result = memberService.remove('2', 'admin');

        expect(result.responseMessage).toBe('Deleted Member ID 2 Successfully');
        expect(result.data).toBeNull();
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => memberService.remove('1', 'member')).toThrow(ForbiddenException);
      });

      it('removing a non-existent member should throw NotFoundException', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([createMockMember({ id: 5 })]));

        expect(() => memberService.remove('999', 'admin')).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('updateProfile', () => {
      it('member can update their own firstName and lastName', () => {
        const members = [createMockMember({ id: 1, firstName: 'John', lastName: 'Doe' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        const result = memberService.updateProfile(1, { firstName: 'Jane', lastName: 'Smith' });

        expect(result.data.firstName).toBe('Jane');
        expect(result.data.lastName).toBe('Smith');
        expect(result.data.id).toBe(1);
        expect(result.responseMessage).toBe('Updated Member ID 1 Successfully');
      });

      it('member can update email if not taken', () => {
        const members = [
          createMockMember({ id: 1, email: 'old@example.com' }),
          createMockMember({ id: 2, email: 'other@example.com' }),
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        const result = memberService.updateProfile(1, { email: 'new@example.com' });

        expect(result.data.email).toBe('new@example.com');
      });

      it('should throw ConflictException when updating to an already-taken email', () => {
        const members = [
          createMockMember({ id: 1, email: 'old@example.com' }),
          createMockMember({ id: 2, email: 'taken@example.com' }),
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        expect(() => memberService.updateProfile(1, { email: 'taken@example.com' })).toThrow(ConflictException);
      });

      it('should throw NotFoundException when member does not exist', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => memberService.updateProfile(999, { firstName: 'New' })).toThrow(NotFoundException);
      });

      it('should only update provided fields, leaving others unchanged', () => {
        const members = [createMockMember({ id: 1, firstName: 'John', phone: '123', address: 'Old Addr' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(members));

        const result = memberService.updateProfile(1, { firstName: 'Jane' });

        expect(result.data.firstName).toBe('Jane');
        expect(result.data.phone).toBe('123');       // unchanged
        expect(result.data.address).toBe('Old Addr'); // unchanged
      });
    });

    // ------------------------------------------
    describe('borrowBook', () => {
      it('should successfully borrow a book as member', () => {
        const member = createMockMember({ id: 1 });
        const book = createMockBook({ id: 101, isRent: false });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        mockBookService.findOne.mockReturnValue(book);

        const result = memberService.borrowBook(1, 101, 'member');

        expect(result.borrowedBooks).toContain(101);
        expect(mockBookService.setRentStatus).toHaveBeenCalledWith(101, true);
        expect(fs.writeFileSync).toHaveBeenCalled();
      });

      it('admin can borrow on behalf of another member', () => {
        const member = createMockMember({ id: 2 });
        const book = createMockBook({ id: 50, isRent: false });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        mockBookService.findOne.mockReturnValue(book);

        const result = memberService.borrowBook(2, 50, 'admin');

        expect(result.borrowedBooks).toContain(50);
        expect(mockBookService.setRentStatus).toHaveBeenCalledWith(50, true);
      });

      it('guest trying to borrow should throw ForbiddenException', () => {
        expect(() => memberService.borrowBook(1, 101, 'guest')).toThrow(ForbiddenException);
      });

      it('should throw NotFoundException if member does not exist', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => memberService.borrowBook(999, 101, 'admin')).toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if account is inactive', () => {
        const member = createMockMember({ id: 1, isActive: false });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        expect(() => memberService.borrowBook(1, 101, 'member')).toThrow(ForbiddenException);
      });

      it('should throw ForbiddenException if maxBorrowLimit is reached', () => {
        const member = createMockMember({ id: 1, maxBorrowLimit: 1, borrowedBooks: [999] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        expect(() => memberService.borrowBook(1, 101, 'member')).toThrow(ForbiddenException);
      });

      it('should throw BadRequestException if member already has this book in their list', () => {
        const member = createMockMember({ id: 1, borrowedBooks: [101] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        expect(() => memberService.borrowBook(1, 101, 'member')).toThrow(BadRequestException);
      });

      it('should throw BadRequestException if book is already rented by someone else', () => {
        const member = createMockMember({ id: 1 });
        const rentedBook = createMockBook({ id: 101, isRent: true });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        mockBookService.findOne.mockReturnValue(rentedBook);

        expect(() => memberService.borrowBook(1, 101, 'member')).toThrow(BadRequestException);
      });
    });

    // ------------------------------------------
    describe('returnBook', () => {
      it('should successfully return a book as member', () => {
        const member = createMockMember({ id: 1, borrowedBooks: [101] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        mockBookService.findOne.mockReturnValue(createMockBook({ id: 101 }));

        const result = memberService.returnBook(1, 101, 'member');

        expect(result.borrowedBooks).not.toContain(101);
        expect(mockBookService.setRentStatus).toHaveBeenCalledWith(101, false);
        expect(fs.writeFileSync).toHaveBeenCalled();
      });

      it('should only remove the returned book and leave others in borrowedBooks', () => {
        const member = createMockMember({ id: 1, borrowedBooks: [50, 101, 200] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));
        mockBookService.findOne.mockReturnValue(createMockBook({ id: 101 }));

        const result = memberService.returnBook(1, 101, 'member');

        expect(result.borrowedBooks).toEqual([50, 200]);
      });

      it('guest trying to return should throw ForbiddenException', () => {
        expect(() => memberService.returnBook(1, 101, 'guest')).toThrow(ForbiddenException);
      });

      it('should throw NotFoundException if member does not exist', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => memberService.returnBook(999, 101, 'admin')).toThrow(NotFoundException);
      });

      it('should throw BadRequestException if book is not in member borrowedBooks', () => {
        const member = createMockMember({ id: 1, borrowedBooks: [55] });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([member]));

        expect(() => memberService.returnBook(1, 99, 'member')).toThrow(BadRequestException);
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
    describe('search', () => {
      it('should find books by partial name (case-insensitive)', () => {
        const books = [
          createMockBook({ id: 1, name: 'Clean Code' }),
          createMockBook({ id: 2, name: 'The Clean Architecture' }),
          createMockBook({ id: 3, name: 'Dune' }),
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.search('clean');

        expect(result.data).toHaveLength(2);
      });

      it('should find book by exact id', () => {
        const books = [createMockBook({ id: 1 }), createMockBook({ id: 2, name: 'Target Book', author: 'Auth' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.search('2');

        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe(2);
      });

      it('should return No data found message when no match', () => {
        const books = [createMockBook({ id: 1, name: 'Clean Code' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.search('zzz');

        expect(result.data).toHaveLength(0);
        expect(result.responseMessage).toBe('No data found');
      });

      it('responseMessage contains book name and author when found', () => {
        const books = [createMockBook({ id: 1, name: 'Clean Code', author: 'Robert C. Martin' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.search('clean code');

        expect(result.responseMessage).toContain('Clean Code');
        expect(result.responseMessage).toContain('Robert C. Martin');
        expect(result.responseMessage).toContain('[ID 1]');
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
        expect(() => bookService.create(createMockBook() as any, 'member')).toThrow(ForbiddenException);
      });
    });

    // ------------------------------------------
    describe('findOneByQuery', () => {
      it('should find book by numeric id string', () => {
        const books = [createMockBook({ id: 1 }), createMockBook({ id: 2, name: 'Other Book' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.findOneByQuery('2');

        expect(result.id).toBe(2);
      });

      it('should find book by partial name (case-insensitive)', () => {
        const books = [createMockBook({ id: 1, name: 'Clean Code' }), createMockBook({ id: 2, name: 'Dune' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.findOneByQuery('clean code');

        expect(result.id).toBe(1);
      });

      it('should throw NotFoundException when no book matches', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([createMockBook({ id: 1, name: 'Clean Code' })]));

        expect(() => bookService.findOneByQuery('Dune')).toThrow(NotFoundException);
      });

      it('should throw BadRequestException when multiple books match the name', () => {
        const books = [
          createMockBook({ id: 1, name: 'Clean Code' }),
          createMockBook({ id: 2, name: 'Clean Architecture' }),
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        expect(() => bookService.findOneByQuery('clean')).toThrow(BadRequestException);
      });
    });

    // ------------------------------------------
    describe('update', () => {
      it('admin should update specified fields only and preserve the rest', () => {
        const books = [createMockBook({ id: 1, name: 'Old Name', star: 3 })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.update('1', { name: 'New Name' } as any, 'admin');

        expect(result.data.name).toBe('New Name');
        expect(result.data.star).toBe(3);   // unchanged
        expect(result.data.id).toBe(1);     // id preserved
        expect(result.responseMessage).toBe('Updated Book ID 1 Successfully');
      });

      it('admin can update by partial name', () => {
        const books = [createMockBook({ id: 1, name: 'Clean Code' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const result = bookService.update('Clean Code', { star: 4 } as any, 'admin');

        expect(result.data.star).toBe(4);
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => bookService.update('1', {} as any, 'member')).toThrow(ForbiddenException);
      });

      it('updating a non-existent book should throw NotFoundException', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => bookService.update('999', {} as any, 'admin')).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('replace', () => {
      it('admin should fully replace book data while preserving id', () => {
        const books = [createMockBook({ id: 1, name: 'Old Name' })];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(books));

        const newData = createMockBook({ name: 'Brand New Book' });
        const result = bookService.replace('1', newData as any, 'admin');

        expect(result.data.name).toBe('Brand New Book');
        expect(result.data.id).toBe(1);
        expect(result.responseMessage).toBe('Replaced Book ID 1 Successfully');
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => bookService.replace('1', createMockBook() as any, 'member')).toThrow(ForbiddenException);
      });

      it('replacing a non-existent book should throw NotFoundException', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        expect(() => bookService.replace('999', createMockBook() as any, 'admin')).toThrow(NotFoundException);
      });
    });

    // ------------------------------------------
    describe('remove', () => {
      it('admin should remove the correct book and resequence remaining ids', () => {
        const books = [
          createMockBook({ id: 1, name: 'Book One' }),
          createMockBook({ id: 2, name: 'Book Delete' }),
          createMockBook({ id: 3, name: 'Book Three' }),
        ];
        // findOneByQuery reads books, remove body reads books, then readMembers()
        (fs.readFileSync as jest.Mock)
          .mockReturnValueOnce(JSON.stringify(books))  // findOneByQuery - books
          .mockReturnValueOnce(JSON.stringify(books))  // remove body - books
          .mockReturnValueOnce(JSON.stringify([]));     // readMembers()

        bookService.remove('2', 'admin');

        const written = (fs.writeFileSync as jest.Mock).mock.calls[0][1];
        const saved = JSON.parse(written);
        expect(saved.find((b: any) => b.name === 'Book Delete')).toBeUndefined();
        expect(saved).toHaveLength(2);
        expect(saved[0].id).toBe(1);
        expect(saved[1].id).toBe(2); // resequenced from 3 → 2
        expect(saved[1].name).toBe('Book Three');
      });

      it('admin should remove a book and return success message', () => {
        const books = [createMockBook({ id: 1 }), createMockBook({ id: 2, name: 'Delete Me' })];
        (fs.readFileSync as jest.Mock)
          .mockReturnValueOnce(JSON.stringify(books))
          .mockReturnValueOnce(JSON.stringify(books))
          .mockReturnValueOnce(JSON.stringify([]));

        const result = bookService.remove('2', 'admin');

        expect(result.responseMessage).toBe('Deleted Book ID 2 Successfully');
        expect(result.data).toBeNull();
      });

      it('non-admin should throw ForbiddenException', () => {
        expect(() => bookService.remove('1', 'member')).toThrow(ForbiddenException);
      });

      it('removing a non-existent book should throw NotFoundException', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([createMockBook({ id: 1 })]));

        expect(() => bookService.remove('999', 'admin')).toThrow(NotFoundException);
      });

      it('should update borrowedBooks in members when book ids change after removal', () => {
        const books = [createMockBook({ id: 1 }), createMockBook({ id: 2 }), createMockBook({ id: 3 })];
        const members = [createMockMember({ id: 1, borrowedBooks: [3] })];
        // findOneByQuery reads books, remove body reads books, then readMembers()
        (fs.readFileSync as jest.Mock)
          .mockReturnValueOnce(JSON.stringify(books))   // findOneByQuery
          .mockReturnValueOnce(JSON.stringify(books))   // remove body
          .mockReturnValueOnce(JSON.stringify(members)); // readMembers()

        bookService.remove('1', 'admin');

        // Second writeFileSync call is members.json
        const writeCalls = (fs.writeFileSync as jest.Mock).mock.calls;
        const savedMembers = JSON.parse(writeCalls[1][1]);
        // old book 3 → new book 2 (after removing book 1, ids become [1,2])
        expect(savedMembers[0].borrowedBooks).toContain(2);
        expect(savedMembers[0].borrowedBooks).not.toContain(3);
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
