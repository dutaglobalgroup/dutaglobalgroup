CREATE TABLE `activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_id` text NOT NULL,
	`email` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_at` text NOT NULL,
	`last_login` text,
	`reviewed_at` text,
	`reviewed_by` text,
	`revision` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX activity_time ON activity(id DESC);
--> statement-breakpoint
CREATE TRIGGER member_requested AFTER INSERT ON members BEGIN
 INSERT INTO activity(actor_id,email,action,target,created_at) VALUES(NEW.id,NEW.email,CASE WHEN NEW.status='approved' THEN 'admin_initialized' ELSE 'access_requested' END,NEW.email,NEW.requested_at);
END;
--> statement-breakpoint
CREATE TRIGGER member_reviewed AFTER UPDATE OF status,email ON members WHEN OLD.status<>NEW.status OR OLD.email<>NEW.email BEGIN
 INSERT INTO activity(actor_id,email,action,target,created_at) VALUES(COALESCE(NEW.reviewed_by,NEW.id),COALESCE((SELECT email FROM members WHERE id=NEW.reviewed_by),NEW.email),CASE WHEN OLD.email<>NEW.email THEN 'email_changed' WHEN NEW.status='approved' THEN 'access_approved' ELSE 'access_blocked' END,NEW.email,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;
--> statement-breakpoint
CREATE TRIGGER project_created AFTER INSERT ON projects WHEN NEW.updated_by<>'csv-import' BEGIN
 INSERT INTO activity(actor_id,email,action,target,created_at) VALUES(NEW.updated_by,COALESCE((SELECT email FROM members WHERE id=NEW.updated_by),'Pengguna lama'),'project_created',json_extract(NEW.data,'$.name'),NEW.updated_at);
END;
--> statement-breakpoint
CREATE TRIGGER project_changed AFTER UPDATE ON projects BEGIN
 INSERT INTO activity(actor_id,email,action,target,created_at) VALUES(NEW.updated_by,COALESCE((SELECT email FROM members WHERE id=NEW.updated_by),'Pengguna lama'),CASE WHEN NEW.deleted_at IS NOT NULL THEN 'project_deleted' ELSE 'project_updated' END,json_extract(NEW.data,'$.name'),NEW.updated_at);
END;
