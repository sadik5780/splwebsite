-- Advanced Auction Features - Database Migrations

-- 1. ADD LOCK COLUMN TO AUCTIONS
ALTER TABLE auctions
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- 2. ADD CURRENT PLAYER TRACKING
ALTER TABLE auction_players
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT FALSE;

-- 3. ADD SOFT REMOVE COLUMN
ALTER TABLE auction_players
ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT FALSE;

-- 4. CREATE INDEX FOR CURRENT PLAYER QUERIES
CREATE INDEX IF NOT EXISTS idx_auction_players_current 
ON auction_players(auction_id, is_current) 
WHERE is_current = TRUE;

-- 5. VERIFY COLUMNS
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'auctions' 
AND column_name IN ('is_locked');

SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'auction_players' 
AND column_name IN ('is_current', 'is_removed');
