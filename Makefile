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
