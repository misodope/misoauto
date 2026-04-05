import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './common';

async function bootstrap() {
  console.log('why is this broken');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.use(cookieParser());

  // Log all incoming requests
  const logger = new Logger('HTTP');
  app.use((req: any, res: any, next: () => void) => {
    logger.log(`${req.method} ${req.url}`);
    next();
  });

  // Build allowed origins list
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:4001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4000',
    'http://127.0.0.1:4001',
    'http://frontend:3000',
  ];
  if (process.env.NGROK_URL) {
    allowedOrigins.push(process.env.NGROK_URL);
  }
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
