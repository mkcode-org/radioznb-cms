# --- Configuration ---
REMOTE_USER = root
REMOTE_HOST = 176.124.208.218
REMOTE_PATH = ~/
# ---------------------

# Phony targets don't represent actual files.
# This tells 'make' to always run the command when the target is called.
.PHONY: build deploy

# The default command, run when you just type 'make'
all: deploy

# Target to build the frontend
build:
	@echo " Building the frontend... 🔨"
	@bun run build

# Target to deploy the project. It depends on 'build' running first.
deploy: build
	@echo "🚀 Deploying to server..."
	@scp -r docker-compose.yml dist/ $(REMOTE_USER)@$(REMOTE_HOST):$(REMOTE_PATH)
	@ssh $(REMOTE_USER)@$(REMOTE_HOST) "cd $(REMOTE_PATH) && docker compose down && docker compose up -d --build"
	@echo "✅ Deployment successful!"

deploy_frontend: build
	@echo "🚀 Deploying frontend to server..."
	@scp -r dist/ $(REMOTE_USER)@$(REMOTE_HOST):$(REMOTE_PATH)
	@ssh $(REMOTE_USER)@$(REMOTE_HOST) "docker compose restart cms-frontend"
	@echo "✅ Deployment successful!"
