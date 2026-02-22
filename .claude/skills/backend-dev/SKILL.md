---
description: Backend development patterns and conventions for misoauto. Use when working in the backend directory, implementing backend features, or when /implement involves backend changes.
---

# Backend Development Guide — MisoAuto

Follow these patterns when developing in `/Users/misodope/work/misoauto/backend/`.

## Tech Stack

- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL via Prisma ORM
- **Job Queue**: BullMQ (Redis-backed)
- **Scheduler**: NestJS Schedule + auto-discovered cron files
- **Storage**: Cloudflare R2 (S3-compatible) via `BlobStorageService`
- **Auth**: JWT (access token in-memory) + refresh token (hashed in DB, httpOnly cookie)
- **Validation**: `class-validator` + `class-transformer` decorators on DTOs
- **Testing**: Jest
- **Package Manager**: npm

## Directory Structure

```
backend/src/
├── app.module.ts              # Root module — registers all feature modules
├── main.ts                    # Bootstrap: CORS, cookies, global prefix api/v1
├── auth/                      # Auth module
├── users/                     # Users module
├── videos/                    # Videos module
├── video-posts/               # Video posts module
├── social-accounts/           # Social accounts module
├── platform/                  # Platform integrations (TikTok, Instagram, YouTube)
├── scheduler/                 # Cron orchestration (auto-discovers cron files)
├── system/
│   ├── queue/                 # BullMQ queue service
│   ├── blob-storage/          # Cloudflare R2 abstraction
│   └── notifications/         # Twilio SMS
├── database/
│   ├── schema.prisma          # Single source of truth for all models
│   └── prisma.service.ts      # PrismaService (injectable)
└── common/
    ├── guards/                # JwtAuthGuard
    ├── decorators/            # @CurrentUser()
    └── utils/                 # cookie.utils.ts, etc.
```

---

## Module Organization (Feature-Based)

Each feature module follows this exact structure:

```
{feature}/
├── {feature}.module.ts        # @Module() definition — imports, controllers, providers, exports
├── controllers/
│   ├── {feature}.controller.ts
│   └── index.ts
├── services/
│   ├── {feature}.service.ts
│   └── index.ts
├── repository/
│   ├── {entity}-reader.ts     # Read-only DB operations
│   └── {entity}-writer.ts     # Write DB operations
├── dto/
│   ├── create-{entity}.dto.ts
│   ├── update-{entity}.dto.ts
│   └── index.ts
├── crons/                     # (if scheduled tasks needed)
│   └── {description}.cron.ts
└── index.ts                   # Barrel: export * from all sub-modules
```

**Reference modules**: `backend/src/videos/`, `backend/src/video-posts/`, `backend/src/auth/`

---

## Three-Layer Architecture

Every feature has exactly three layers:

### 1. Controller — HTTP only
Handles request/response. No business logic. Shape the response DTO here.

```typescript
// backend/src/videos/controllers/videos.controller.ts
import { Controller, Get, Post, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@backend/common/guards/jwt-auth.guard';
import { CurrentUser } from '@backend/common/decorators/current-user.decorator';
import { JwtPayload } from '@backend/auth';

@Controller('videos')
@UseGuards(JwtAuthGuard)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('upload/initialize')
  async initializeUpload(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InitializeUploadDto,
  ): Promise<InitializeUploadResponse> {
    return this.videosService.initializeUpload(user.sub, dto);
  }

  @Get()
  async getVideos(@CurrentUser() user: JwtPayload): Promise<VideoResponse[]> {
    const videos = await this.videosService.getUserVideos(user.sub);
    return videos.map(this.toVideoResponse);
  }

  @Delete(':id')
  async deleteVideo(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.videosService.deleteVideo(user.sub, id);
  }

  private toVideoResponse(video: VideoWithRelations): VideoResponse {
    return { id: video.id, title: video.title, status: video.status };
  }
}
```

### 2. Service — Business logic
Orchestrates readers, writers, and external services. Throws NestJS HTTP exceptions.

```typescript
// backend/src/videos/services/videos.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private readonly videoReader: VideoReader,
    private readonly videoWriter: VideoWriter,
    private readonly blobStorage: BlobStorageService,
  ) {}

  async getUserVideos(userId: number): Promise<VideoWithRelations[]> {
    return this.videoReader.findByUserId(userId);
  }

  async deleteVideo(userId: number, videoId: number): Promise<void> {
    const video = await this.videoReader.findOne({ id: videoId });

    if (!video || video.userId !== userId) {
      throw new NotFoundException('Video not found');
    }

    await this.blobStorage.delete(video.s3Key);
    await this.videoWriter.delete({ id: videoId });
    this.logger.log(`Video ${videoId} deleted by user ${userId}`);
  }
}
```

### 3. Repository — Data access only

**Reader** — queries only:

```typescript
// backend/src/videos/repository/video-reader.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/database/prisma.service';
import { Prisma, Video, VideoStatus } from '@prisma/client';

export type VideoWithRelations = Prisma.VideoGetPayload<{
  include: typeof VIDEO_INCLUDE;
}>;

const VIDEO_INCLUDE = {
  user: true,
  posts: { include: { platform: true } },
} as const;

@Injectable()
export class VideoReader {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.VideoWhereInput;
    orderBy?: Prisma.VideoOrderByWithRelationInput;
  }): Promise<VideoWithRelations[]> {
    return this.prisma.video.findMany({ ...params, include: VIDEO_INCLUDE });
  }

  async findOne(where: Prisma.VideoWhereUniqueInput): Promise<VideoWithRelations | null> {
    return this.prisma.video.findUnique({ where, include: VIDEO_INCLUDE });
  }

  async findByUserId(userId: number): Promise<VideoWithRelations[]> {
    return this.prisma.video.findMany({ where: { userId }, include: VIDEO_INCLUDE });
  }

  async findByStatus(status: VideoStatus): Promise<VideoWithRelations[]> {
    return this.prisma.video.findMany({ where: { status }, include: VIDEO_INCLUDE });
  }

  async exists(where: Prisma.VideoWhereInput): Promise<boolean> {
    const count = await this.prisma.video.count({ where });
    return count > 0;
  }
}
```

**Writer** — mutations only:

```typescript
// backend/src/videos/repository/video-writer.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/database/prisma.service';
import { Prisma, Video, VideoStatus } from '@prisma/client';

@Injectable()
export class VideoWriter {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.VideoCreateInput): Promise<Video> {
    return this.prisma.video.create({ data });
  }

  async update(params: {
    where: Prisma.VideoWhereUniqueInput;
    data: Prisma.VideoUpdateInput;
  }): Promise<Video> {
    return this.prisma.video.update(params);
  }

  async updateStatus(id: number, status: VideoStatus): Promise<Video> {
    return this.prisma.video.update({ where: { id }, data: { status } });
  }

  async delete(where: Prisma.VideoWhereUniqueInput): Promise<Video> {
    return this.prisma.video.delete({ where });
  }
}
```

---

## Module Definition Pattern

```typescript
// backend/src/videos/videos.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '@backend/database';

@Module({
  imports: [PrismaModule],
  controllers: [VideosController],
  providers: [VideoReader, VideoWriter, VideosService],
  exports: [VideoReader, VideoWriter, VideosService],
})
export class VideosModule {}
```

Always export readers, writers, and services so other modules can depend on them.

---

## DTOs & Validation

Use `class-validator` decorators. Every request body gets a DTO.

```typescript
// backend/src/videos/dto/initialize-upload.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class InitializeUploadDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSize?: number;
}
```

**Reference DTOs**: `backend/src/videos/dto/`, `backend/src/video-posts/dto/`

---

## Authentication & Authorization

### Protecting routes

Apply `@UseGuards(JwtAuthGuard)` at the controller class level (protects all routes) or individual method level.

```typescript
import { JwtAuthGuard } from '@backend/common/guards/jwt-auth.guard';
import { CurrentUser } from '@backend/common/decorators/current-user.decorator';
import { JwtPayload } from '@backend/auth';

@UseGuards(JwtAuthGuard)
@Controller('things')
export class ThingsController {
  @Get()
  getThings(@CurrentUser() user: JwtPayload) {
    // user.sub = userId, user.email = email
    return this.thingsService.getUserThings(user.sub);
  }
}
```

### JWT payload type

```typescript
export interface JwtPayload {
  sub: number;   // userId
  email: string;
}
```

### Auth files to reference:
- `backend/src/common/guards/jwt-auth.guard.ts`
- `backend/src/common/decorators/current-user.decorator.ts`
- `backend/src/auth/services/auth.service.ts`

---

## Error Handling

Use NestJS built-in HTTP exceptions — never throw raw `Error`:

```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

// 404
throw new NotFoundException('Video not found');

// 400
throw new BadRequestException('Video is not ready for posting');

// 401
throw new UnauthorizedException('Invalid or expired token');

// 403
throw new ForbiddenException('You do not own this resource');

// 409
throw new ConflictException('Email already registered');
```

---

## Database (Prisma)

### Schema location
`backend/src/database/schema.prisma` — single source of truth.

### Key models
- `User` — `id`, `email`, `password`, `name`, `smsConsent`
- `Video` — `id`, `userId`, `title`, `s3Key`, `s3Bucket`, `status` (PROCESSING / READY / FAILED)
- `VideoPost` — `id`, `videoId`, `socialAccountId`, `status` (PENDING / SCHEDULED / PUBLISHING / PUBLISHED / FAILED)
- `SocialAccount` — `id`, `userId`, `platformId`, OAuth tokens
- `Platform` — `id`, `name` (TIKTOK / YOUTUBE / INSTAGRAM / FACEBOOK)
- `RefreshToken` — hashed refresh tokens with expiry

### PrismaService

```typescript
import { PrismaService } from '@backend/database/prisma.service';
// Inject in reader/writer constructors — never in services or controllers directly
```

### Migrations

```bash
npm run prisma:migrate    # dev migration
npm run prisma:generate   # regenerate Prisma client
npm run prisma:deploy     # production deploy
```

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Controller | `{Feature}Controller` | `VideosController` |
| Service | `{Feature}Service` | `VideosService` |
| Reader | `{Entity}Reader` | `VideoReader` |
| Writer | `{Entity}Writer` | `VideoWriter` |
| DTO | `{Action}{Entity}Dto` | `InitializeUploadDto`, `CreateVideoPostDto` |
| Cron | `{description}.cron.ts` | `scheduled-posts.cron.ts` |
| Module | `{Feature}Module` | `VideosModule` |

---

## Logging

Use NestJS `Logger` — never `console.log` in production code:

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  async doSomething() {
    this.logger.log('Starting operation');
    this.logger.error('Something failed', error);
    this.logger.warn('Unexpected state');
    this.logger.debug('Debug info');
  }
}
```

---

## Cron Jobs

Place cron files in `{feature}/crons/{description}.cron.ts`. The `SchedulerModule` auto-discovers all `*.cron.ts` files.

```typescript
// backend/src/video-posts/crons/scheduled-posts.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScheduledPostsCron {
  private readonly logger = new Logger(ScheduledPostsCron.name);

  constructor(private readonly videoPostReader: VideoPostReader) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'check-scheduled-posts' })
  async handleScheduledPosts() {
    this.logger.debug('Checking for scheduled posts');
    try {
      const posts = await this.videoPostReader.findScheduledPosts(new Date());
      // process...
    } catch (error) {
      this.logger.error('Failed to process scheduled posts', error);
    }
  }
}
```

---

## External Services

### Blob Storage (Cloudflare R2)

Inject `BlobStorageService` — registered globally via `BlobStorageModule.forRoot()` in `app.module.ts`:

```typescript
constructor(private readonly blobStorage: BlobStorageService) {}

const { url, key } = await this.blobStorage.getSignedUploadUrl(filename, contentType);
const downloadUrl = await this.blobStorage.getSignedDownloadUrl(s3Key);
await this.blobStorage.delete(s3Key);
```

**Reference**: `backend/src/system/blob-storage/blob-storage.service.ts`

### Queue (BullMQ)

Inject `QueueService` — registered globally via `QueueModule.forRoot()`:

```typescript
constructor(private readonly queue: QueueService) {}

await this.queue.addJob('video-processing', 'process', { videoId: 123 });
```

**Reference**: `backend/src/system/queue/queue.service.ts`

---

## Import Aliases

- `@backend/` → `backend/src/`

```typescript
import { JwtAuthGuard } from '@backend/common/guards/jwt-auth.guard';
import { VideoReader } from '@backend/videos/repository/video-reader';
import { PrismaService } from '@backend/database/prisma.service';
```

---

## Checklist for a New Backend Feature

- [ ] Read existing similar module (e.g., `backend/src/videos/`) before starting
- [ ] Add Prisma model to `backend/src/database/schema.prisma` if needed
- [ ] Run `npm run prisma:migrate` and `npm run prisma:generate`
- [ ] Create Reader and Writer in `repository/`
- [ ] Create Service with business logic — inject Reader/Writer
- [ ] Create Controller with `@UseGuards(JwtAuthGuard)` — inject Service only
- [ ] Create DTOs with `class-validator` decorators for all request bodies
- [ ] Register Controller, Service, Reader, Writer in `{feature}.module.ts`
- [ ] Export all providers from `{feature}.module.ts`
- [ ] Import module in `app.module.ts`
- [ ] Add barrel exports to `{feature}/index.ts`
- [ ] Use NestJS HTTP exceptions (not raw Error)
- [ ] Use `Logger` (not console.log)
- [ ] Write unit tests in `test/unit/{feature}.service.spec.ts`
