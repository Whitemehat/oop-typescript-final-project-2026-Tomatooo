export const createMockBook = (overrides = {}) => ({
  id: 1,
  name: 'Clean Code',
  author: 'Robert C. Martin',
  category: 'Education',
  language: 'English',
  uploadDate: '2026-03-01',
  isRent: false,
  star: 5,
  review: [],
  isEarlyAccess: false,
  ...overrides,
});

export const createMockMember = (overrides = {}) => ({
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '123456789',
  address: '123 TS Lane',
  dateOfBirth: '1995-01-01',
  isActive: true,
  maxBorrowLimit: 2,
  role: 'member',
  memberSince: '2026-01-01',
  borrowedBooks: [],
  ...overrides,
});