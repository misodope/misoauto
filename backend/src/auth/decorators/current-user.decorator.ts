import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  email: string;
  sub: number; // userId
  iat?: number;
  exp?: number;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
