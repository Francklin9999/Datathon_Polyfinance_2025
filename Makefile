.PHONY: help build up down restart logs clean shell-backend shell-frontend test

help: ## Show this help message
	@echo "IntelliRisk Docker Management"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker images
	docker compose build

up: ## Start all services in detached mode
	docker compose up -d

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

logs: ## Show logs from all services
	docker compose logs -f

logs-backend: ## Show logs from backend only
	docker compose logs -f backend

logs-frontend: ## Show logs from frontend only
	docker compose logs -f frontend

logs-searxng: ## Show logs from SearXNG only
	docker compose logs -f searxng

shell-searxng: ## Open shell in SearXNG container
	docker compose exec searxng sh

clean: ## Stop and remove everything including volumes
	docker compose down -v --rmi all

shell-backend: ## Open shell in backend container
	docker compose exec backend bash

shell-frontend: ## Open shell in frontend container
	docker compose exec frontend sh

ps: ## List running containers
	docker compose ps

rebuild: ## Rebuild without cache and start
	docker compose build --no-cache
	docker compose up -d

test: ## Run health checks
	@echo "Testing backend health..."
	@curl -f http://localhost:8000/health || echo "Backend not responding"
	@echo "\nTesting frontend..."
	@curl -f http://localhost:3000 || echo "Frontend not responding"

start: build up ## Build and start services (default)

.DEFAULT_GOAL := start

