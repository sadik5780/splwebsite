-- Add franchise_name column to auction_teams
ALTER TABLE auction_teams
ADD COLUMN IF NOT EXISTS franchise_name TEXT;
