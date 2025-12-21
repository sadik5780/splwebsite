# Auction Management System - Database Setup

## SQL Migrations

Run these SQL commands in Supabase SQL Editor in order:

### Step 1: Create `auctions` Table

```sql
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_name TEXT NOT NULL,
  auction_season TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  welcome_text TEXT DEFAULT 'Welcome to SPL Season 6 Auction Hall',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure only one active auction at a time
CREATE UNIQUE INDEX idx_active_auction ON auctions(is_active) WHERE is_active = TRUE;
```

### Step 2: Create `auction_players` Table

```sql
CREATE TABLE auction_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  age_group TEXT NOT NULL CHECK (age_group IN ('Under 16', 'Under 19', 'Open')),
  position_number INTEGER NOT NULL,
  is_reserved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(auction_id, player_id),
  UNIQUE(auction_id, age_group, position_number)
);

-- Indexes
CREATE INDEX idx_auction_players_auction ON auction_players(auction_id);
CREATE INDEX idx_auction_players_ordering ON auction_players(auction_id, age_group, position_number);
```

### Step 3: Enable RLS with Open Policies

```sql
-- Enable RLS
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_players ENABLE ROW LEVEL SECURITY;

-- Open policies (no auth required)
CREATE POLICY "Enable all for everyone" ON auctions FOR ALL USING (true);
CREATE POLICY "Enable all for everyone" ON auction_players FOR ALL USING (true);
```

### Verification

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('auctions', 'auction_players');

-- Check constraints
SELECT constraint_name, table_name FROM information_schema.table_constraints WHERE table_name IN ('auctions', 'auction_players');
```

Done! The database is now ready for the auction management system.
