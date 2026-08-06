-- The trial clock and the Stripe copy.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- Accounts that predate billing start their day from when they signed up, so
-- nobody is locked out by a column that was null a moment ago.
UPDATE "User" SET "trialEndsAt" = "createdAt" + INTERVAL '24 hours' WHERE "trialEndsAt" IS NULL;
