CREATE TABLE "notifications" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_name" varchar(13),
	"event_type" varchar(50),
	"title" varchar(200),
	"body" text,
	"quest_id" bigint,
	"read" boolean DEFAULT false,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "perks" (
	"perk_id" bigserial PRIMARY KEY NOT NULL,
	"partner" varchar(13),
	"title" varchar(100),
	"description" text,
	"icon_url" text,
	"xp_cost" integer,
	"max_redemptions" integer DEFAULT 0,
	"redeemed_count" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_name" varchar(13),
	"quest_id" bigint,
	"current_count" integer,
	"completed" boolean,
	"completed_at" timestamp with time zone,
	"claimed" boolean
);
--> statement-breakpoint
CREATE TABLE "quest_metrics" (
	"quest_id" bigint PRIMARY KEY NOT NULL,
	"total_starts" integer,
	"total_completions" integer,
	"avg_completion_hours" real,
	"completion_rate" real,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"quest_id" bigint PRIMARY KEY NOT NULL,
	"creator" varchar(13),
	"title" varchar(100),
	"description" varchar(500),
	"quest_type" smallint,
	"target_contract" varchar(13),
	"target_action" varchar(13),
	"target_params" jsonb,
	"required_count" integer,
	"xp_reward" integer,
	"nft_template_id" integer DEFAULT -1,
	"nft_collection" varchar(13),
	"skill_tree" varchar(13),
	"prereq_quest_id" bigint DEFAULT 0,
	"season_id" integer DEFAULT 0,
	"kyc_required" boolean,
	"min_account_age_hrs" integer DEFAULT 48,
	"max_completions" integer DEFAULT 0,
	"completed_count" integer DEFAULT 0,
	"status" smallint DEFAULT 0,
	"icon_url" text,
	"banner_url" text,
	"difficulty" varchar(20) DEFAULT 'beginner',
	"tags" text[],
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "redemptions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_name" varchar(13),
	"perk_id" bigint,
	"xp_spent" integer,
	"redeemed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "season_xp" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_name" varchar(13),
	"season_id" integer,
	"xp" bigint,
	"rank" integer
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"season_id" serial PRIMARY KEY NOT NULL,
	"title" varchar(100),
	"description" text,
	"theme" varchar(13),
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"reward_pool" varchar(50),
	"nft_collection" varchar(13),
	"status" smallint
);
--> statement-breakpoint
CREATE TABLE "skill_trees" (
	"skill_tree" varchar(13) PRIMARY KEY NOT NULL,
	"title" varchar(100),
	"description" text,
	"icon_url" text,
	"branch_order" jsonb
);
--> statement-breakpoint
CREATE TABLE "skill_xp" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_name" varchar(13),
	"skill_tree" varchar(13),
	"xp" bigint,
	"tree_level" smallint,
	"quests_completed" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"name" varchar(13) PRIMARY KEY NOT NULL,
	"lifetime_xp" bigint,
	"spendable_xp" bigint,
	"level" smallint,
	"tier" smallint,
	"kyc_verified" boolean,
	"xp_multiplier" smallint DEFAULT 100,
	"titles" text[],
	"joined_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_name","read");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_progress_user_quest" ON "progress" USING btree ("user_name","quest_id");--> statement-breakpoint
CREATE INDEX "idx_progress_user" ON "progress" USING btree ("user_name");--> statement-breakpoint
CREATE INDEX "idx_progress_quest" ON "progress" USING btree ("quest_id");--> statement-breakpoint
CREATE INDEX "idx_quests_status" ON "quests" USING btree ("status","season_id");--> statement-breakpoint
CREATE INDEX "idx_quests_skill" ON "quests" USING btree ("skill_tree","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_season_xp_user_season" ON "season_xp" USING btree ("user_name","season_id");--> statement-breakpoint
CREATE INDEX "idx_season_xp_season" ON "season_xp" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_season_xp_rank" ON "season_xp" USING btree ("season_id","rank");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_skill_xp_user_tree" ON "skill_xp" USING btree ("user_name","skill_tree");