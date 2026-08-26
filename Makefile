
NPM_PUBLISH_TOKEN := $(shell node --env-file=.env -e "console.log(process.env.NPM_PUBLISH_TOKEN)")
DOCKER_PUBLISH_TOKEN := $(shell node --env-file=.env -e "console.log(process.env.DOCKER_HUB_PUBLISH_TOKEN)")
COMMON_PACKAGE_VERSION := $(shell node -p "require('./common/package.json').version")

MICROSERVICES := $(patsubst %/,%,$(filter-out common/,$(sort $(dir $(wildcard */package.json)))))
IMAGES := $(foreach s,$(MICROSERVICES),kirillasyamov/$(s):latest)

ifeq ($(OS),Windows_NT)
	MK_PRISMA_DIR_COMMAND := if not exist "common\contracts\generated" mkdir "common\contracts\generated"
else
	MK_PRISMA_DIR_COMMAND := mkdir -p ./common/contracts/generated
endif

.ONESHELL: start-prod pods-rollout

start-prod:
	@if [ "$$(minikube status --format '{{.Host}}' 2>/dev/null)" = "Running" ]; then
		echo "Minikube already running"
	else
		minikube start --driver=docker --cpus=4 --memory=6144 --apiserver-ips=127.0.0.1
	fi

pods-rollout:
	@set -e
	for d in $(MICROSERVICES); do
		echo ">>> $$d: waiting for rollout"
		if ! kubectl -n backend rollout status "deployment/$$d" --timeout=180s; then
			echo ">>> $$d ROLLOUT FAILED:"
			kubectl -n backend get pods -l "app=$$d" -o wide || true
			kubectl -n backend logs "deployment/$$d" --tail=50 --prefix || true
			exit 1
		fi
	done

restart-prod:
	kubectl apply -k .kubernetes/overlays/prod
	kubectl -n backend rollout restart deployment $(MICROSERVICES)
	$(MAKE) pods-rollout

update-common-package-version:
	node -p "require('./common/package.json').version"
	yq -i '.catalogs.common."@kirillasyamov/common" = "^$(COMMON_PACKAGE_VERSION)"' pnpm-workspace.yaml
	pnpm install

pull-dev:
	docker compose pull

pull-prod:
	$(MAKE) start-prod
	@for img in $(IMAGES); do minikube ssh -- sudo docker pull $$img; done
	$(MAKE) restart-prod

clean-prod:
	$(MAKE) start-prod
	kubectl -n backend delete deployment --ignore-not-found=true $(MICROSERVICES)
	@sleep 5
	minikube ssh -- sudo docker image prune -af
	rm -rf ~/.minikube/cache/images

down-dev:
	docker compose down

down-prod:
	minikube stop

up-dev:
	docker compose up -d
	pnpm dev

up-prod:
	$(MAKE) start-prod
	kubectl apply -k .kubernetes/overlays/prod
	$(MAKE) restart-prod
	$(MAKE) lens-sync

tunnel-url:
	@echo "https://$$(kubectl -n backend get configmap backend-config -o jsonpath='{.data.NGROK_DOMAIN}')"

metrics:
	minikube addons enable metrics-server

dashboard:
	minikube dashboard

lens-sync:
	mkdir -p /mnt/c/Users/kiril/.kube
	cp -f ~/.kube/config /mnt/c/Users/kiril/.kube/config

build:
	pnpm build

start:
	pnpm start

gen:
	cd auth-service && pnpm prisma generate
	cd user-service && pnpm prisma generate
	$(MK_PRISMA_DIR_COMMAND)
	pnpm gen

migrate-auth:
	cd auth-service && npx prisma migrate dev

migrate-user:
	cd user-service && npx prisma migrate dev

migrate: migrate-auth migrate-user

db-push-auth:
	cd auth-service && pnpm prisma db push --force-reset

db-push-user:
	cd user-service && pnpm prisma db push --force-reset

db-push: db-push-auth db-push-user

lint:
	pnpm lint

format:
	pnpm format

publish-common:
	$(MK_PRISMA_DIR_COMMAND)
	pnpm gen
	pnpm --filter @kirillasyamov/common build
	cd common && pnpm publish --no-git-checks --//registry.npmjs.org/:_authToken="$(NPM_PUBLISH_TOKEN)"
	$(MAKE) update-common-package-version

publish-common-major:
	cd common && pnpm version major --no-git-tag-version --no-git-checks
	$(MAKE) publish-common
	$(MAKE) update-common-package-version

publish-common-minor:
	cd common && pnpm version minor --no-git-tag-version --no-git-checks
	$(MAKE) publish-common
	$(MAKE) update-common-package-version

publish-common-patch:
	cd common && pnpm version patch --no-git-tag-version --no-git-checks
	$(MAKE) publish-common
	$(MAKE) update-common-package-version

publish-docker-images:
	docker login -u kirillasyamov --password $(DOCKER_PUBLISH_TOKEN)
	docker buildx bake --push

publish-docker-%:
	docker login -u kirillasyamov --password $(DOCKER_PUBLISH_TOKEN)
	docker buildx bake --push $*

cd:
	gh workflow run cd.yaml --ref $(shell git branch --show-current)
