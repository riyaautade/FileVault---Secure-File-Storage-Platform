-- Check if tables were created in the filevault1 database
-- Run this in pgAdmin Query Tool

-- 1. Check all tables in public schema
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_catalog = 'filevault1'
ORDER BY table_name;

-- 2. Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_catalog = 'filevault1'
ORDER BY table_name, ordinal_position;

-- 3. Check if uuid extension is enabled
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- 4. Test uuid generation
SELECT uuid_generate_v4();