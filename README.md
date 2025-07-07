# MisoAuto 🎬

A comprehensive social media automation platform for video content distribution across multiple platforms.

## Overview

MisoAuto is a full-stack application that enables users to upload videos and automatically distribute them across various social media platforms including TikTok, YouTube, Instagram, and Facebook. The platform handles video processing, social media account integration, and automated posting with scheduling capabilities.

## Features

### 🎥 Video Management
- Upload and process videos with metadata
- AWS S3 integration for scalable video storage
- Video status tracking (Processing, Ready, Failed)
- Support for multiple video formats

### 🔗 Multi-Platform Integration
- **TikTok** - Automated video posting
- **YouTube** - Video uploads and management
- **Instagram** - Video content distribution
- **Facebook** - Cross-platform sharing

### 📅 Scheduling & Automation
- Schedule posts for optimal engagement times
- Bulk posting across multiple platforms
- Post status tracking (Pending, Scheduled, Publishing, Published, Failed)
- Automated retry mechanisms for failed posts

### 👤 User Management
- User authentication and authorization
- Multiple social media account linking per user
- OAuth integration for secure platform connections
- Token management and refresh handling

## Technology Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **File Storage**: AWS S3
- **API**: RESTful endpoints

### Frontend
- **Framework**: Next.js 15 with React 19
- **Development**: Turbopack for fast dev builds
- **TypeScript**: Full type safety

### Development Tools
- **Monorepo**: Nx workspace for project management
- **Testing**: Jest for unit and e2e testing
- **Linting**: ESLint with Prettier
- **Database**: Prisma for schema management and migrations

## Project Structure

```
misoauto/
├── backend/                 # NestJS API server
│   ├── src/                # Application source code
│   ├── prisma/             # Database schema and migrations
│   └── package.json        # Backend dependencies
├── frontend/               # Next.js web application
│   ├── app/               # Next.js app router
│   └── package.json       # Frontend dependencies
├── nx.json                # Nx workspace configuration
└── package.json           # Root workspace configuration
```

## Database Schema

The application uses a relational database structure with the following key entities:

- **Users**: Core user accounts with authentication
- **Videos**: Uploaded video content with S3 storage references
- **Platforms**: Supported social media platforms (TikTok, YouTube, Instagram, Facebook)
- **SocialAccounts**: Linked social media accounts with OAuth tokens
- **VideoPosts**: Individual posts across platforms with scheduling and status tracking

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- AWS S3 bucket for video storage
- Social media platform API credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd misoauto
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   - Copy `.env.example` to `.env`
   - Configure database connection string
   - Add AWS S3 credentials
   - Set up social media API keys

4. **Database setup**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

5. **Start development servers**
   ```bash
   npm run start
   ```
   This will start both backend and frontend servers concurrently.

### Development Commands

```bash
# Start both frontend and backend
npm run start

# Start development with watch mode
npm run serve

# Run tests
npm test

# Database operations
cd backend
npx prisma studio          # Open database GUI
npx prisma db seed         # Seed database with test data
```

## API Endpoints

The backend provides RESTful API endpoints for:

- **Authentication**: User registration, login, JWT management
- **Video Management**: Upload, process, and manage video content
- **Social Accounts**: Link and manage social media accounts
- **Platform Integration**: Post videos to connected platforms
- **Scheduling**: Create and manage scheduled posts
- **Analytics**: Track post performance and user statistics

## Environment Variables

### Backend (.env)
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/misoauto"
JWT_SECRET="your-jwt-secret"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket-name"
AWS_REGION="us-east-1"

# Social Media API Keys
TIKTOK_CLIENT_ID="your-tiktok-client-id"
TIKTOK_CLIENT_SECRET="your-tiktok-client-secret"
YOUTUBE_CLIENT_ID="your-youtube-client-id"
YOUTUBE_CLIENT_SECRET="your-youtube-client-secret"
# ... other platform credentials
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write unit tests for new features
- Use Prettier for code formatting
- Follow commit message conventions
- Update documentation for API changes

## Deployment

### Production Deployment

1. **Backend Deployment**
   - Deploy NestJS application to cloud provider
   - Configure production database
   - Set up AWS S3 for file storage
   - Configure environment variables

2. **Frontend Deployment**
   - Build Next.js application
   - Deploy to Vercel, Netlify, or similar platform
   - Configure API endpoints

3. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

## Support

For questions, issues, or contributions, please:
- Open an issue on GitHub
- Contact the development team
- Check the documentation for common solutions

---

**MisoAuto** - Simplifying social media video distribution with automation and intelligence.

