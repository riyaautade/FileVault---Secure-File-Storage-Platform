-- Drop triggers
DROP TRIGGER IF EXISTS update_folder_shares_updated_at ON folder_shares;
DROP TRIGGER IF EXISTS update_file_shares_updated_at ON file_shares;
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS audit_logs_resource_id_idx;
DROP INDEX IF EXISTS audit_logs_user_id_idx;
DROP INDEX IF EXISTS folder_shares_folder_id_idx;
DROP INDEX IF EXISTS folder_shares_user_id_idx;
DROP INDEX IF EXISTS file_shares_file_id_idx;
DROP INDEX IF EXISTS file_shares_user_id_idx;
DROP INDEX IF EXISTS folders_parent_id_idx;
DROP INDEX IF EXISTS folders_owner_id_idx;
DROP INDEX IF EXISTS files_folder_id_idx;
DROP INDEX IF EXISTS files_owner_id_idx;
DROP INDEX IF EXISTS files_content_hash_idx;
DROP INDEX IF EXISTS users_email_idx;

-- Drop tables
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS file_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS folder_shares;
DROP TABLE IF EXISTS file_shares;
DROP TABLE IF EXISTS file_contents;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS folders;
DROP TABLE IF EXISTS users;

-- Drop extensions
DROP EXTENSION IF EXISTS "uuid-ossp";