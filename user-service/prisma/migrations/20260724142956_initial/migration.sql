-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "login" VARCHAR(100) NOT NULL,
    "email" TEXT NOT NULL,
    "age" SMALLINT NOT NULL,
    "bio" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_login_key" ON "user"("login");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
