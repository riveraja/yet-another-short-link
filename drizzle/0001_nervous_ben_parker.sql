CREATE TABLE IF NOT EXISTS "urls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"long_url" text NOT NULL,
	"short_url" text NOT NULL,
	-- "created_at" timestamp DEFAULT now(),
	-- "expires_on" timestamp NOT NULL,
	"created_by" text NOT NULL
);
