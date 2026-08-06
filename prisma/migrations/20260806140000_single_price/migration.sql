-- The catalogue is a trial and one price, so the per-tier limits column has
-- nothing left to describe, and the withdrawn tier should not outlive its
-- removal from the product.

-- AlterTable
ALTER TABLE "SubscriptionPlan" DROP COLUMN "limits";

-- Anyone left on the withdrawn tier keeps the product, on the tier that exists.
UPDATE "User" SET "plan" = 'PRO' WHERE "plan" = 'BUSINESS';

DELETE FROM "SubscriptionPlan" WHERE "tier" = 'BUSINESS';
