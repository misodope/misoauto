import { NestFactory } from '@nestjs/core';
import { UploadServiceModule } from './upload-service.module';

async function bootstrap() {
  const app = await NestFactory.create(UploadServiceModule);
  await app.listen(3000);
}
bootstrap();
