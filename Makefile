include .env

run-react-dev:
	API_URL=$(API_URL) npm start


run-react-prod:
	npm install
	API_URL=$(API_URL) npm run build
	npx http-server ./dist -p $(REACT_PORT)


local-encryption-key:
	@echo "Generating encryption key..."
	@python3 -c "import secrets, string; print('ENCRYPTION_KEY=' + ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32)))"



# Docker
auth:
	aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(DOCKER_REGISTRY)

create-repos:
	aws ecr create-repository --repository-name $(REACT_IMAGE) --region us-east-1 || true

REACT_BUILD_ARGS=--build-arg PORT=$(REACT_PORT) --build-arg API_URL=$(API_URL) --build-arg SENTRY_DSN=$(SENTRY_DSN)
docker-react:
	docker build $(REACT_BUILD_ARGS) -t $(DOCKER_REGISTRY)/$(REACT_IMAGE):$(REACT_VERSION) -f Dockerfile.react .
	docker push $(DOCKER_REGISTRY)/$(REACT_IMAGE):$(REACT_VERSION)
	kubectl rollout restart deployment $(REACT_DEPLOYMENT) --namespace=$(NAMESPACE)


# Playwright E2E Tests
test-e2e:
	npm run test:e2e

test-e2e-ui:
	npm run test:e2e:ui

test-e2e-headed:
	npm run test:e2e:headed

test-e2e-debug:
	npm run test:e2e:debug

test-e2e-report:
	npm run test:e2e:report

test-e2e-install:
	npm run test:e2e:install

