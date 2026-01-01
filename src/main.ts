import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { webcrypto } from 'crypto';

async function bootstrap() {
  if (!globalThis.crypto) {
    (globalThis as any).crypto = webcrypto;
  }

  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
