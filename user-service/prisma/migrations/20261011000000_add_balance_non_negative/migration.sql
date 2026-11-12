-- Fix existing negative balances before enforcing the non-negative invariant.
UPDATE "user" SET "balance" = 0 WHERE "balance" < 0;

-- Enforce balance >= 0 at the database level as a last line of defense.
ALTER TABLE "user" ADD CONSTRAINT "user_balance_non_negative" CHECK ("balance" >= 0);