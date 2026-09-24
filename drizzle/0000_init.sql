CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"practice_id" text NOT NULL,
	"day" integer NOT NULL,
	"provider" integer NOT NULL,
	"start" integer NOT NULL,
	"duration" integer NOT NULL,
	"service" text NOT NULL,
	"patient" text NOT NULL,
	"patient_id" text,
	"booked_by" text NOT NULL,
	"staff_name" text,
	"call_id" text,
	"deposit_failed" boolean DEFAULT false NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"practice_id" text,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calls" (
	"id" text PRIMARY KEY NOT NULL,
	"practice_id" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"time" text NOT NULL,
	"day" text NOT NULL,
	"caller" text NOT NULL,
	"patient_id" text,
	"phone" text NOT NULL,
	"reason" text NOT NULL,
	"outcome" text NOT NULL,
	"duration" text NOT NULL,
	"after_hours" boolean DEFAULT false NOT NULL,
	"direction" text NOT NULL,
	"tag" text,
	"note" text,
	"attention" boolean DEFAULT false NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"summary" text NOT NULL,
	"next" text NOT NULL,
	"facts" jsonb NOT NULL,
	"transcript" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposit_candidates" (
	"practice_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "deposit_candidates_practice_id_patient_id_pk" PRIMARY KEY("practice_id","patient_id")
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" text PRIMARY KEY NOT NULL,
	"practice_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent" text NOT NULL,
	"patient_id" text NOT NULL,
	"for_appointment" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"user_id" text NOT NULL,
	"practice_id" text NOT NULL,
	CONSTRAINT "memberships_user_id_practice_id_pk" PRIMARY KEY("user_id","practice_id")
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" text PRIMARY KEY NOT NULL,
	"practice_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"since" text NOT NULL,
	"last_visit" text NOT NULL,
	"consent" jsonb NOT NULL,
	"preferred" text NOT NULL,
	"opted_out_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practices" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"plan" text DEFAULT 'Growth' NOT NULL,
	"receptionist" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recall_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"practice_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"date" text NOT NULL,
	"channel" text NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recall_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"practice_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"rule_id" text NOT NULL,
	"reason" text NOT NULL,
	"due" text NOT NULL,
	"status" text NOT NULL,
	"channel" text,
	"last_contact" text NOT NULL,
	"next" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recall_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"practice_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"trigger" text NOT NULL,
	"delay" integer NOT NULL,
	"unit" text NOT NULL,
	"steps" jsonb NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"queue" integer DEFAULT 0 NOT NULL,
	"script" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"initials" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role" text NOT NULL,
	"status" text DEFAULT 'Invited' NOT NULL,
	"password_hash" text,
	"pin_hash" text,
	"pin_failures" integer DEFAULT 0 NOT NULL,
	"pin_locked_until" timestamp with time zone,
	"start_page" text,
	"two_step" boolean DEFAULT false NOT NULL,
	"notifications" jsonb,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_candidates" ADD CONSTRAINT "deposit_candidates_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_candidates" ADD CONSTRAINT "deposit_candidates_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_history" ADD CONSTRAINT "recall_history_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_history" ADD CONSTRAINT "recall_history_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_queue" ADD CONSTRAINT "recall_queue_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_queue" ADD CONSTRAINT "recall_queue_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_queue" ADD CONSTRAINT "recall_queue_rule_id_recall_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."recall_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_rules" ADD CONSTRAINT "recall_rules_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_practice_day_idx" ON "appointments" USING btree ("practice_id","day","start");--> statement-breakpoint
CREATE INDEX "audit_log_practice_idx" ON "audit_log" USING btree ("practice_id","at");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calls_practice_time_idx" ON "calls" USING btree ("practice_id","occurred_at");--> statement-breakpoint
CREATE INDEX "deposits_practice_idx" ON "deposits" USING btree ("practice_id","created_at");--> statement-breakpoint
CREATE INDEX "patients_practice_idx" ON "patients" USING btree ("practice_id");--> statement-breakpoint
CREATE INDEX "recall_history_patient_idx" ON "recall_history" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "recall_queue_practice_idx" ON "recall_queue" USING btree ("practice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_idx" ON "users" USING btree (lower("email"));