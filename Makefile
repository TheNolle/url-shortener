.PHONY: help build up down logs restart clean migrate

help:
	@echo "Available commands:"
	@echo "  make build     - Build all containers"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - View logs"
	@echo "  make restart   - Restart all services"
	@echo "  make clean     - Stop and remove all data"
	@echo "  make migrate   - Run database migrations"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

clean:
	docker-compose down -v
	docker system prune -f

migrate:
	docker exec -it s-app npx prisma migrate deploy

dev:
	docker-compose -f docker-compose.dev.yml up -d

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f