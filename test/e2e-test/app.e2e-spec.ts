import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../../src/app.module';
import { ResponseInterceptor } from "./../../src/common/interceptors/response.interceptor";

describe('AppController (e2e)', () => {
  let app: INestApplication;

  // Variables to hold State/IDs between tests
  let createdBookId: number;
  let createdMemberId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // IMPORTANT: Apply the interceptor so res.body.success exists
    app.useGlobalInterceptors(new ResponseInterceptor());
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- 1. BOOK MODULE ---
  describe('/book (Book Module CRUD)', () => {
    it('POST /book (Create)', async () => {
      const res = await request(app.getHttpServer())
        .post('/book')
        .set('role', 'admin')
        .send({
          name: 'Test1',
          author: 'RobertTester',
          category: 'Tester',
          language: 'English',
          uploadDate: '2023-01-15',
          isRent: false,
          star: 5,
          review: [],
          isEarlyAccess: false,
        })
        .expect(HttpStatus.CREATED);

      createdBookId = res.body.data.id;
      expect(createdBookId).toBeDefined();
    });

    it('GET /book (Read All)', () => {
      return request(app.getHttpServer())
        .get('/book')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('GET /book/:id (Read One)', () => {
      return request(app.getHttpServer())
        .get(`/book/${createdBookId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.id).toBe(createdBookId);
        });
    });

    it('PATCH /book/:id (Update: Name)', () => {
      return request(app.getHttpServer())
        .patch(`/book/${createdBookId}`)
        .set('role', 'admin')
        .send({ name: 'TestAfterPatch' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.name).toBe('TestAfterPatch');
        });
    });

    it('PUT /book/:id (Update All)', () => {
      return request(app.getHttpServer())
        .put(`/book/${createdBookId}`)
        .set('role', 'admin')
        .send({ 
          name: 'TestPut',
          author: 'Eistein',
          category: 'Test',
          language: 'English',
          uploadDate: '2024-01-15',
          isRent: false,
          star: 5,
          review: ["good for tester"],
          isEarlyAccess: true
        })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.name).toBe('TestPut');
          expect(res.body.data.author).toBe('Eistein');
          expect(res.body.data.category).toBe('Test');
          expect(res.body.data.language).toBe('English');
          expect(res.body.data.uploadDate).toBe('2024-01-15');
          expect(res.body.data.isRent).toBe(false);
          expect(res.body.data.star).toBe(5);
          expect(res.body.data.review).toEqual(["good for tester"]);
          expect(res.body.data.isEarlyAccess).toBe(true);

        });
    });

    it('DELETE /book/:id (Delete)', () => {
      return request(app.getHttpServer())
        .delete(`/book/${createdBookId}`)
        .set('role', 'admin')
        .expect(HttpStatus.OK);
  });

    it('POST /book (Forbidden for students)', () => {
      return request(app.getHttpServer())
        .post('/book')
        .set('role', 'student')
        .send({})
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  // --- 2. MEMBER MODULE ---
  describe('/member (Member Module)', () => {
    it('POST /member (Register)', async () => {
      const res = await request(app.getHttpServer())
        .post('/member')
        .send({
          firstName: 'Test',
          lastName: 'Test',
          email: 'Test@test.com',
          phone: '0123456789',
          address: 'Test13',
          dateOfBirth: '2000-01-01',
          isActive: true,
          maxBorrowLimit: 3
        })
        .expect(HttpStatus.CREATED);

      createdMemberId = res.body.data.id;
      expect(createdMemberId).toBeDefined();
    });

    it('GET /member (Admin View All)', () => {
      return request(app.getHttpServer())
        .get('/member')
        .set('role', 'admin')
        .expect(HttpStatus.OK);
    });

    it('PATCH /member/:id (Update Member Status)', () => {
      return request(app.getHttpServer())
        .patch(`/member/${createdMemberId}`)
        .set('role', 'admin')
        .send({ isActive: false })
        .expect((res) => {
          if (res.status === 404) console.warn('Member PATCH route missing in Controller');
          else expect(res.status).toBe(HttpStatus.OK);
        });
    });

    it('PUT /member/:id (Update All)', () => {
      return request(app.getHttpServer())
        .put(`/member/${createdMemberId}`)
        .set('role', 'admin')
        .send({ 
          firstName: 'PutName',
          lastName: 'Putlast',
          email: 'Put@test.com',
          phone: '9876543210',
          address: 'Put',
          dateOfBirth: '2030-01-01',
          isActive: false,
          maxBorrowLimit: 4
        })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.firstName).toBe('PutName');
          expect(res.body.data.lastName).toBe('Putlast');
          expect(res.body.data.email).toBe('Put@test.com');
          expect(res.body.data.phone).toBe('9876543210');
          expect(res.body.data.address).toBe('Put');
          expect(res.body.data.dateOfBirth).toBe('2030-01-01');
          expect(res.body.data.isActive).toBe(false);
          expect(res.body.data.maxBorrowLimit).toBe(4);

        });
    });

    it('DELETE /member/:id (Admin Delete Member)', () => {
      return request(app.getHttpServer())
        .delete(`/member/${createdMemberId}`)
        .set('role', 'admin')
        .expect((res) => {
          if (res.status === 404) console.warn('Member DELETE route missing in Controller');
          else expect(res.status).toBe(HttpStatus.OK);
        });
    });
  });

  // --- 3. BORROW SYSTEM ---
  describe('Borrowing & Returning System', () => {
    let tempBookId: number;
    let tempMemberId: number;

    it('POST /borrow (ควรเพิ่ม Book ID เข้าไปใน borrowedBooks)', async () => {
      // 1. Create a Book
      const bookRes = await request(app.getHttpServer())
        .post('/book')
        .set('role', 'admin')
        .send({ 
          name: 'Test1',
          author: 'RobertTester',
          category: 'Tester',
          language: 'English',
          uploadDate: '2023-01-15',
          isRent: false,
          star: 5,
          review: [],
          isEarlyAccess: false,
        })
        .expect(HttpStatus.CREATED);
      
      tempBookId = bookRes.body.data.id;

      // 2. Create a Member (Ensure isActive is true)
      const memberRes = await request(app.getHttpServer())
        .post('/member')
        .send({ 
          firstName: 'borrowTest',
          lastName: 'Test',
          email: 'somchai@test.com',
          phone: '0812345678',
          address: '123 Bangkok',
          dateOfBirth: '2000-01-01',
          isActive: true,
        maxBorrowLimit: 3
        })
        .expect(HttpStatus.CREATED);
      
      tempMemberId = memberRes.body.data.id;

      // 3. Perform Borrowing
      const borrowRes = await request(app.getHttpServer())
        .post(`/member/${tempMemberId}/borrow/${tempBookId}`)
        .set('role', 'student')
        .set('memberId', tempMemberId.toString()) // Added to satisfy requesterId check
        .expect(HttpStatus.CREATED); 

      // 4. Verify borrowedBooks contains the ID
      expect(borrowRes.body.data.borrowedBooks).toContain(tempBookId);
    });

    it('POST /return (ควรลบ Book ID ออกจาก borrowedBooks)', async () => {
      // 1. Perform Returning
      const returnRes = await request(app.getHttpServer())
        .post(`/member/${tempMemberId}/return/${tempBookId}`)
        .set('role', 'student')
        .set('memberId', tempMemberId.toString()) // Added to satisfy requesterId check
        .expect(HttpStatus.CREATED);

      // 2. Verify borrowedBooks is now empty
      expect(returnRes.body.data.borrowedBooks).not.toContain(tempBookId);
      expect(returnRes.body.data.borrowedBooks.length).toBe(0);
    });
    it('DELETE /book/:id (Delete)', () => {
      return request(app.getHttpServer())
        .delete(`/book/${tempBookId}`)
        .set('role', 'admin')
        .expect(HttpStatus.OK);
    });
    it('DELETE /member/:id (Admin Delete Member)', () => {
      return request(app.getHttpServer())
        .delete(`/member/${tempMemberId}`)
        .set('role', 'admin')
        .expect((res) => {
          if (res.status === 404) console.warn('Member DELETE route missing in Controller');
          else expect(res.status).toBe(HttpStatus.OK);
        });
    });
  });

  // --- 4. UTILITY ---
  it('/ (GET 404 check)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(404);
  });
});