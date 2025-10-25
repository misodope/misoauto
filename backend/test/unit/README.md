# Unit Tests

This directory contains comprehensive unit tests for the misoauto backend application.

## Test Coverage

### Authentication Module
- **auth.service.spec.ts** - Tests for AuthService including user registration, login, validation, and JWT token generation
- **auth.controller.spec.ts** - Tests for AuthController endpoints including register and login functionality
- **auth.repository.spec.ts** - Tests for AuthRepository database operations

### Platform Module
- **platform-instagram.controller.spec.ts** - Tests for Instagram platform controller including OAuth flow, user info, and media retrieval
- **platform.repository.spec.ts** - Tests for PlatformRepository database operations

### User Module
- **user.repository.spec.ts** - Tests for UserRepository database operations

### System Module
- **cache.service.spec.ts** - Comprehensive tests for CacheService including TTL, eviction, and error handling
- **prisma.service.spec.ts** - Tests for PrismaService database connection management

## Test Structure

Each test file follows the same structure:
1. **Setup** - Mock dependencies and create test module
2. **Basic Tests** - Verify service/controller/repository is properly defined
3. **Method Tests** - Test each public method with various scenarios:
   - Success cases
   - Error cases
   - Edge cases
   - Input validation

## Key Testing Patterns Used

### Mocking
- All external dependencies are mocked using Jest
- Database operations are mocked to avoid actual database calls
- HTTP clients and external services are mocked

### Test Data
- Consistent mock data objects used across related tests
- Realistic test data that matches actual application data structures

### Error Handling
- Tests include both success and failure scenarios
- Proper error propagation and handling verification

### Async Testing
- All async operations are properly tested with async/await
- Promise rejections are tested for error cases

## Dependencies Required

```json
{
  "@nestjs/testing": "^10.0.0",
  "jest": "^29.0.0",
  "@types/jest": "^29.0.0",
  "bcrypt": "^5.0.0"
}
```

## Running Tests

### Run all unit tests
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:cov
```

### Run specific test file
```bash
npm run test auth.service.spec.ts
```

## Test Configuration

Ensure your `jest.config.js` includes:

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@backend/(.*)$': '<rootDir>/$1',
  },
};
```

## Best Practices Followed

1. **Isolation** - Each test is independent and doesn't rely on other tests
2. **Clarity** - Test names clearly describe what is being tested
3. **Coverage** - Tests cover both happy paths and error scenarios
4. **Maintainability** - Tests are easy to understand and modify
5. **Performance** - Tests run quickly by mocking external dependencies

## Future Enhancements

Additional test files should be created for:
- TikTok Controller
- YouTube Controller 
- Platform Connect Services
- Social Account Repository
- Video Repository
- Video Post Repository
- App Controller and Service

Each new test file should follow the same patterns and structure established in the existing tests.
