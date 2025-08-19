-- Add notes and location columns to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN notes TEXT NULL AFTER is_all_day,
ADD COLUMN location VARCHAR(500) NULL AFTER notes;
