-- Industrial Intelligence Phase 1 foundation.
-- Additive only: creates new enums, tables, relations, and indexes.

CREATE TYPE "IndustrialIndustryCategory" AS ENUM ('FORGING', 'STEEL', 'OTHER_MANUFACTURING');
CREATE TYPE "IndustrialVerificationStatus" AS ENUM ('UNVERIFIED', 'DISCOVERY_ONLY', 'SOURCE_CAPTURED', 'AUTO_NORMALIZED', 'NEEDS_REVIEW', 'ASSOCIATION_VERIFIED', 'REGULATORY_VERIFIED', 'OFFICIAL_VERIFIED', 'MANUALLY_VERIFIED', 'PARTIALLY_VERIFIED', 'VERIFIED', 'CONFLICTING', 'STALE', 'REJECTED');
CREATE TYPE "IndustrialLifecycleStatus" AS ENUM ('DISCOVERED', 'VERIFICATION_PENDING', 'VERIFIED', 'QUALIFIED', 'OUTREACH_READY', 'CONTACTED', 'ENGAGED', 'CRM_PROMOTED', 'OPPORTUNITY', 'QUOTATION', 'CUSTOMER', 'DISQUALIFIED');
CREATE TYPE "IndustrialPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "IndustrialSourceType" AS ENUM ('OFFICIAL_WEBSITE', 'GOVERNMENT', 'SPCB_OCMMS', 'AIFI', 'AIIFA', 'JPC', 'INDUSTRY_ASSOCIATION', 'GOOGLE_MAPS', 'INDIAMART', 'TRADEINDIA', 'EXISTING_PHONE_CRM', 'MANUAL_RESEARCH', 'OTHER');
CREATE TYPE "IndustrialContactScope" AS ENUM ('COMPANY_LEVEL', 'PLANT_SPECIFIC');
CREATE TYPE "IndustrialServiceType" AS ENUM ('MPI_NDT', 'VISUAL_INSPECTION', 'GRINDING', 'FETTLING', 'SORTING', 'SEGREGATION', 'REWORK', 'OILING', 'PACKING', 'MATERIAL_HANDLING', 'PRODUCTION_SUPPORT', 'QUALITY_CONTAINMENT', 'MANAGED_MANPOWER', 'OTHER_INDUSTRIAL_SERVICES');
CREATE TYPE "IndustrialOpportunityStatus" AS ENUM ('IDENTIFIED', 'NEEDS_VERIFICATION', 'VERIFIED_FIT', 'QUALIFIED', 'OUTREACH_READY', 'CONTACTED', 'ENGAGED', 'DISQUALIFIED');
CREATE TYPE "IndustrialImportStatus" AS ENUM ('UPLOADED', 'PARSED', 'VALIDATED', 'DRY_RUN_READY', 'DUPLICATE_REVIEW', 'APPROVED', 'COMMITTING', 'COMMITTED', 'FAILED', 'ROLLED_BACK');
CREATE TYPE "IndustrialImportRowStatus" AS ENUM ('PARSED', 'INVALID', 'VALID', 'DUPLICATE_CANDIDATE', 'CONFLICT', 'READY_TO_COMMIT', 'COMMITTED', 'SKIPPED', 'FAILED');
CREATE TYPE "IndustrialDuplicateStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "IndustrialDuplicateResolutionAction" AS ENUM ('MERGE', 'UPDATE_EXISTING', 'CREATE_NEW_COMPANY', 'CREATE_NEW_PLANT', 'SKIP_ROW', 'MARK_NOT_DUPLICATE');
CREATE TYPE "IndustrialPromotionType" AS ENUM ('OUTREACH', 'CRM', 'MARKETPLACE', 'ACCOUNT', 'SUPPORT');
CREATE TYPE "IndustrialPromotionTarget" AS ENUM ('OUTREACH_PROSPECT', 'CRM_LEAD', 'MARKETPLACE_LISTING', 'USER_REGISTRATION', 'SUPPORT_TICKET');
CREATE TYPE "IndustrialPromotionStatus" AS ENUM ('PREPARED', 'PROMOTED', 'SKIPPED', 'FAILED', 'SUPERSEDED');
CREATE TYPE "AdminPermissionEffect" AS ENUM ('ALLOW', 'DENY');

CREATE TABLE "AdminActor" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "username" TEXT NOT NULL,
  "displayName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "AdminActor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminRole" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminPermission" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminActorRole" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actorId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  CONSTRAINT "AdminActorRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminRolePermission" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "effect" "AdminPermissionEffect" NOT NULL DEFAULT 'ALLOW',
  CONSTRAINT "AdminRolePermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialCompany" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "legalName" TEXT,
  "canonicalName" TEXT NOT NULL,
  "displayName" TEXT,
  "normalizedName" TEXT NOT NULL,
  "aliases" JSONB,
  "companyType" TEXT,
  "industryCategory" "IndustrialIndustryCategory" NOT NULL,
  "subcategories" JSONB,
  "officialWebsite" TEXT,
  "officialDomain" TEXT,
  "gstin" TEXT,
  "panNumber" TEXT,
  "country" TEXT NOT NULL DEFAULT 'India',
  "region" TEXT,
  "state" TEXT,
  "city" TEXT,
  "headOfficeAddress" TEXT,
  "verificationStatus" "IndustrialVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "lifecycleStatus" "IndustrialLifecycleStatus" NOT NULL DEFAULT 'DISCOVERED',
  "researchStatus" TEXT NOT NULL DEFAULT 'DISCOVERY',
  "priority" "IndustrialPriority" NOT NULL DEFAULT 'MEDIUM',
  "opportunityScore" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "raw" JSONB,
  CONSTRAINT "IndustrialCompany_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialPlant" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "companyId" TEXT NOT NULL,
  "plantName" TEXT NOT NULL,
  "plantCode" TEXT,
  "normalizedPlantName" TEXT NOT NULL,
  "plantType" TEXT,
  "country" TEXT NOT NULL DEFAULT 'India',
  "region" TEXT,
  "state" TEXT,
  "district" TEXT,
  "city" TEXT,
  "industrialCluster" TEXT,
  "industrialArea" TEXT,
  "address" TEXT,
  "normalizedAddress" TEXT,
  "pincode" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "capacityScale" TEXT,
  "verificationStatus" "IndustrialVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "lifecycleStatus" "IndustrialLifecycleStatus" NOT NULL DEFAULT 'DISCOVERED',
  "opportunityScore" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "raw" JSONB,
  CONSTRAINT "IndustrialPlant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialProcess" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "industryCategory" "IndustrialIndustryCategory" NOT NULL,
  "parentProcessId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "IndustrialProcess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialCapability" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "companyId" TEXT NOT NULL,
  "plantId" TEXT,
  "processId" TEXT,
  "capabilityType" TEXT NOT NULL,
  "industryCategory" "IndustrialIndustryCategory" NOT NULL,
  "subcategory" TEXT,
  "processName" TEXT,
  "product" TEXT,
  "material" TEXT,
  "capacityText" TEXT,
  "qualityCertifications" JSONB,
  "sourceId" TEXT,
  "verificationStatus" "IndustrialVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "raw" JSONB,
  CONSTRAINT "IndustrialCapability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialServiceOpportunity" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "companyId" TEXT NOT NULL,
  "plantId" TEXT,
  "serviceType" "IndustrialServiceType" NOT NULL,
  "fitLevel" "IndustrialPriority" NOT NULL DEFAULT 'MEDIUM',
  "score" INTEGER NOT NULL DEFAULT 0,
  "status" "IndustrialOpportunityStatus" NOT NULL DEFAULT 'IDENTIFIED',
  "reason" TEXT,
  "evidence" TEXT,
  "estimatedNeed" TEXT,
  "sourceId" TEXT,
  "verificationStatus" "IndustrialVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "qualifiedAt" TIMESTAMP(3),
  "ownerAdminId" TEXT,
  "notes" TEXT,
  "raw" JSONB,
  CONSTRAINT "IndustrialServiceOpportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialContact" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "companyId" TEXT NOT NULL,
  "plantId" TEXT,
  "personName" TEXT,
  "normalizedPersonName" TEXT,
  "designation" TEXT,
  "department" TEXT,
  "phone" TEXT,
  "normalizedPhone" TEXT,
  "whatsapp" TEXT,
  "normalizedWhatsapp" TEXT,
  "email" TEXT,
  "normalizedEmail" TEXT,
  "contactScope" "IndustrialContactScope" NOT NULL DEFAULT 'COMPANY_LEVEL',
  "sourceId" TEXT,
  "verificationStatus" "IndustrialVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "consentStatus" TEXT NOT NULL DEFAULT 'unknown',
  "lastVerifiedAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "raw" JSONB,
  CONSTRAINT "IndustrialContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialImportBatch" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "status" "IndustrialImportStatus" NOT NULL DEFAULT 'UPLOADED',
  "fileName" TEXT,
  "fileType" TEXT,
  "fileSha256" TEXT,
  "sourceSystem" TEXT,
  "sourceUrl" TEXT,
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "validRows" INTEGER NOT NULL DEFAULT 0,
  "invalidRows" INTEGER NOT NULL DEFAULT 0,
  "duplicateCandidates" INTEGER NOT NULL DEFAULT 0,
  "newCompanies" INTEGER NOT NULL DEFAULT 0,
  "newPlants" INTEGER NOT NULL DEFAULT 0,
  "newContacts" INTEGER NOT NULL DEFAULT 0,
  "updatedCompanies" INTEGER NOT NULL DEFAULT 0,
  "committedAt" TIMESTAMP(3),
  "rolledBackAt" TIMESTAMP(3),
  "notes" TEXT,
  "raw" JSONB,
  CONSTRAINT "IndustrialImportBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialSource" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "sourceType" "IndustrialSourceType" NOT NULL,
  "sourceUrl" TEXT,
  "sourceTitle" TEXT,
  "sourceDomain" TEXT,
  "researchDate" TIMESTAMP(3),
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verificationLevel" "IndustrialVerificationStatus" NOT NULL DEFAULT 'DISCOVERY_ONLY',
  "verificationSource" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "sheetName" TEXT,
  "sheetTab" TEXT,
  "rowNumber" INTEGER,
  "importBatchId" TEXT,
  "companyId" TEXT,
  "plantId" TEXT,
  "contactId" TEXT,
  "capabilityId" TEXT,
  "serviceOpportunityId" TEXT,
  "raw" JSONB,
  CONSTRAINT "IndustrialSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialActivity" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actor" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT,
  "entityId" TEXT,
  "note" TEXT,
  "companyId" TEXT,
  "plantId" TEXT,
  "contactId" TEXT,
  "serviceOpportunityId" TEXT,
  "raw" JSONB,
  CONSTRAINT "IndustrialActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialAssignment" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "assignedTo" TEXT NOT NULL,
  "assignedBy" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "purpose" TEXT NOT NULL,
  "companyId" TEXT,
  "plantId" TEXT,
  "contactId" TEXT,
  "serviceOpportunityId" TEXT,
  "dueAt" TIMESTAMP(3),
  "notes" TEXT,
  CONSTRAINT "IndustrialAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialImportRow" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "batchId" TEXT NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "status" "IndustrialImportRowStatus" NOT NULL DEFAULT 'PARSED',
  "raw" JSONB,
  "normalized" JSONB,
  "validationIssues" JSONB,
  "duplicateCandidateIds" JSONB,
  "commitAction" TEXT,
  "companyId" TEXT,
  "plantId" TEXT,
  "contactId" TEXT,
  "capabilityId" TEXT,
  "serviceOpportunityId" TEXT,
  "error" TEXT,
  CONSTRAINT "IndustrialImportRow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialDuplicateCandidate" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "batchId" TEXT,
  "rowId" TEXT,
  "candidateType" TEXT NOT NULL,
  "existingEntityType" TEXT,
  "existingEntityId" TEXT,
  "incomingEntityType" TEXT,
  "incomingFingerprint" TEXT,
  "matchTier" TEXT NOT NULL,
  "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "matchReasons" JSONB,
  "status" "IndustrialDuplicateStatus" NOT NULL DEFAULT 'OPEN',
  "resolvedBy" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolutionAction" "IndustrialDuplicateResolutionAction",
  "resolutionNote" TEXT,
  CONSTRAINT "IndustrialDuplicateCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialDuplicateResolution" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "candidateId" TEXT NOT NULL,
  "action" "IndustrialDuplicateResolutionAction" NOT NULL,
  "resolvedBy" TEXT NOT NULL,
  "note" TEXT,
  "raw" JSONB,
  CONSTRAINT "IndustrialDuplicateResolution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialPromotion" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "promotionKey" TEXT NOT NULL,
  "promotionType" "IndustrialPromotionType" NOT NULL,
  "targetEntity" "IndustrialPromotionTarget" NOT NULL,
  "targetEntityId" TEXT NOT NULL,
  "status" "IndustrialPromotionStatus" NOT NULL DEFAULT 'PREPARED',
  "companyId" TEXT NOT NULL,
  "plantId" TEXT,
  "contactId" TEXT,
  "serviceOpportunityId" TEXT,
  "createdBy" TEXT,
  "notes" TEXT,
  "raw" JSONB,
  CONSTRAINT "IndustrialPromotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustrialAuditEvent" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actor" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT,
  "entityId" TEXT,
  "requestId" TEXT,
  "importBatchId" TEXT,
  "companyId" TEXT,
  "plantId" TEXT,
  "contactId" TEXT,
  "serviceOpportunityId" TEXT,
  "note" TEXT,
  "raw" JSONB,
  CONSTRAINT "IndustrialAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminActor_username_key" ON "AdminActor"("username");
CREATE INDEX "AdminActor_status_idx" ON "AdminActor"("status");
CREATE UNIQUE INDEX "AdminRole_key_key" ON "AdminRole"("key");
CREATE INDEX "AdminRole_status_idx" ON "AdminRole"("status");
CREATE UNIQUE INDEX "AdminPermission_key_key" ON "AdminPermission"("key");
CREATE UNIQUE INDEX "AdminActorRole_actorId_roleId_key" ON "AdminActorRole"("actorId", "roleId");
CREATE INDEX "AdminActorRole_roleId_idx" ON "AdminActorRole"("roleId");
CREATE UNIQUE INDEX "AdminRolePermission_roleId_permissionId_key" ON "AdminRolePermission"("roleId", "permissionId");
CREATE INDEX "AdminRolePermission_permissionId_idx" ON "AdminRolePermission"("permissionId");

CREATE INDEX "IndustrialCompany_normalizedName_idx" ON "IndustrialCompany"("normalizedName");
CREATE INDEX "IndustrialCompany_officialDomain_idx" ON "IndustrialCompany"("officialDomain");
CREATE INDEX "IndustrialCompany_gstin_idx" ON "IndustrialCompany"("gstin");
CREATE INDEX "IndustrialCompany_industryCategory_state_idx" ON "IndustrialCompany"("industryCategory", "state");
CREATE INDEX "IndustrialCompany_state_city_idx" ON "IndustrialCompany"("state", "city");
CREATE INDEX "IndustrialCompany_region_idx" ON "IndustrialCompany"("region");
CREATE INDEX "IndustrialCompany_verificationStatus_idx" ON "IndustrialCompany"("verificationStatus");
CREATE INDEX "IndustrialCompany_lifecycleStatus_idx" ON "IndustrialCompany"("lifecycleStatus");
CREATE INDEX "IndustrialCompany_priority_idx" ON "IndustrialCompany"("priority");
CREATE INDEX "IndustrialCompany_createdAt_idx" ON "IndustrialCompany"("createdAt");
CREATE INDEX "IndustrialCompany_updatedAt_idx" ON "IndustrialCompany"("updatedAt");

CREATE INDEX "IndustrialPlant_companyId_idx" ON "IndustrialPlant"("companyId");
CREATE INDEX "IndustrialPlant_companyId_normalizedPlantName_idx" ON "IndustrialPlant"("companyId", "normalizedPlantName");
CREATE INDEX "IndustrialPlant_companyId_city_idx" ON "IndustrialPlant"("companyId", "city");
CREATE INDEX "IndustrialPlant_state_district_city_idx" ON "IndustrialPlant"("state", "district", "city");
CREATE INDEX "IndustrialPlant_region_idx" ON "IndustrialPlant"("region");
CREATE INDEX "IndustrialPlant_industrialCluster_idx" ON "IndustrialPlant"("industrialCluster");
CREATE INDEX "IndustrialPlant_industrialArea_idx" ON "IndustrialPlant"("industrialArea");
CREATE INDEX "IndustrialPlant_plantType_idx" ON "IndustrialPlant"("plantType");
CREATE INDEX "IndustrialPlant_verificationStatus_idx" ON "IndustrialPlant"("verificationStatus");
CREATE INDEX "IndustrialPlant_lifecycleStatus_idx" ON "IndustrialPlant"("lifecycleStatus");
CREATE INDEX "IndustrialPlant_createdAt_idx" ON "IndustrialPlant"("createdAt");
CREATE INDEX "IndustrialPlant_updatedAt_idx" ON "IndustrialPlant"("updatedAt");

CREATE INDEX "IndustrialContact_companyId_idx" ON "IndustrialContact"("companyId");
CREATE INDEX "IndustrialContact_plantId_idx" ON "IndustrialContact"("plantId");
CREATE INDEX "IndustrialContact_department_idx" ON "IndustrialContact"("department");
CREATE INDEX "IndustrialContact_normalizedPhone_idx" ON "IndustrialContact"("normalizedPhone");
CREATE INDEX "IndustrialContact_normalizedWhatsapp_idx" ON "IndustrialContact"("normalizedWhatsapp");
CREATE INDEX "IndustrialContact_normalizedEmail_idx" ON "IndustrialContact"("normalizedEmail");
CREATE INDEX "IndustrialContact_verificationStatus_idx" ON "IndustrialContact"("verificationStatus");
CREATE INDEX "IndustrialContact_consentStatus_idx" ON "IndustrialContact"("consentStatus");
CREATE INDEX "IndustrialContact_contactScope_idx" ON "IndustrialContact"("contactScope");
CREATE INDEX "IndustrialContact_createdAt_idx" ON "IndustrialContact"("createdAt");
CREATE INDEX "IndustrialContact_updatedAt_idx" ON "IndustrialContact"("updatedAt");

CREATE UNIQUE INDEX "IndustrialProcess_normalizedName_key" ON "IndustrialProcess"("normalizedName");
CREATE INDEX "IndustrialProcess_industryCategory_idx" ON "IndustrialProcess"("industryCategory");
CREATE INDEX "IndustrialProcess_status_idx" ON "IndustrialProcess"("status");

CREATE INDEX "IndustrialCapability_companyId_idx" ON "IndustrialCapability"("companyId");
CREATE INDEX "IndustrialCapability_plantId_idx" ON "IndustrialCapability"("plantId");
CREATE INDEX "IndustrialCapability_processId_idx" ON "IndustrialCapability"("processId");
CREATE INDEX "IndustrialCapability_industryCategory_subcategory_idx" ON "IndustrialCapability"("industryCategory", "subcategory");
CREATE INDEX "IndustrialCapability_processName_idx" ON "IndustrialCapability"("processName");
CREATE INDEX "IndustrialCapability_product_idx" ON "IndustrialCapability"("product");
CREATE INDEX "IndustrialCapability_material_idx" ON "IndustrialCapability"("material");
CREATE INDEX "IndustrialCapability_verificationStatus_idx" ON "IndustrialCapability"("verificationStatus");
CREATE INDEX "IndustrialCapability_createdAt_idx" ON "IndustrialCapability"("createdAt");
CREATE INDEX "IndustrialCapability_updatedAt_idx" ON "IndustrialCapability"("updatedAt");

CREATE INDEX "IndustrialServiceOpportunity_companyId_idx" ON "IndustrialServiceOpportunity"("companyId");
CREATE INDEX "IndustrialServiceOpportunity_plantId_idx" ON "IndustrialServiceOpportunity"("plantId");
CREATE INDEX "IndustrialServiceOpportunity_serviceType_idx" ON "IndustrialServiceOpportunity"("serviceType");
CREATE INDEX "IndustrialServiceOpportunity_fitLevel_idx" ON "IndustrialServiceOpportunity"("fitLevel");
CREATE INDEX "IndustrialServiceOpportunity_score_idx" ON "IndustrialServiceOpportunity"("score");
CREATE INDEX "IndustrialServiceOpportunity_status_idx" ON "IndustrialServiceOpportunity"("status");
CREATE INDEX "IndustrialServiceOpportunity_verificationStatus_idx" ON "IndustrialServiceOpportunity"("verificationStatus");
CREATE INDEX "IndustrialServiceOpportunity_ownerAdminId_idx" ON "IndustrialServiceOpportunity"("ownerAdminId");
CREATE INDEX "IndustrialServiceOpportunity_createdAt_idx" ON "IndustrialServiceOpportunity"("createdAt");
CREATE INDEX "IndustrialServiceOpportunity_updatedAt_idx" ON "IndustrialServiceOpportunity"("updatedAt");

CREATE INDEX "IndustrialSource_sourceType_idx" ON "IndustrialSource"("sourceType");
CREATE INDEX "IndustrialSource_sourceDomain_idx" ON "IndustrialSource"("sourceDomain");
CREATE INDEX "IndustrialSource_verificationLevel_idx" ON "IndustrialSource"("verificationLevel");
CREATE INDEX "IndustrialSource_verificationSource_idx" ON "IndustrialSource"("verificationSource");
CREATE INDEX "IndustrialSource_companyId_idx" ON "IndustrialSource"("companyId");
CREATE INDEX "IndustrialSource_plantId_idx" ON "IndustrialSource"("plantId");
CREATE INDEX "IndustrialSource_contactId_idx" ON "IndustrialSource"("contactId");
CREATE INDEX "IndustrialSource_capabilityId_idx" ON "IndustrialSource"("capabilityId");
CREATE INDEX "IndustrialSource_serviceOpportunityId_idx" ON "IndustrialSource"("serviceOpportunityId");
CREATE INDEX "IndustrialSource_importBatchId_idx" ON "IndustrialSource"("importBatchId");
CREATE INDEX "IndustrialSource_capturedAt_idx" ON "IndustrialSource"("capturedAt");

CREATE INDEX "IndustrialActivity_occurredAt_idx" ON "IndustrialActivity"("occurredAt");
CREATE INDEX "IndustrialActivity_actor_idx" ON "IndustrialActivity"("actor");
CREATE INDEX "IndustrialActivity_action_idx" ON "IndustrialActivity"("action");
CREATE INDEX "IndustrialActivity_entity_entityId_idx" ON "IndustrialActivity"("entity", "entityId");
CREATE INDEX "IndustrialActivity_companyId_idx" ON "IndustrialActivity"("companyId");
CREATE INDEX "IndustrialActivity_plantId_idx" ON "IndustrialActivity"("plantId");
CREATE INDEX "IndustrialActivity_contactId_idx" ON "IndustrialActivity"("contactId");
CREATE INDEX "IndustrialActivity_serviceOpportunityId_idx" ON "IndustrialActivity"("serviceOpportunityId");

CREATE INDEX "IndustrialAssignment_assignedTo_idx" ON "IndustrialAssignment"("assignedTo");
CREATE INDEX "IndustrialAssignment_status_idx" ON "IndustrialAssignment"("status");
CREATE INDEX "IndustrialAssignment_purpose_idx" ON "IndustrialAssignment"("purpose");
CREATE INDEX "IndustrialAssignment_companyId_idx" ON "IndustrialAssignment"("companyId");
CREATE INDEX "IndustrialAssignment_plantId_idx" ON "IndustrialAssignment"("plantId");
CREATE INDEX "IndustrialAssignment_contactId_idx" ON "IndustrialAssignment"("contactId");
CREATE INDEX "IndustrialAssignment_serviceOpportunityId_idx" ON "IndustrialAssignment"("serviceOpportunityId");
CREATE INDEX "IndustrialAssignment_dueAt_idx" ON "IndustrialAssignment"("dueAt");

CREATE INDEX "IndustrialImportBatch_status_idx" ON "IndustrialImportBatch"("status");
CREATE INDEX "IndustrialImportBatch_createdBy_idx" ON "IndustrialImportBatch"("createdBy");
CREATE INDEX "IndustrialImportBatch_fileSha256_idx" ON "IndustrialImportBatch"("fileSha256");
CREATE INDEX "IndustrialImportBatch_createdAt_idx" ON "IndustrialImportBatch"("createdAt");
CREATE INDEX "IndustrialImportBatch_updatedAt_idx" ON "IndustrialImportBatch"("updatedAt");

CREATE UNIQUE INDEX "IndustrialImportRow_batchId_rowNumber_key" ON "IndustrialImportRow"("batchId", "rowNumber");
CREATE INDEX "IndustrialImportRow_batchId_idx" ON "IndustrialImportRow"("batchId");
CREATE INDEX "IndustrialImportRow_status_idx" ON "IndustrialImportRow"("status");
CREATE INDEX "IndustrialImportRow_companyId_idx" ON "IndustrialImportRow"("companyId");
CREATE INDEX "IndustrialImportRow_plantId_idx" ON "IndustrialImportRow"("plantId");
CREATE INDEX "IndustrialImportRow_contactId_idx" ON "IndustrialImportRow"("contactId");
CREATE INDEX "IndustrialImportRow_capabilityId_idx" ON "IndustrialImportRow"("capabilityId");
CREATE INDEX "IndustrialImportRow_serviceOpportunityId_idx" ON "IndustrialImportRow"("serviceOpportunityId");

CREATE INDEX "IndustrialDuplicateCandidate_batchId_idx" ON "IndustrialDuplicateCandidate"("batchId");
CREATE INDEX "IndustrialDuplicateCandidate_rowId_idx" ON "IndustrialDuplicateCandidate"("rowId");
CREATE INDEX "IndustrialDuplicateCandidate_candidateType_idx" ON "IndustrialDuplicateCandidate"("candidateType");
CREATE INDEX "IndustrialDuplicateCandidate_existingEntityType_existingEntityId_idx" ON "IndustrialDuplicateCandidate"("existingEntityType", "existingEntityId");
CREATE INDEX "IndustrialDuplicateCandidate_incomingFingerprint_idx" ON "IndustrialDuplicateCandidate"("incomingFingerprint");
CREATE INDEX "IndustrialDuplicateCandidate_matchTier_idx" ON "IndustrialDuplicateCandidate"("matchTier");
CREATE INDEX "IndustrialDuplicateCandidate_status_idx" ON "IndustrialDuplicateCandidate"("status");
CREATE INDEX "IndustrialDuplicateCandidate_resolvedBy_idx" ON "IndustrialDuplicateCandidate"("resolvedBy");

CREATE INDEX "IndustrialDuplicateResolution_candidateId_idx" ON "IndustrialDuplicateResolution"("candidateId");
CREATE INDEX "IndustrialDuplicateResolution_resolvedBy_idx" ON "IndustrialDuplicateResolution"("resolvedBy");
CREATE INDEX "IndustrialDuplicateResolution_action_idx" ON "IndustrialDuplicateResolution"("action");

CREATE UNIQUE INDEX "IndustrialPromotion_promotionKey_key" ON "IndustrialPromotion"("promotionKey");
CREATE INDEX "IndustrialPromotion_promotionType_idx" ON "IndustrialPromotion"("promotionType");
CREATE INDEX "IndustrialPromotion_targetEntity_targetEntityId_idx" ON "IndustrialPromotion"("targetEntity", "targetEntityId");
CREATE INDEX "IndustrialPromotion_status_idx" ON "IndustrialPromotion"("status");
CREATE INDEX "IndustrialPromotion_companyId_idx" ON "IndustrialPromotion"("companyId");
CREATE INDEX "IndustrialPromotion_plantId_idx" ON "IndustrialPromotion"("plantId");
CREATE INDEX "IndustrialPromotion_contactId_idx" ON "IndustrialPromotion"("contactId");
CREATE INDEX "IndustrialPromotion_serviceOpportunityId_idx" ON "IndustrialPromotion"("serviceOpportunityId");
CREATE INDEX "IndustrialPromotion_createdBy_idx" ON "IndustrialPromotion"("createdBy");

CREATE INDEX "IndustrialAuditEvent_createdAt_idx" ON "IndustrialAuditEvent"("createdAt");
CREATE INDEX "IndustrialAuditEvent_actor_idx" ON "IndustrialAuditEvent"("actor");
CREATE INDEX "IndustrialAuditEvent_action_idx" ON "IndustrialAuditEvent"("action");
CREATE INDEX "IndustrialAuditEvent_entity_entityId_idx" ON "IndustrialAuditEvent"("entity", "entityId");
CREATE INDEX "IndustrialAuditEvent_requestId_idx" ON "IndustrialAuditEvent"("requestId");
CREATE INDEX "IndustrialAuditEvent_importBatchId_idx" ON "IndustrialAuditEvent"("importBatchId");
CREATE INDEX "IndustrialAuditEvent_companyId_idx" ON "IndustrialAuditEvent"("companyId");
CREATE INDEX "IndustrialAuditEvent_plantId_idx" ON "IndustrialAuditEvent"("plantId");
CREATE INDEX "IndustrialAuditEvent_contactId_idx" ON "IndustrialAuditEvent"("contactId");
CREATE INDEX "IndustrialAuditEvent_serviceOpportunityId_idx" ON "IndustrialAuditEvent"("serviceOpportunityId");

ALTER TABLE "AdminActorRole" ADD CONSTRAINT "AdminActorRole_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminActor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminActorRole" ADD CONSTRAINT "AdminActorRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminRolePermission" ADD CONSTRAINT "AdminRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminRolePermission" ADD CONSTRAINT "AdminRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "AdminPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IndustrialPlant" ADD CONSTRAINT "IndustrialPlant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "IndustrialCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IndustrialProcess" ADD CONSTRAINT "IndustrialProcess_parentProcessId_fkey" FOREIGN KEY ("parentProcessId") REFERENCES "IndustrialProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialCapability" ADD CONSTRAINT "IndustrialCapability_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "IndustrialCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IndustrialCapability" ADD CONSTRAINT "IndustrialCapability_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "IndustrialPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialCapability" ADD CONSTRAINT "IndustrialCapability_processId_fkey" FOREIGN KEY ("processId") REFERENCES "IndustrialProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialServiceOpportunity" ADD CONSTRAINT "IndustrialServiceOpportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "IndustrialCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IndustrialServiceOpportunity" ADD CONSTRAINT "IndustrialServiceOpportunity_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "IndustrialPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialContact" ADD CONSTRAINT "IndustrialContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "IndustrialCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IndustrialContact" ADD CONSTRAINT "IndustrialContact_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "IndustrialPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IndustrialSource" ADD CONSTRAINT "IndustrialSource_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "IndustrialImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialSource" ADD CONSTRAINT "IndustrialSource_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "IndustrialCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialSource" ADD CONSTRAINT "IndustrialSource_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "IndustrialPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialSource" ADD CONSTRAINT "IndustrialSource_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "IndustrialContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialSource" ADD CONSTRAINT "IndustrialSource_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "IndustrialCapability"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialSource" ADD CONSTRAINT "IndustrialSource_serviceOpportunityId_fkey" FOREIGN KEY ("serviceOpportunityId") REFERENCES "IndustrialServiceOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialContact" ADD CONSTRAINT "IndustrialContact_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "IndustrialSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialCapability" ADD CONSTRAINT "IndustrialCapability_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "IndustrialSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialServiceOpportunity" ADD CONSTRAINT "IndustrialServiceOpportunity_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "IndustrialSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IndustrialActivity" ADD CONSTRAINT "IndustrialActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "IndustrialCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialActivity" ADD CONSTRAINT "IndustrialActivity_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "IndustrialPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialActivity" ADD CONSTRAINT "IndustrialActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "IndustrialContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialActivity" ADD CONSTRAINT "IndustrialActivity_serviceOpportunityId_fkey" FOREIGN KEY ("serviceOpportunityId") REFERENCES "IndustrialServiceOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IndustrialAssignment" ADD CONSTRAINT "IndustrialAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "IndustrialCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialAssignment" ADD CONSTRAINT "IndustrialAssignment_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "IndustrialPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialAssignment" ADD CONSTRAINT "IndustrialAssignment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "IndustrialContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialAssignment" ADD CONSTRAINT "IndustrialAssignment_serviceOpportunityId_fkey" FOREIGN KEY ("serviceOpportunityId") REFERENCES "IndustrialServiceOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IndustrialImportRow" ADD CONSTRAINT "IndustrialImportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "IndustrialImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IndustrialImportRow" ADD CONSTRAINT "IndustrialImportRow_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "IndustrialCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialImportRow" ADD CONSTRAINT "IndustrialImportRow_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "IndustrialPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialImportRow" ADD CONSTRAINT "IndustrialImportRow_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "IndustrialContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialImportRow" ADD CONSTRAINT "IndustrialImportRow_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "IndustrialCapability"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialImportRow" ADD CONSTRAINT "IndustrialImportRow_serviceOpportunityId_fkey" FOREIGN KEY ("serviceOpportunityId") REFERENCES "IndustrialServiceOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IndustrialDuplicateCandidate" ADD CONSTRAINT "IndustrialDuplicateCandidate_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "IndustrialImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialDuplicateCandidate" ADD CONSTRAINT "IndustrialDuplicateCandidate_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "IndustrialImportRow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialDuplicateResolution" ADD CONSTRAINT "IndustrialDuplicateResolution_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "IndustrialDuplicateCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IndustrialPromotion" ADD CONSTRAINT "IndustrialPromotion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "IndustrialCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IndustrialPromotion" ADD CONSTRAINT "IndustrialPromotion_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "IndustrialPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialPromotion" ADD CONSTRAINT "IndustrialPromotion_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "IndustrialContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialPromotion" ADD CONSTRAINT "IndustrialPromotion_serviceOpportunityId_fkey" FOREIGN KEY ("serviceOpportunityId") REFERENCES "IndustrialServiceOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IndustrialAuditEvent" ADD CONSTRAINT "IndustrialAuditEvent_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "IndustrialImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialAuditEvent" ADD CONSTRAINT "IndustrialAuditEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "IndustrialCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialAuditEvent" ADD CONSTRAINT "IndustrialAuditEvent_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "IndustrialPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialAuditEvent" ADD CONSTRAINT "IndustrialAuditEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "IndustrialContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndustrialAuditEvent" ADD CONSTRAINT "IndustrialAuditEvent_serviceOpportunityId_fkey" FOREIGN KEY ("serviceOpportunityId") REFERENCES "IndustrialServiceOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
