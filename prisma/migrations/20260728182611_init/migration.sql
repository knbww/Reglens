-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "JurisdictionLevel" AS ENUM ('FEDERAL', 'STATE', 'PROVINCE', 'TERRITORY', 'COUNTY', 'MUNICIPAL');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('IN_FORCE', 'PROPOSED', 'PENDING_EFFECTIVE', 'AMENDED', 'REPEALED');

-- CreateEnum
CREATE TYPE "PolicyImportance" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "UpdateType" AS ENUM ('NEW_POLICY', 'UPDATED_POLICY', 'EFFECTIVE_DATE_CHANGED', 'REQUIREMENT_CHANGED', 'DEADLINE_APPROACHING', 'REPEALED_OR_REPLACED');

-- CreateEnum
CREATE TYPE "UpdateReviewState" AS ENUM ('UNREVIEWED', 'REVIEWED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "MonitorTargetType" AS ENUM ('POLICY', 'JURISDICTION', 'INDUSTRY', 'TOPIC');

-- CreateEnum
CREATE TYPE "JurisdictionRole" AS ENUM ('OPERATING', 'TARGET_EXPANSION');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PlanSource" AS ENUM ('POLICY', 'AI_ANALYSIS', 'REGULATORY_UPDATE', 'COMPARISON', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReminderKind" AS ENUM ('COMPLIANCE_DEADLINE', 'PERMIT_RENEWAL', 'CERTIFICATION_RENEWAL', 'FILING_DEADLINE', 'POLICY_REVIEW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('REMINDER', 'POLICY_UPDATE', 'TASK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" INTEGER NOT NULL,
    "tagline" TEXT NOT NULL,
    "features" TEXT[],
    "limits" JSONB NOT NULL,
    "highlighted" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "website" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT NOT NULL DEFAULT 'US',
    "region" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "sizeBand" TEXT NOT NULL DEFAULT '1-10',
    "employeeCount" INTEGER NOT NULL DEFAULT 1,
    "orgType" TEXT NOT NULL DEFAULT 'LLC',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "disclaimerAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "industryKey" TEXT NOT NULL DEFAULT 'general_small_business',
    "industryLabel" TEXT NOT NULL DEFAULT 'General small business',
    "subIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "productsSold" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "servicesProvided" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "importsProducts" BOOLEAN NOT NULL DEFAULT false,
    "importCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "employsStaff" BOOLEAN NOT NULL DEFAULT false,
    "handlesCustomerData" BOOLEAN NOT NULL DEFAULT false,
    "physicalLocations" BOOLEAN NOT NULL DEFAULT false,
    "sellsCrossBorder" BOOLEAN NOT NULL DEFAULT false,
    "requiresLicenses" BOOLEAN NOT NULL DEFAULT false,
    "regulatedIndustry" BOOLEAN NOT NULL DEFAULT false,
    "plansExpansion" BOOLEAN NOT NULL DEFAULT false,
    "targetCountry" TEXT,
    "targetRegion" TEXT,
    "targetCity" TEXT,
    "expansionActivity" TEXT,
    "expansionDate" TIMESTAMP(3),
    "compliancePriorities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trackingMethod" TEXT NOT NULL DEFAULT 'nothing_formal',
    "hasComplianceStaff" BOOLEAN NOT NULL DEFAULT false,
    "usesSpreadsheets" BOOLEAN NOT NULL DEFAULT false,
    "usesExternalTool" BOOLEAN NOT NULL DEFAULT false,
    "reviewFrequency" TEXT NOT NULL DEFAULT 'rarely',
    "topConcern" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jurisdiction" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "level" "JurisdictionLevel" NOT NULL,
    "parentCode" TEXT,

    CONSTRAINT "Jurisdiction_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "BusinessJurisdiction" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "jurisdictionCode" TEXT NOT NULL,
    "role" "JurisdictionRole" NOT NULL DEFAULT 'OPERATING',

    CONSTRAINT "BusinessJurisdiction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "jurisdictionCode" TEXT NOT NULL,
    "level" "JurisdictionLevel" NOT NULL,
    "agency" TEXT NOT NULL,
    "industryTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "topicTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PolicyStatus" NOT NULL DEFAULT 'IN_FORCE',
    "importance" "PolicyImportance" NOT NULL DEFAULT 'MODERATE',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "plainSummary" TEXT NOT NULL,
    "fullSummary" TEXT NOT NULL DEFAULT '',
    "affectedOrgs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" JSONB NOT NULL DEFAULT '[]',
    "consequences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deadlines" JSONB NOT NULL DEFAULT '[]',
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "isSampleData" BOOLEAN NOT NULL DEFAULT true,
    "relatedIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyVersion" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "changeNote" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyUpdate" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "versionId" TEXT,
    "type" "UpdateType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "importance" "PolicyImportance" NOT NULL DEFAULT 'MODERATE',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyUpdateReview" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "state" "UpdateReviewState" NOT NULL DEFAULT 'UNREVIEWED',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyUpdateReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoredPolicy" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "targetType" "MonitorTargetType" NOT NULL DEFAULT 'POLICY',
    "policyId" TEXT,
    "targetKey" TEXT,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoredPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPolicy" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New analysis',
    "policyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "structured" JSONB,
    "provider" TEXT NOT NULL DEFAULT 'demo',
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionPlan" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "source" "PlanSource" NOT NULL DEFAULT 'MANUAL',
    "policyId" TEXT,
    "conversationId" TEXT,
    "jurisdictionCode" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "planId" TEXT,
    "policyId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'general',
    "jurisdictionCode" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "dueDate" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "taskId" TEXT,
    "policyId" TEXT,
    "kind" "ReminderKind" NOT NULL DEFAULT 'CUSTOM',
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "advanceDays" INTEGER NOT NULL DEFAULT 7,
    "snoozedUntil" TIMESTAMP(3),
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "reminderId" TEXT,
    "kind" "NotificationKind" NOT NULL DEFAULT 'SYSTEM',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "href" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedComparison" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "activity" TEXT NOT NULL DEFAULT '',
    "jurisdictionCodes" TEXT[],
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'compliance_summary',
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_tier_key" ON "SubscriptionPlan"("tier");

-- CreateIndex
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_ownerId_slug_key" ON "Business"("ownerId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_businessId_key" ON "BusinessProfile"("businessId");

-- CreateIndex
CREATE INDEX "Jurisdiction_country_idx" ON "Jurisdiction"("country");

-- CreateIndex
CREATE INDEX "BusinessJurisdiction_businessId_idx" ON "BusinessJurisdiction"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessJurisdiction_businessId_jurisdictionCode_role_key" ON "BusinessJurisdiction"("businessId", "jurisdictionCode", "role");

-- CreateIndex
CREATE INDEX "Policy_country_idx" ON "Policy"("country");

-- CreateIndex
CREATE INDEX "Policy_jurisdictionCode_idx" ON "Policy"("jurisdictionCode");

-- CreateIndex
CREATE INDEX "Policy_status_idx" ON "Policy"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyVersion_policyId_version_key" ON "PolicyVersion"("policyId", "version");

-- CreateIndex
CREATE INDEX "PolicyUpdate_policyId_idx" ON "PolicyUpdate"("policyId");

-- CreateIndex
CREATE INDEX "PolicyUpdate_detectedAt_idx" ON "PolicyUpdate"("detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyUpdateReview_businessId_updateId_key" ON "PolicyUpdateReview"("businessId", "updateId");

-- CreateIndex
CREATE INDEX "MonitoredPolicy_businessId_idx" ON "MonitoredPolicy"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredPolicy_businessId_targetType_policyId_targetKey_key" ON "MonitoredPolicy"("businessId", "targetType", "policyId", "targetKey");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPolicy_businessId_policyId_key" ON "SavedPolicy"("businessId", "policyId");

-- CreateIndex
CREATE INDEX "AIConversation_businessId_idx" ON "AIConversation"("businessId");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_idx" ON "AIMessage"("conversationId");

-- CreateIndex
CREATE INDEX "ActionPlan_businessId_idx" ON "ActionPlan"("businessId");

-- CreateIndex
CREATE INDEX "Task_businessId_idx" ON "Task"("businessId");

-- CreateIndex
CREATE INDEX "Task_planId_idx" ON "Task"("planId");

-- CreateIndex
CREATE INDEX "ChecklistItem_taskId_idx" ON "ChecklistItem"("taskId");

-- CreateIndex
CREATE INDEX "Reminder_businessId_idx" ON "Reminder"("businessId");

-- CreateIndex
CREATE INDEX "Notification_businessId_read_idx" ON "Notification"("businessId", "read");

-- CreateIndex
CREATE INDEX "SavedComparison_businessId_idx" ON "SavedComparison"("businessId");

-- CreateIndex
CREATE INDEX "Report_businessId_idx" ON "Report"("businessId");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jurisdiction" ADD CONSTRAINT "Jurisdiction_parentCode_fkey" FOREIGN KEY ("parentCode") REFERENCES "Jurisdiction"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BusinessJurisdiction" ADD CONSTRAINT "BusinessJurisdiction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessJurisdiction" ADD CONSTRAINT "BusinessJurisdiction_jurisdictionCode_fkey" FOREIGN KEY ("jurisdictionCode") REFERENCES "Jurisdiction"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_jurisdictionCode_fkey" FOREIGN KEY ("jurisdictionCode") REFERENCES "Jurisdiction"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyVersion" ADD CONSTRAINT "PolicyVersion_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyUpdate" ADD CONSTRAINT "PolicyUpdate_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyUpdate" ADD CONSTRAINT "PolicyUpdate_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PolicyVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyUpdateReview" ADD CONSTRAINT "PolicyUpdateReview_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyUpdateReview" ADD CONSTRAINT "PolicyUpdateReview_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "PolicyUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoredPolicy" ADD CONSTRAINT "MonitoredPolicy_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoredPolicy" ADD CONSTRAINT "MonitoredPolicy_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPolicy" ADD CONSTRAINT "SavedPolicy_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPolicy" ADD CONSTRAINT "SavedPolicy_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ActionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedComparison" ADD CONSTRAINT "SavedComparison_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedComparison" ADD CONSTRAINT "SavedComparison_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
