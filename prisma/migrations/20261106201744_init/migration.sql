-- CreateEnum
CREATE TYPE "FetchStatus" AS ENUM ('OK', 'FAILED', 'UNCONFIGURED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ObservationType" AS ENUM ('OBSERVED', 'DERIVED', 'REPORTED', 'ASSUMED');

-- CreateEnum
CREATE TYPE "SnapshotMode" AS ENUM ('LIVE', 'SYNTHETIC');

-- CreateEnum
CREATE TYPE "DebateStatus" AS ENUM ('PENDING', 'FETCHING', 'VALIDATING', 'MODELING', 'BULL_OPEN', 'BEAR_OPEN', 'BULL_REBUTTAL', 'BEAR_REBUTTAL', 'BULL_CLOSE', 'BEAR_CLOSE', 'JUDGING', 'COMPLETE', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "Actor" AS ENUM ('bull', 'bear', 'judge');

-- CreateEnum
CREATE TYPE "AudioStatus" AS ENUM ('NONE', 'PENDING', 'READY', 'FAILED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "Topic" (
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "shortLabel" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "bullHypothesis" TEXT NOT NULL,
    "bearHypothesis" TEXT NOT NULL,
    "evidenceRequirements" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "requiresCredential" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataFetchAttempt" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "FetchStatus" NOT NULL,
    "httpStatus" INTEGER,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,
    "error" TEXT,
    "responseSha256" TEXT,
    "bytes" INTEGER,
    "snapshotId" TEXT,

    CONSTRAINT "DataFetchAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawResponse" (
    "sha256" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawResponse_pkey" PRIMARY KEY ("sha256")
);

-- CreateTable
CREATE TABLE "EvidenceSnapshot" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "topicSlug" TEXT NOT NULL,
    "mode" "SnapshotMode" NOT NULL DEFAULT 'LIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cutoffAt" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3),
    "methodologyVersion" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "sourceStatus" JSONB NOT NULL,

    CONSTRAINT "EvidenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "valueText" TEXT,
    "unit" TEXT NOT NULL,
    "observationType" "ObservationType" NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "methodology" TEXT NOT NULL,
    "transform" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "rawResponseHash" TEXT,
    "validationNotes" TEXT,
    "series" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioResult" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "formulaVersion" TEXT NOT NULL,
    "scenarioKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "outputs" JSONB NOT NULL,

    CONSTRAINT "ScenarioResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebateSession" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "topicSlug" TEXT NOT NULL,
    "snapshotId" TEXT,
    "parentId" TEXT,
    "status" "DebateStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "failedAtStatus" "DebateStatus",
    "aiProvider" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "voiceProvider" TEXT NOT NULL,
    "synthetic" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "idempotencyKey" TEXT,
    "clientKeyHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebateSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebateTurn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "phase" "DebateStatus" NOT NULL,
    "actor" "Actor" NOT NULL,
    "speechText" TEXT NOT NULL,
    "beats" JSONB NOT NULL,
    "claims" JSONB NOT NULL,
    "chartCue" JSONB,
    "modelInputRefs" JSONB NOT NULL,
    "audit" JSONB NOT NULL,
    "textHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "audioStatus" "AudioStatus" NOT NULL DEFAULT 'NONE',
    "audioError" TEXT,
    "audioAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebateTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioAsset" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "role" "Actor" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "durationSec" DOUBLE PRECISION NOT NULL,
    "alignment" JSONB NOT NULL,
    "alignmentKind" TEXT NOT NULL,
    "transcriptHash" TEXT NOT NULL,
    "storageDriver" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "data" BYTEA,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudioAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudgeVerdict" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "winner" TEXT NOT NULL,
    "llmWinner" TEXT NOT NULL,
    "overrideReason" TEXT,
    "scores" JSONB NOT NULL,
    "rawScores" JSONB NOT NULL,
    "penalties" JSONB NOT NULL,
    "decisiveEvidenceIds" JSONB NOT NULL,
    "unsupportedClaims" JSONB NOT NULL,
    "verdictRationale" TEXT NOT NULL,
    "inputChallenges" JSONB NOT NULL,
    "whatWouldChangeMyMind" JSONB NOT NULL,
    "confidenceLabel" TEXT NOT NULL,
    "speechText" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JudgeVerdict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplayEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "ReplayEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobEvent" (
    "id" BIGSERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedBy" TEXT,
    "lockedUntil" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "provider" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "characters" INTEGER NOT NULL DEFAULT 0,
    "estimatedUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "WorkerHeartbeat" (
    "workerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL,

    CONSTRAINT "WorkerHeartbeat_pkey" PRIMARY KEY ("workerId")
);

-- CreateIndex
CREATE INDEX "DataFetchAttempt_requestKey_startedAt_idx" ON "DataFetchAttempt"("requestKey", "startedAt");

-- CreateIndex
CREATE INDEX "DataFetchAttempt_snapshotId_idx" ON "DataFetchAttempt"("snapshotId");

-- CreateIndex
CREATE INDEX "RawResponse_requestKey_fetchedAt_idx" ON "RawResponse"("requestKey", "fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceSnapshot_publicId_key" ON "EvidenceSnapshot"("publicId");

-- CreateIndex
CREATE INDEX "EvidenceSnapshot_topicSlug_createdAt_idx" ON "EvidenceSnapshot"("topicSlug", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceItem_snapshotId_evidenceId_key" ON "EvidenceItem"("snapshotId", "evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioResult_snapshotId_scenarioKey_key" ON "ScenarioResult"("snapshotId", "scenarioKey");

-- CreateIndex
CREATE UNIQUE INDEX "DebateSession_publicId_key" ON "DebateSession"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "DebateSession_idempotencyKey_key" ON "DebateSession"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DebateSession_status_idx" ON "DebateSession"("status");

-- CreateIndex
CREATE INDEX "DebateSession_topicSlug_createdAt_idx" ON "DebateSession"("topicSlug", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DebateTurn_sessionId_phase_key" ON "DebateTurn"("sessionId", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "DebateTurn_sessionId_seq_key" ON "DebateTurn"("sessionId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "AudioAsset_cacheKey_key" ON "AudioAsset"("cacheKey");

-- CreateIndex
CREATE UNIQUE INDEX "JudgeVerdict_sessionId_key" ON "JudgeVerdict"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReplayEvent_sessionId_seq_key" ON "ReplayEvent"("sessionId", "seq");

-- CreateIndex
CREATE INDEX "JobEvent_sessionId_id_idx" ON "JobEvent"("sessionId", "id");

-- CreateIndex
CREATE INDEX "Job_status_runAfter_idx" ON "Job"("status", "runAfter");

-- CreateIndex
CREATE UNIQUE INDEX "Job_kind_refId_key" ON "Job"("kind", "refId");

-- CreateIndex
CREATE INDEX "UsageRecord_createdAt_idx" ON "UsageRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "DataFetchAttempt" ADD CONSTRAINT "DataFetchAttempt_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "EvidenceSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioResult" ADD CONSTRAINT "ScenarioResult_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "EvidenceSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateSession" ADD CONSTRAINT "DebateSession_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "EvidenceSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateSession" ADD CONSTRAINT "DebateSession_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DebateSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateTurn" ADD CONSTRAINT "DebateTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DebateSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateTurn" ADD CONSTRAINT "DebateTurn_audioAssetId_fkey" FOREIGN KEY ("audioAssetId") REFERENCES "AudioAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeVerdict" ADD CONSTRAINT "JudgeVerdict_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DebateSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplayEvent" ADD CONSTRAINT "ReplayEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DebateSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEvent" ADD CONSTRAINT "JobEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DebateSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DebateSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
