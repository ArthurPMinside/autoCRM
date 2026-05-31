.PHONY: dev backend frontend seed build test clean

dev:
	@echo "Starting backend and frontend..."
	@make backend &
	@make frontend

backend:
	cd backend && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

frontend:
	cd web && npm run dev

seed:
	cd backend && source venv/bin/activate && PYTHONPATH=./ python seed.py

build:
	cd web && npm run build

test:
	cd backend && source venv/bin/activate && pytest

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true

docker:
	docker-compose up --build
