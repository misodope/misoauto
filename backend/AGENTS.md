# Backend - AI Agent Development Guide

## Project Overview

This is a NestJS-based backend application for a social media automation platform (MisoAuto) that manages video content distribution across multiple platforms (TikTok, YouTube, Instagram, Facebook).

**Stack**: NestJS 10, TypeScript, Prisma ORM, PostgreSQL, JWT Authentication

**Key Features**:
- User authentication and authorization
- Multi-platform social media integration (OAuth flows)
- Video management and storage (AWS S3)
- Scheduled video posting across platforms
- Token management and refresh handling

---

## Architecture Patterns

### Module Organization

Each domain follows a consistent **feature module** pattern:

```
module-name/
├── dto/                      # Data Transfer Objects (validation schemas)
├── repository/
│   ├── {module}Reader.ts    # Read-only database operations
│   └── {module}Writer.ts    # Write database operations (create/update/delete)
├── {module}.controller.ts   # HTTP endpoints (if needed)
├── {module}.service.ts      # Business logic
├── {module}.module.ts       # NestJS module definition
└── index.ts                 # Barrel exports
```

**Current Modules**: `auth`, `user`, `video`, `video-post`, `platform`, `social-account`, `system`, `prisma`

### Repository Pattern (CQRS-inspired)

**Critical Pattern**: All database access is split between Reader and Writer classes:

- **Readers** (`{module}Reader.ts`): Query operations only (find, count, exists)
- **Writers** (`{module}Writer.ts`): Mutations only (create, update, delete)

**Example**:
```typescript
// authReader.ts
@Injectable()
export class AuthReader {
  constructor(private prisma: PrismaService) {}
  
  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
}

// authWriter.ts
@Injectable()
export class AuthWriter {
  constructor(private prisma: PrismaService) {}
  
  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
```

**When creating new features**: Always separate reads from writes using this pattern.

### Service Layer Pattern

Services contain business logic and orchestrate repository operations:

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authReader: AuthReader,
    private readonly authWriter: AuthWriter,
  ) {}
  
  async register(data: RegisterDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, this.saltRounds);
    return this.authWriter.createUser({
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: data.name,
    });
  }
}
```

### Controller Pattern

Controllers are thin HTTP handlers:

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Post('register')
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(body);
    return { message: 'User registered successfully', userId: user.id };
  }
}
```

**Best Practices**:
- Use DTOs for validation (`@Body() body: RegisterDto`)
- Keep controllers thin—delegate to services
- Use appropriate decorators (`@Get`, `@Post`, `@Body`, `@Query`, `@Param`)
- Return consistent response shapes with metadata

### Platform Integration Services

Platform-specific OAuth services follow this pattern:

```typescript
@Injectable()
export class PlatformConnect{Platform}Service {
  private readonly config: {Platform}OAuthConfig;
  private readonly httpClient: AxiosInstance;
  
  constructor() {
    // Initialize config from env vars
    // Setup axios with interceptors for logging
  }
  
  // Standard methods all platforms implement:
  generateAuthUrl(state?: string): string
  exchangeCodeForToken(code: string): Promise<TokenResponse>
  refreshToken(token: string): Promise<TokenResponse>
  getUserInfo(token: string): Promise<UserInfo>
  validateToken(token: string): Promise<boolean>
  isConfigured(): boolean
}
```

### DTOs and Validation

Use TypeScript interfaces or classes for DTOs:

```typescript
// Simple interface (no validation)
export interface LoginDto {
  email: string;
  password: string;
}

// Class-based (for class-validator decorators if needed)
export class RegisterDto {
  @IsEmail()
  email: string;
  
  @MinLength(8)
  password: string;
  
  @IsOptional()
  name?: string;
}
```

### Module Structure

Standard module template:

```typescript
@Module({
  imports: [PrismaModule, /* other dependencies */],
  providers: [
    {Module}Service,
    {Module}Reader,
    {Module}Writer,
  ],
  controllers: [{Module}Controller],
  exports: [{Module}Service, {Module}Reader, {Module}Writer],
})
export class {Module}Module {}
```

**Note**: PrismaModule is `@Global()` and provides PrismaService everywhere.

### Barrel Exports (index.ts)

Each module has an `index.ts` that exports public API:

```typescript
export * from './repository/userReader';
export * from './repository/userWriter';
export * from './user.module';
```

---

## Database Schema (Prisma)

**Location**: `src/prisma/schema.prisma`

**Key Models**:
- `User`: Authentication and ownership
- `Video`: Uploaded video files (stored in S3)
- `Platform`: Supported social media platforms (TikTok, YouTube, Instagram, Facebook)
- `SocialAccount`: User's connected platform accounts with OAuth tokens
- `VideoPost`: Video distribution records (scheduled/published status)

**Naming Convention**: 
- Database tables use `snake_case` (enforced via `@@map`)
- Prisma models use `PascalCase`
- Fields use `camelCase` with `@map("snake_case")` for DB columns

**Enums**:
- `VideoStatus`: PROCESSING, READY, FAILED
- `PostStatus`: PENDING, SCHEDULED, PUBLISHING, PUBLISHED, FAILED
- `PlatformType`: TIKTOK, YOUTUBE, INSTAGRAM, FACEBOOK

---

## Configuration & Environment

**Location**: `.env` (see `.env.example` for reference)

**Required Variables**:
```bash
DATABASE_URL          # PostgreSQL connection
JWT_SECRET            # Authentication secret
AWS_*                 # S3 storage credentials
{PLATFORM}_CLIENT_ID       # OAuth credentials per platform
{PLATFORM}_CLIENT_SECRET
{PLATFORM}_REDIRECT_URI
```

**Access Pattern**: Use `process.env.VARIABLE_NAME` in service constructors.

---

## Development Workflow

### Scripts

```bash
npm run start:dev        # Development with hot reload
npm run build           # Production build
npm run lint            # ESLint with --fix
npm run test            # Jest unit tests
npm run test:e2e        # E2E tests
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Database GUI
```

### Testing

**Location**: `test/unit/` for unit tests, `test/` for e2e

**Pattern**: Create `{module}.spec.ts` alongside source files

**Example**:
```typescript
describe('AuthService', () => {
  let service: AuthService;
  let authReader: AuthReader;
  let authWriter: AuthWriter;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, AuthReader, AuthWriter, PrismaService],
    }).compile();
    
    service = module.get<AuthService>(AuthService);
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

---

## Code Style & Best Practices

### TypeScript Configuration

- **Decorators enabled**: `experimentalDecorators: true`, `emitDecoratorMetadata: true`
- **Path aliases**: `@backend/*` maps to `src/*`
- **Strict mode**: Follow existing patterns (explicit return types optional)

### ESLint Rules

- Interface names: No prefix requirement (`interface User` not `IUser`)
- Explicit return types: Optional
- `any` type: Allowed but avoid when possible
- Use Prettier for formatting

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `auth.controller.ts`, `platform-connect-instagram.service.ts`)
- **Classes**: `PascalCase` (e.g., `AuthService`, `UserReader`)
- **Methods**: `camelCase` (e.g., `getUserByEmail`, `createUser`)
- **Constants**: `UPPER_SNAKE_CASE` for true constants
- **Private fields**: Use `private readonly` when possible

### Import Patterns

```typescript
// NestJS decorators first
import { Injectable, Logger, BadRequestException } from '@nestjs/common';

// External dependencies
import axios from 'axios';

// Internal path aliases
import { PrismaService } from '@backend/prisma/prisma.service';
import { RegisterDto } from '@backend/auth/dto/auth-register.dto';

// Relative imports for same module
import { AuthReader } from './repository/authReader';
```

### Error Handling

Use NestJS built-in exceptions:
```typescript
throw new BadRequestException('Invalid credentials');
throw new UnauthorizedException('Token expired');
throw new NotFoundException('User not found');
```

### Logging

Use NestJS Logger:
```typescript
@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);
  
  async doSomething() {
    this.logger.log('Doing something');
    this.logger.error('Something failed', error.stack);
    this.logger.warn('Potential issue');
    this.logger.debug('Debug info');
  }
}
```

---

## Adding New Features

### Creating a New Module

1. **Create directory structure**:
   ```
   src/new-feature/
   ├── dto/
   ├── repository/
   │   ├── newFeatureReader.ts
   │   └── newFeatureWriter.ts
   ├── new-feature.controller.ts
   ├── new-feature.service.ts
   ├── new-feature.module.ts
   └── index.ts
   ```

2. **Implement Reader/Writer** with PrismaService dependency

3. **Create Service** with business logic

4. **Create Controller** for HTTP endpoints

5. **Define Module** with proper imports/exports

6. **Add barrel exports** in `index.ts`

7. **Register in AppModule** (`app.module.ts`)

### Adding Platform Integration

Follow the `platform-connect-{platform}.service.ts` pattern:
- OAuth configuration from env vars
- Axios client with interceptors
- Standard methods: `generateAuthUrl`, `exchangeCodeForToken`, `refreshToken`, `getUserInfo`, `validateToken`
- Controller with endpoints for each OAuth flow step
- Register service in `PlatformModule`

### Database Changes

1. **Update schema**: Edit `src/prisma/schema.prisma`
2. **Generate migration**: `npm run prisma:migrate`
3. **Update Prisma client**: `npm run prisma:generate`
4. **Update repository classes** to use new schema

---

## Common Patterns Reference

### Async/Await Pattern
```typescript
async methodName(): Promise<ReturnType> {
  const result = await this.dependency.operation();
  return result;
}
```

### Dependency Injection
```typescript
constructor(
  private readonly dependency: DependencyService,
  private readonly reader: ModuleReader,
) {}
```

### Response Formatting
```typescript
return {
  data: result,
  message: 'Operation successful',
  metadata: { count: result.length },
};
```

### Cookie Management (Auth)
```typescript
@Post('login')
async login(
  @Body() body: LoginDto,
  @Res({ passthrough: true }) response: Response,
) {
  const { access_token } = await this.authService.login(user);
  response.cookie('access_token', access_token);
  return { access_token };
}
```

### Platform Service Config Check
```typescript
isConfigured(): boolean {
  return !!(
    this.config.clientId &&
    this.config.clientSecret &&
    this.config.redirectUri
  );
}

getConfigStatus(): { configured: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  if (!this.config.clientId) missingFields.push('CLIENT_ID');
  return { configured: missingFields.length === 0, missingFields };
}
```

---

## Testing & Quality

Before committing:
1. Run `npm run lint` - must pass with no errors
2. Run `npm run test` - unit tests should pass
3. Verify TypeScript compilation: `npm run build`
4. Test API endpoints manually or with `npm run test:e2e`

---

## Project-Specific Notes

- **Global Prefix**: All routes prefixed with `/api/v1` (see `main.ts`)
- **CORS**: Configured for `localhost:4000` and `localhost:4001`
- **Cookie Parser**: Enabled for authentication flow
- **Password Hashing**: Uses `bcrypt` with 10 salt rounds
- **JWT Expiration**: 60 minutes (configurable in AuthModule)
- **S3 Integration**: Videos stored in AWS S3 (bucket/key tracked in Video model)
- **Token Management**: Platform tokens stored in SocialAccount with expiry tracking

---

## Troubleshooting

### Common Issues

**Prisma Client Out of Sync**:
```bash
npm run prisma:generate
```

**Database Migration Issues**:
```bash
npm run prisma:migrate
# or for clean slate:
npm run prisma:reset
```

**Module Import Errors**:
- Check if module is registered in `AppModule`
- Verify barrel exports in `index.ts`
- Check `tsconfig.json` path aliases

**Environment Variables Missing**:
- Copy `.env.example` to `.env`
- Fill in required credentials
- Restart dev server

---

## Questions to Ask Before Implementing

1. **Does this fit an existing pattern?** (Look at similar modules first)
2. **Do I need Reader AND Writer?** (Yes, for database operations)
3. **Should this be a separate module?** (If it's a distinct domain, yes)
4. **What entities does this interact with?** (Check Prisma schema)
5. **Is authentication required?** (Consider JWT guards if needed)
6. **Does this need platform integration?** (Follow OAuth service pattern)

---

## Quick Reference

**Generate Prisma Types**: `npm run prisma:generate`  
**Run Migrations**: `npm run prisma:migrate`  
**Database GUI**: `npm run prisma:studio`  
**Dev Server**: `npm run start:dev`  
**Lint**: `npm run lint`  
**Test**: `npm run test`

**Main Entry**: `src/main.ts`  
**App Module**: `src/app.module.ts`  
**Schema**: `src/prisma/schema.prisma`  
**Env Example**: `.env.example`
