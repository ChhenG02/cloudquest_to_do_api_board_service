import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { webcrypto } from 'crypto';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  if (!globalThis.crypto) {
    (globalThis as any).crypto = webcrypto;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
