import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import './crypto.polyfill';

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));

  const PORT = process.env.PORT || '3002';

  await app.listen(Number(PORT), '0.0.0.0');

  console.log(`Board Service running on port ${PORT}`);
}

bootstrap();
