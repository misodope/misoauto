# MisoAuto Docker Setup

This guide explains how to run MisoAuto using Docker containers.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- Make (optional, for using Makefile commands)

## Architecture

- **Frontend**: Next.js application running on port 3000
- **Backend**: NestJS API running on port 3001

## Quick Start

### Production Mode

1. **Build and start all services:**
   ```bash
   make build
   make up
   ```
   
   Or without Make:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Development Mode

For development with hot reloading:

```bash
make dev
```

Or:
```bash
docker-compose -f docker-compose.dev.yml up
```

## Available Commands

### Using Makefile

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make build` | Build all Docker images |
| `make up` | Start services in production mode |
| `make down` | Stop all services |
| `make dev` | Start services in development mode |
| `make clean` | Remove all containers and images |
| `make logs` | Show logs from all services |
| `make restart` | Restart all services |
| `make backend` | Start only backend service |
| `make frontend` | Start only frontend service |
| `make backend-logs` | Show backend logs |
| `make frontend-logs` | Show frontend logs |

### Using Docker Compose Directly

```bash
# Production
docker-compose up -d                    # Start all services
docker-compose down                     # Stop all services
docker-compose logs -f                  # View logs
docker-compose restart                  # Restart services

# Development
docker-compose -f docker-compose.dev.yml up    # Start dev mode
docker-compose -f docker-compose.dev.yml down  # Stop dev mode

# Individual services
docker-compose up -d backend            # Start only backend
docker-compose up -d frontend           # Start only frontend
```

## Environment Variables

Create `.env` files in the respective directories:

### Backend Environment Variables

Create `backend/.env`:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL="your-database-url"
JWT_SECRET="your-jwt-secret"
TIKTOK_CLIENT_ID="your-tiktok-client-id"
TIKTOK_CLIENT_SECRET="your-tiktok-client-secret"
YOUTUBE_CLIENT_ID="your-youtube-client-id"
YOUTUBE_CLIENT_SECRET="your-youtube-client-secret"
INSTAGRAM_CLIENT_ID="your-instagram-client-id"
INSTAGRAM_CLIENT_SECRET="your-instagram-client-secret"
```

### Frontend Environment Variables

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Docker Images

The setup creates multi-stage Docker images:

### Backend Image Stages
- **base**: Common base layer
- **development**: For development with hot reloading
- **build**: Build stage for compilation
- **production**: Optimized production image

### Frontend Image Stages
- **deps**: Dependencies only
- **development**: For development with hot reloading
- **builder**: Build stage for Next.js build
- **runner**: Optimized production image

## Volumes (Development Mode)

In development mode, volumes are mounted for hot reloading:
- Backend: `./backend:/app`
- Frontend: `./frontend:/app`

## Health Checks

Both services include health checks:
- **Backend**: `curl -f http://localhost:3001/health`
- **Frontend**: `curl -f http://localhost:3000`

## Troubleshooting

### Port Conflicts
If ports 3000 or 3001 are in use, modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "3002:3000"  # Map to different host port
```

### Build Issues
Clear Docker cache and rebuild:
```bash
make clean
make build
```

### Logs
Check service logs for debugging:
```bash
make logs
# or
make backend-logs
make frontend-logs
```

### Container Access
Access running containers:
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
```

## Production Deployment

For production deployment:

1. Set up proper environment variables
2. Configure reverse proxy (nginx/traefik)
3. Set up SSL/TLS certificates
4. Use external database
5. Set up monitoring and logging

Example nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
