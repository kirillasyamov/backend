
NPM_PUBLISH_TOKEN := $(shell node --env-file=.env -e "console.log(process.env.NPM_PUBLISH_TOKEN)")
DOCKER_PUBLISH_TOKEN := $(shell node --env-file=.env -e "console.log(process.env.DOCKER_HUB_PUBLISH_TOKEN)")
COMMON_PACKAGE_VERSION := $(shell node -p "require('./common/package.json').version")

update-common-package-version:
	node -p "require('./common/package.json').version"
	yq -i '.catalogs.common."@kirillasyamov/common" = "^$(COMMON_PACKAGE_VERSION)"' pnpm-workspace.yaml
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

start:
	pnpm start

gen:
	cd auth-service && pnpm prisma generate
	cd user-service && pnpm prisma generate
	mkdir -p ./common/contracts/generated
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
	if not exist "common\contracts\generated" mkdir "common\contracts\generated"
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

k8s-apply-dev:
	kubectl apply -k k8s/overlays/dev

k8s-delete-dev:
	kubectl delete -k k8s/overlays/dev
