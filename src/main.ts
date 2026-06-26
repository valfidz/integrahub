import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: [
      'http://localhost:3001',
      process.env.FRONTEND_URL ?? ''
    ],
    methods: ['GET', 'POST', 'PUT']
  })

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
