ALTER TABLE `auth_sessions` ADD `user_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `member_revision` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DELETE FROM auth_sessions WHERE user_id='';
--> statement-breakpoint
CREATE TRIGGER revoke_member_sessions AFTER UPDATE OF status,email ON members WHEN NEW.status<>'approved' OR OLD.email<>NEW.email BEGIN
 DELETE FROM auth_sessions WHERE user_id=NEW.id;
END;
