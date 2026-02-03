# Quick Start - CI/CD Setup

This guide will get your CI/CD pipeline up and running in minutes.

## What You'll Get

✅ Automatic Docker image builds on every push to `main`  
✅ Images pushed to GitHub Container Registry (free)  
✅ No more building on your 1GB RAM Droplet  
✅ Simple deployment: just pull and run pre-built images  

## Prerequisites

- [x] GitHub repository: `misodope/misoauto`
- [x] DigitalOcean Droplet with Docker installed
- [x] GitHub Personal Access Token (PAT) with `read:packages` scope
- [x] Domain configured with SSL (Certbot)

## Step 1: Enable GitHub Actions (Local)

The workflow is already created at `.github/workflows/build-and-push.yml`. Just commit and push:

```bash
git add .github/workflows/build-and-push.yml
git add docker-compose.prod.yml
git add DEPLOYMENT.md QUICKSTART.md
git commit -m "Add CI/CD pipeline for Docker image builds"
git push origin main
```

GitHub Actions will automatically start building your images!

## Step 2: Monitor the Build

1. Go to: https://github.com/misodope/misoauto/actions
2. Watch the "Build and Push Docker Images" workflow
3. Wait for it to complete (first build ~5-10 minutes)

## Step 3: Setup Droplet (One-Time)

SSH into your Droplet:

```bash
ssh root@YOUR_DROPLET_IP
```

### 3a. Login to GitHub Container Registry

```bash
# Use your GitHub PAT
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u misodope --password-stdin
```

### 3b. Create Deployment Directory

```bash
mkdir -p /root/misoauto
cd /root/misoauto
```

### 3c. Copy docker-compose File

From your local machine:

```bash
scp docker-compose.prod.yml root@YOUR_DROPLET_IP:/root/misoauto/docker-compose.yml
```

### 3d. Create Environment File

On the Droplet, create `.env`:

```bash
cat > /root/misoauto/.env << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Backend
JWT_SECRET=your-secret-here
PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=https://YOUR_DOMAIN.com/api
PORT=3000
EOF
```

### 3e. Pull and Start Containers

```bash
cd /root/misoauto
docker compose pull
docker compose up -d
```

### 3f. Verify Deployment

```bash
docker compose ps
docker compose logs -f
curl http://localhost:3001/health
curl http://localhost:3000
```

## Step 4: Configure Nginx (if not done)

See `DEPLOYMENT.md` for detailed Nginx configuration.

Quick summary:
- Nginx config location: `/root/nginx/conf.d/`
- Proxy frontend: `http://host.docker.internal:3000`
- Proxy backend: `http://host.docker.internal:3001`
- Test: `nginx -t`
- Reload: `systemctl reload nginx`

## Step 5: Deploy Updates

Every time you push to `main`, new images are built. To deploy:

```bash
ssh root@YOUR_DROPLET_IP
cd /root/misoauto
docker compose pull
docker compose up -d
```

Or use the deploy script from `DEPLOYMENT.md`:

```bash
ssh root@YOUR_DROPLET_IP /root/misoauto/deploy.sh
```

## Troubleshooting

### Build Failed on GitHub Actions

Check logs at: https://github.com/misodope/misoauto/actions

Common issues:
- Dockerfile syntax errors
- Missing dependencies in package.json
- Build context issues

### Can't Pull Images on Droplet

```bash
# Re-authenticate
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u misodope --password-stdin

# Test pull manually
docker pull ghcr.io/misodope/misoauto/backend:latest
```

### Container Won't Start

```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Check environment variables
docker compose config
```

### Nginx Can't Connect to Containers

```bash
# Check if host.docker.internal works
ping host.docker.internal

# If not, add to /etc/hosts
echo "127.0.0.1 host.docker.internal" >> /etc/hosts

# Or use 127.0.0.1 directly in Nginx config
```

## Next Steps

- [ ] Set up automated deployment (webhook or SSH action)
- [ ] Configure monitoring/alerting
- [ ] Set up database backups
- [ ] Add staging environment
- [ ] Configure firewall rules (ufw)

## Useful Links

- [GitHub Actions Dashboard](https://github.com/misodope/misoauto/actions)
- [GHCR Packages](https://github.com/misodope?tab=packages)
- [Full Deployment Guide](./DEPLOYMENT.md)

---

**Need Help?** Check `DEPLOYMENT.md` for comprehensive troubleshooting and configuration details.
