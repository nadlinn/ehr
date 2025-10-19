import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com', 'https://www.yourdomain.com']
      : [
          'http://localhost:3000', 
          'http://localhost:3001',
          'https://ehr.lancema.cc',
          'http://ehr.lancema.cc'
        ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true, // Allow cookies/authentication
  }); // Enable CORS for frontend communication
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
