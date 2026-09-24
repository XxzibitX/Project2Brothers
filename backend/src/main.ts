import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import {
  ensureUploadDirs,
  UPLOADS_ROOT,
} from './uploads/uploads.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  ensureUploadDirs();
  // Раздача загруженных файлов: /api/uploads/...
  app.useStaticAssets(UPLOADS_ROOT, {
    prefix: '/api/uploads',
    maxAge: '365d',
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  });

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const message = errors
          .map((e) => Object.values(e.constraints ?? {}).join(', '))
          .filter(Boolean)
          .join('; ');
        return new BadRequestException(message || 'Ошибка валидации');
      },
    }),
  );

  const originRaw = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';
  const origins = originRaw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
  });

  const port = Number(config.get('PORT') ?? 8080);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}/api`);
}
void bootstrap();
