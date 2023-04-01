-- CreateEnum
CREATE TYPE "notification_entity_name" AS ENUM ('user', 'room', 'roomMessage', 'roomMember', 'none');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('queued', 'sent', 'delivered', 'viewed', 'read', 'archived');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "entity" "notification_entity_name" NOT NULL DEFAULT 'none',
    "reference_id" UUID,
    "target_user_id" UUID NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "params" JSONB NOT NULL,
    "status" "notification_status" NOT NULL,
    "viewed_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
