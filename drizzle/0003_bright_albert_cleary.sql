ALTER TABLE "establishments" DROP CONSTRAINT "establishments_manager_id_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "establishments" ADD CONSTRAINT "establishments_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
