# Deployment Guide - DigitalOcean Droplet

This guide covers deploying the misoauto application to your DigitalOcean Droplet using pre-built Docker images from GitHub Container Registry.

## Overview

- **Droplet IP**: YOUR_DROPLET_IP
- **Domain**: YOUR_DOMAIN.com
- **Subdomains**: Configure as needed (e.g., app.YOUR_DOMAIN.com, api.YOUR_DOMAIN.com)
- **Backend Port**: 3001
- **Frontend Port**: 3000
- **GitHub Repository**: https://github.com/misodope/misoauto

## Architecture

```
GitHub Actions (on push to main)
  ↓
Build Docker Images
  ↓
Push to ghcr.io/misodope/misoauto/{backend,frontend}:latest
  ↓
Droplet pulls and runs pre-built images
  ↓
Nginx (on host) proxies to containers
```

## One-Time Setup on Droplet

### 1. Login to GitHub Container Registry

SSH into your Droplet and authenticate with GHCR using your Personal Access Token:

```bash
ssh root@YOUR_DROPLET_IP

# Login to GHCR (only need to do this once)
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u misodope --password-stdin
```

**Note**: Replace `YOUR_GITHUB_PAT` with your actual token. The credentials will persist in `~/.docker/config.json`.

### 2. Create Project Directory

```bash
# Create deployment directory
mkdir -p /root/misoauto
cd /root/misoauto
```

### 3. Copy Files to Droplet

From your local machine, copy the necessary files:

```bash
# Copy docker-compose.prod.yml
scp docker-compose.prod.yml root@YOUR_DROPLET_IP:/root/misoauto/docker-compose.yml

# Copy .env file (if you have environment variables)
scp .env.production root@YOUR_DROPLET_IP:/root/misoauto/.env
```

### 4. Configure Nginx

Create/update Nginx configuration for each subdomain:

**For app.YOUR_DOMAIN.com** (`/root/nginx/conf.d/app.conf`):

```nginx
server {
    listen 80;
    server_name app.YOUR_DOMAIN.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.YOUR_DOMAIN.com;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/app.YOUR_DOMAIN.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.YOUR_DOMAIN.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to frontend container
    location / {
        proxy_pass http://host.docker.internal:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy API requests to backend container
    location /api {
        proxy_pass http://host.docker.internal:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**For additional subdomains** - Use similar configuration, just change the server_name and SSL certificate paths.

**Important**: If `host.docker.internal` doesn't work on your Droplet, you have two options:

1. Use the Droplet's localhost IP directly:
   ```nginx
   proxy_pass http://127.0.0.1:3000;
   ```

2. Add host.docker.internal mapping (run once on Droplet):
   ```bash
   echo "127.0.0.1 host.docker.internal" >> /etc/hosts
   ```

### 5. Reload Nginx

```bash
nginx -t  # Test configuration
systemctl reload nginx
```

## Deployment Process

### Initial Deployment

On the Droplet:

```bash
cd /root/misoauto

# Pull latest images
docker compose pull

# Start containers
docker compose up -d

# Check status
docker compose ps
docker compose logs -f
```

### Regular Updates (After Pushing to GitHub)

Every time you push to the `main` branch, GitHub Actions will build and push new images. To deploy the updates:

```bash
cd /root/misoauto

# Pull latest images from GHCR
docker compose pull

# Recreate containers with new images
docker compose up -d

# Verify deployment
docker compose ps
```

### Quick Deploy Script

Create a deploy script on the Droplet for easy updates:

```bash
cat > /root/misoauto/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying misoauto..."

cd /root/misoauto

echo "📥 Pulling latest images..."
docker compose pull

echo "🔄 Recreating containers..."
docker compose up -d

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment complete!"
docker compose ps
EOF

chmod +x /root/misoauto/deploy.sh
```

Then deploy with:

```bash
/root/misoauto/deploy.sh
```

## Environment Variables

Create a `.env` file in `/root/misoauto/.env` on the Droplet with your environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Backend
JWT_SECRET=your-jwt-secret
PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=https://YOUR_DOMAIN.com/api
PORT=3000

# Add other variables as needed
```

**Security Note**: Never commit `.env` files to Git. Keep them only on the Droplet.

## Monitoring & Troubleshooting

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend

# Last 100 lines
docker compose logs --tail=100
```

### Check Container Status

```bash
docker compose ps
docker stats
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart frontend
```

### Check Nginx

```bash
# Test config
nginx -t

# Reload
systemctl reload nginx

# View logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Resource Monitoring

```bash
# Check memory usage
free -h
docker stats --no-stream

# Check disk usage
df -h
docker system df
```

### Clean Up Old Images

```bash
# Remove unused images
docker image prune -a -f

# Full cleanup (careful!)
docker system prune -a --volumes -f
```

## Health Checks

The containers include health checks:

- **Backend**: `http://localhost:3001/health`
- **Frontend**: `http://localhost:3000`

You can verify from the Droplet:

```bash
curl http://localhost:3001/health
curl http://localhost:3000
```

## Rollback

If a deployment fails, you can rollback to a previous image:

```bash
# Pull specific SHA tag instead of latest
docker pull ghcr.io/misodope/misoauto/backend:main-abc123
docker pull ghcr.io/misodope/misoauto/frontend:main-abc123

# Update docker-compose.yml to use specific tags
# Then restart
docker compose up -d
```

## GitHub Actions Workflow

The workflow (`.github/workflows/build-and-push.yml`) automatically:

1. ✅ Builds multi-stage Docker images
2. ✅ Pushes to GHCR with multiple tags (latest, SHA, branch)
3. ✅ Uses layer caching for faster builds
4. ✅ Provides build summary in Actions UI

**Trigger**: Automatic on push to `main`, or manual via workflow_dispatch

## Making GitHub Packages Public (Optional)

By default, GHCR packages inherit repository visibility. To make images publicly accessible without authentication:

1. Go to: https://github.com/misodope?tab=packages
2. Click on your package (backend or frontend)
3. Click "Package settings"
4. Scroll to "Danger Zone" → "Change visibility"
5. Select "Public"

This allows pulling images without authentication.

## Network Configuration Note

The current `docker-compose.prod.yml` uses bridge networking. The containers are accessible on the host at:

- Backend: `http://127.0.0.1:3001` or `http://host.docker.internal:3001`
- Frontend: `http://127.0.0.1:3000` or `http://host.docker.internal:3000`

Nginx on the host proxies external traffic to these ports.

## Security Checklist

- [x] Use HTTPS (Certbot configured)
- [x] Environment variables in `.env` file (not in docker-compose.yml)
- [x] Non-root users in containers (configured in Dockerfiles)
- [x] Health checks enabled
- [x] Container restart policy set
- [ ] Set up automated backups for database/volumes
- [ ] Configure firewall rules (ufw)
- [ ] Set up monitoring/alerting
- [ ] Regular security updates for Droplet

## Useful Commands Reference

```bash
# Deploy/Update
cd /root/misoauto && docker compose pull && docker compose up -d

# Stop all
docker compose down

# View logs
docker compose logs -f

# Exec into container
docker compose exec backend sh
docker compose exec frontend sh

# Check images
docker images | grep misoauto

# Force pull and rebuild
docker compose pull && docker compose up -d --force-recreate

# Clean everything (nuclear option)
docker compose down -v && docker system prune -a -f
```

## Support

For issues:
1. Check container logs: `docker compose logs -f`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify images are pulling correctly: `docker compose pull`
4. Check GitHub Actions for build failures

---

**Last Updated**: 2026-02-03
