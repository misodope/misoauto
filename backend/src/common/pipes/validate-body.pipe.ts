import { ValidationPipe } from '@nestjs/common';

/**
 * Validates and whitelists a request body against its class-validator DTO.
 * No global ValidationPipe is registered in main.ts, so routes opt in with
 * `@Body(validateBody)`.
 */
export const validateBody = new ValidationPipe({
  whitelist: true,
  transform: true,
});
