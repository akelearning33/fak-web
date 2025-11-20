-- 1. Create the daily_reports table to track which dates have reports
CREATE TABLE IF NOT EXISTS daily_reports (
    report_date DATE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update fak_items to link to daily_reports
-- Add report_date column
ALTER TABLE fak_items ADD COLUMN IF NOT EXISTS report_date DATE;

-- If you want to backfill existing data to a specific date (e.g., today), uncomment the next line:
-- UPDATE fak_items SET report_date = CURRENT_DATE WHERE report_date IS NULL;

-- Make report_date required (after backfilling)
ALTER TABLE fak_items ALTER COLUMN report_date SET NOT NULL;

-- Update Primary Key to be (sn, report_date)
-- First, drop the old primary key (assuming it was just 'sn')
ALTER TABLE fak_items DROP CONSTRAINT IF EXISTS fak_items_pkey;
-- Add the new composite primary key
ALTER TABLE fak_items ADD PRIMARY KEY (sn, report_date);

-- Add Foreign Key constraint (optional but recommended)
ALTER TABLE fak_items 
    ADD CONSTRAINT fk_fak_report_date 
    FOREIGN KEY (report_date) 
    REFERENCES daily_reports (report_date)
    ON DELETE CASCADE;


-- 3. Update emk_items to link to daily_reports
-- Add report_date column
ALTER TABLE emk_items ADD COLUMN IF NOT EXISTS report_date DATE;

-- Backfill if needed
-- UPDATE emk_items SET report_date = CURRENT_DATE WHERE report_date IS NULL;

-- Update Primary Key
ALTER TABLE emk_items DROP CONSTRAINT IF EXISTS emk_items_pkey;
ALTER TABLE emk_items ADD PRIMARY KEY (sn, report_date);

-- Add Foreign Key constraint
ALTER TABLE emk_items 
    ADD CONSTRAINT fk_emk_report_date 
    FOREIGN KEY (report_date) 
    REFERENCES daily_reports (report_date)
    ON DELETE CASCADE;
