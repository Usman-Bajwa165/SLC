import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  // Global prefix
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe — strips unknown fields, validates DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter — standardised error JSON
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global response transform — wraps responses in { data, meta }
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`\n🏛️  Stars Law College API running on http://localhost:${port}/api/v1\n`);
}

bootstrap();
