-- Add index for location searches
CREATE INDEX idx_location ON calendar_events(location);
