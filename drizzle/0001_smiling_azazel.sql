CREATE TABLE "payment_proofs" (
	"id" serial PRIMARY KEY NOT NULL,
	"consultation_id" integer NOT NULL,
	"filename" varchar(180) NOT NULL,
	"mime_type" varchar(80) NOT NULL,
	"size" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_proofs_consultation_id_unique" UNIQUE("consultation_id")
);
--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_consultation_id_consultation_requests_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultation_requests"("id") ON DELETE cascade ON UPDATE no action;