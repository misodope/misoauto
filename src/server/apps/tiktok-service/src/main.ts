import { NestFactory } from '@nestjs/core';
import { TiktokServiceModule } from './tiktok-service.module';

async function bootstrap() {
  const app = await NestFactory.create(TiktokServiceModule);
  await app.listen(3000);
}
bootstrap();
