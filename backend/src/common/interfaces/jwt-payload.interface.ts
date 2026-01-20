export interface JwtPayload {
  email: string;
  sub: number; // userId
  iat?: number;
  exp?: number;
}
