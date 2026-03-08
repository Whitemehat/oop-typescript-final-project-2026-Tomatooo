import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor} from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter'; 
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  //API Response format
  app.useGlobalInterceptors(new ResponseInterceptor());
  //error format
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('NestJS Backend API')
    .setDescription('API Documentation for NestJS Backend Project')
    .setVersion('3.0')
    .addTag('Book', 'Endpoints for managing books (CRUD)')
    .addTag('Member', 'Endpoints for managing members (CRUD + borrow/return)')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}

bootstrap();
