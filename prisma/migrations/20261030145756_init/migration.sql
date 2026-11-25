-- CreateTable
CREATE TABLE "ScanReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT,
    "domain" TEXT,
    "title" TEXT,
    "targetOrg" TEXT,
    "rawText" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "topReasons" TEXT NOT NULL,
    "analyzerResults" TEXT NOT NULL,
    "flags" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CommunityReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "orgName" TEXT,
    "scamType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceNotes" TEXT,
    "reporterEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "KnownBadDomain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reportedCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LegitScholarship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "officialDomain" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "coverage" TEXT NOT NULL,
    "officialUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ScanReport_domain_idx" ON "ScanReport"("domain");

-- CreateIndex
CREATE INDEX "ScanReport_riskScore_idx" ON "ScanReport"("riskScore");

-- CreateIndex
CREATE INDEX "ScanReport_createdAt_idx" ON "ScanReport"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityReport_domain_idx" ON "CommunityReport"("domain");

-- CreateIndex
CREATE INDEX "CommunityReport_status_idx" ON "CommunityReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KnownBadDomain_domain_key" ON "KnownBadDomain"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "LegitScholarship_slug_key" ON "LegitScholarship"("slug");

-- CreateIndex
CREATE INDEX "LegitScholarship_officialDomain_idx" ON "LegitScholarship"("officialDomain");

-- CreateIndex
CREATE INDEX "LegitScholarship_slug_idx" ON "LegitScholarship"("slug");
