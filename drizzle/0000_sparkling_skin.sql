CREATE TABLE "admin_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer,
	"action" varchar(80) NOT NULL,
	"target" varchar(180),
	"details" varchar(4000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"admin_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(180) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"category_ar" varchar(120),
	"category_fr" varchar(120),
	"title_ar" varchar(220),
	"title_fr" varchar(220),
	"excerpt_ar" text,
	"excerpt_fr" text,
	"body_ar" text,
	"body_fr" text,
	"image" varchar(300) DEFAULT '/images/article-family.jpg' NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cabinet_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(24) NOT NULL,
	"kind" varchar(20) DEFAULT 'contact' NOT NULL,
	"full_name" varchar(140) NOT NULL,
	"email" varchar(180) NOT NULL,
	"phone" varchar(40),
	"subject" varchar(160),
	"message" text NOT NULL,
	"locale" varchar(5) DEFAULT 'ar' NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cabinet_inquiries_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "cms_pages" (
	"key" varchar(40) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"show_in_nav" boolean DEFAULT true NOT NULL,
	"meta_title_ar" varchar(220),
	"meta_title_fr" varchar(220),
	"meta_description_ar" text,
	"meta_description_fr" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultation_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(24) NOT NULL,
	"full_name" varchar(140) NOT NULL,
	"email" varchar(180) NOT NULL,
	"phone" varchar(40) NOT NULL,
	"service" varchar(120) NOT NULL,
	"preferred_date" varchar(40),
	"preferred_time" varchar(10),
	"message" text,
	"locale" varchar(5) DEFAULT 'ar' NOT NULL,
	"payment_method" varchar(40) NOT NULL,
	"amount" integer DEFAULT 90 NOT NULL,
	"payment_reference" varchar(120),
	"payment_proof_note" text,
	"proof_submitted_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"status" varchar(30) DEFAULT 'awaiting_confirmation' NOT NULL,
	"gateway_reference" varchar(80),
	"payment_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consultation_requests_reference_unique" UNIQUE("reference"),
	CONSTRAINT "consultation_requests_gateway_reference_unique" UNIQUE("gateway_reference")
);
--> statement-breakpoint
CREATE TABLE "content_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"locale" varchar(5) NOT NULL,
	"data" text NOT NULL,
	"admin_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(180) NOT NULL,
	"mime_type" varchar(80) NOT NULL,
	"size" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"alt_ar" varchar(240),
	"alt_fr" varchar(240),
	"caption_ar" varchar(300),
	"caption_fr" varchar(300),
	"show_in_gallery" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;