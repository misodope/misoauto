# Makefile for MisoAuto Docker operations

.PHONY: help build up down dev dev-detached dev-down dev-logs clean logs restart backend frontend backend-logs frontend-logs

DEV_COMPOSE = docker compose -f docker-compose.dev.yml

# Default target
help:
	@echo "Available commands:"
	@echo "  make build       - Build all Docker images"
	@echo "  make up          - Start all services in production mode"
	@echo "  make down        - Stop all services"
	@echo "  make dev         - Build and start all services in development mode"
	@echo "  make dev-detached - Build and start development services in the background"
	@echo "  make dev-down    - Stop development services"
	@echo "  make dev-logs    - Follow logs from development services"
	@echo "  make clean       - Remove all containers and images"
	@echo "  make logs        - Show logs from all services"
	@echo "  make restart     - Restart all services"
	@echo "  make backend     - Start only backend service"
	@echo "  make frontend    - Start only frontend service"

# Build all images
build:
	docker-compose build

# Start production services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Start development services
dev:
	$(DEV_COMPOSE) up --build

# Start development services in the background
dev-detached:
	$(DEV_COMPOSE) up --build -d

# Stop development services
dev-down:
	$(DEV_COMPOSE) down

# Show development logs
dev-logs:
	$(DEV_COMPOSE) logs -f

# Clean everything
clean:
	docker-compose down -v --rmi all --remove-orphans
	docker system prune -f

# Show logs
logs:
	docker-compose logs -f

# Restart services
restart:
	docker-compose restart

# Start only backend
backend:
	docker-compose up -d backend

# Start only frontend
frontend:
	docker-compose up -d frontend

# Backend logs
backend-logs:
	docker-compose logs -f backend

# Frontend logs
frontend-logs:
	docker-compose logs -f frontend
