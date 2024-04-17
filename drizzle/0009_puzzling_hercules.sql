ALTER TABLE "users" ADD COLUMN "active_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT false;