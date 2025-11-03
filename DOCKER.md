# Docker Setup Guide for IntelliRisk

This guide explains how to run the IntelliRisk platform using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB of free RAM
- At least 10GB of free disk space

## Quick Start

1. **Clone the repository** (if you haven't already):
```bash
git clone <repository-url>
cd polyfinance2025
```

2. **Build and start the services**:
```bash
docker compose up -d
```

3. **Access the application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- SearXNG (for AI-powered search): http://localhost:8888

## Detailed Instructions

### First Time Setup

1. **Copy environment variables** (optional for basic features):
```bash
cp .env.example .env
# Edit .env and add your AWS credentials if needed
```

2. **Build the Docker images**:
```bash
docker compose build
```

This will:
- Build the backend Python image with all dependencies
- Build the frontend React image with production optimization
- Pull the SearXNG image for AI-powered search
- Install spaCy language model
- Set up nginx for serving the frontend

3. **Start the services**:
```bash
docker compose up -d
```

The `-d` flag runs containers in detached mode.

4. **Check the logs**:
```bash
# View all logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# View frontend logs only
docker compose logs -f frontend
```

### Managing the Application

**Stop the services**:
```bash
docker compose down
```

**Stop and remove volumes** (clears all data):
```bash
docker compose down -v
```

**Restart a specific service**:
```bash
docker compose restart backend
docker compose restart frontend
```

**Rebuild after code changes**:
```bash
docker compose build --no-cache
docker compose up -d
```

**View running containers**:
```bash
docker compose ps
```

**Access backend shell**:
```bash
docker compose exec backend bash
```

### Architecture

The application runs as three services:

1. **Backend** (`intellirisk-backend`):
   - Python 3.11 with FastAPI
   - Runs on port 8000
   - Includes all ML/NLP models
   - spaCy model loaded
   - Health check endpoint at `/health`

2. **Frontend** (`intellirisk-frontend`):
   - React app built with Vite
   - Served via nginx
   - Runs on port 3000
   - Production-optimized build

3. **SearXNG** (`intellirisk-searxng`):
   - Privacy-respecting metasearch engine
   - Runs on port 8888
   - Powers AI research capabilities
   - No tracking, no cookies
   - Health check endpoint at `:8080`

### Volumes and Data Persistence

The following directories are mounted as volumes to preserve data:

- `./data` - Company and portfolio data
- `./fillings` - SEC filings data
- `./nlp_cache.json` - NLP analysis cache
- `./backend/uploads` - Uploaded documents
- `./searxng` - SearXNG configuration and settings

To reset all data:
```bash
docker compose down -v
```

### Environment Variables

Key environment variables (set in `.env`):

- `FORCE_NEW_NLP`: Force re-analysis of all NLP data (default: `false`)
- `VITE_API_URL`: Frontend API endpoint (default: `http://localhost:8000/api`)
- AWS credentials (optional)
- `SEARXNG_URL`: SearXNG instance URL (default: `http://searxng:8888`)
- `SEARXNG_HOSTNAME`: SearXNG hostname (default: `localhost`)
- `SEARXNG_PORT`: SearXNG port (default: `8888`)

### Resource Requirements

**Minimum**:
- 2 CPUs
- 2GB RAM
- 5GB disk space

**Recommended**:
- 4 CPUs
- 4GB+ RAM
- 20GB+ disk space (for models and cache)

### Troubleshooting

**Backend won't start**:
```bash
# Check backend logs
docker compose logs backend

# Check if port 8000 is in use
netstat -tuln | grep 8000

# Restart backend
docker compose restart backend
```

**Frontend can't connect to backend**:
- Ensure backend is healthy: `curl http://localhost:8000/health`
- Check that both containers are running: `docker compose ps`
- Verify network connectivity: `docker compose exec frontend ping backend`

**NLP cache issues**:
```bash
# Remove cache and force rebuild
rm nlp_cache.json
docker compose restart backend
# OR set FORCE_NEW_NLP=true in .env
```

**Out of memory errors**:
- Increase Docker memory limit
- Reduce backend worker processes
- Clear NLP cache

**Port conflicts**:
Edit `docker compose.yml` to change port mappings:
```yaml
ports:
  - "8001:8000"  # Backend
  - "3001:80"    # Frontend
```

### Development with Docker

For development, mount source code as volumes:

```yaml
# Add to docker compose.yml under backend service
volumes:
  - ./backend:/app
  - ... existing volumes
```

Then restart:
```bash
docker compose restart backend
```

### Production Deployment

For production:

1. **Use environment-specific configs**:
```bash
docker compose -f docker compose.yml -f docker compose.prod.yml up -d
```

2. **Set up reverse proxy** (nginx, traefik, etc.)

3. **Use secrets management** for sensitive data

4. **Enable HTTPS** certificates

5. **Set resource limits** appropriately

6. **Configure logging** to external service

7. **Set up monitoring** and alerting

### Building Individual Services

**Backend only**:
```bash
docker build -t intellirisk-backend backend/
```

**Frontend only**:
```bash
docker build -t intellirisk-frontend frontend/
```

### Health Checks

The application includes health checks:

- Backend: `GET /health` - Returns JSON with status
- Frontend: HTTP GET to `/` - Returns 200 if healthy

Monitor health:
```bash
docker compose ps
# Check health status in STATUS column
```

### Clean Up

**Remove everything**:
```bash
docker compose down -v --rmi all
```

**Remove unused images**:
```bash
docker image prune -a
```

**Remove unused volumes**:
```bash
docker volume prune
```

**Full system cleanup**:
```bash
docker system prune -a --volumes
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project README](README.md)

