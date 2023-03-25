-- CreateIndex
CREATE INDEX "verification_tokens_expires_revoked_idx" ON "verification_tokens"("expires" DESC, "revoked" DESC);
