DROP TRIGGER member_reviewed;
--> statement-breakpoint
INSERT INTO activity(actor_id,email,action,target,created_at) SELECT 'system','Sistem','access_auto_enabled',email,strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM members WHERE status='pending';
--> statement-breakpoint
UPDATE members SET status='approved',revision=revision+1 WHERE status='pending';
--> statement-breakpoint
CREATE TRIGGER member_reviewed AFTER UPDATE OF status,email ON members WHEN OLD.status<>NEW.status OR OLD.email<>NEW.email BEGIN
 INSERT INTO activity(actor_id,email,action,target,created_at) VALUES(COALESCE(NEW.reviewed_by,NEW.id),COALESCE((SELECT email FROM members WHERE id=NEW.reviewed_by),NEW.email),CASE WHEN OLD.email<>NEW.email THEN 'email_changed' WHEN NEW.status='approved' THEN 'access_approved' ELSE 'access_blocked' END,NEW.email,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;
--> statement-breakpoint
DROP TRIGGER member_requested;
--> statement-breakpoint
CREATE TRIGGER member_requested AFTER INSERT ON members BEGIN
 INSERT INTO activity(actor_id,email,action,target,created_at) VALUES(NEW.id,NEW.email,CASE WHEN NEW.email='zakikhaliq31@gmail.com' THEN 'admin_initialized' ELSE 'account_verified' END,NEW.email,NEW.requested_at);
END;
