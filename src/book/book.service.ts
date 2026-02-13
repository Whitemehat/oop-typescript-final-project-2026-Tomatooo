import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './interfaces/book.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BookService {
  private filePath = path.join(__dirname, '../../data/books.json');

  private readFile(): Book[]{
    const data = fs.readFileSync(this.filePath, 'utf-8');
    return JSON.parse(data || 'No data');
  }

  private writeFile(data: Book[]): void{
    fs.writeFileSync(this.filePath, JSON.stringify(data, null , 2));
  }

  findAll() {
    return this.readFile();
  }

  findOne(id: number) {
    const books = this.readFile();
    const book = books.find(book => book.id === id);
    if(!book) throw new NotFoundException('Book not found')
    return book;
  }

  create(createBookDto: CreateBookDto): Book {
    const books = this.readFile();
    
    const newBook: Book = {
      //if books is not empty the get books id and + 1 , if books empty start with index 1
      id: books.length ? books[books.length - 1].id + 1 : 1, ...createBookDto
    };
    //add new books object books and then write it to json
    books.push(newBook);
    this.writeFile(books);
    return newBook;
  }

  update(id: number, updateBookDto: UpdateBookDto, member: string): Book {
    if(member === 'admin'){
      const books = this.readFile();
      const indexUpdate = books.findIndex(book => book.id === id);
      if(indexUpdate > -1){
        /* this create the object name updateBook 
        that copy the book that we want to update 
        and update the values that we want to update*/
        const updateBook: Book = {
          ...books[indexUpdate],
          ...updateBookDto,
          id: books[indexUpdate].id          
        }
        books[indexUpdate] = updateBook;
        this.writeFile(books);
        return updateBook;
      }

      else
      {
        throw new NotFoundException('Not found')
      }
    }
    else{
      throw new Error('Permission denied');
    }
  }

  remove(id: number): void {
    const books = this.readFile();
    const filtered = books.filter(book => book.id !== id );
    if(!filtered){
      throw new NotFoundException('Book not found');
    }

    this.writeFile(filtered);
  }
}
