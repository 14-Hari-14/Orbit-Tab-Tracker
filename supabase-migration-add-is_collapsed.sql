-- Migration script to add is_collapsed column to existing databases
-- Run this in your Supabase SQL Editor if you already have an existing database

-- Add the is_collapsed column to the nodes table
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS is_collapsed BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_nodes_is_collapsed ON nodes(is_collapsed);

-- Update existing nodes: set is_collapsed to FALSE for all existing nodes
UPDATE nodes SET is_collapsed = FALSE WHERE is_collapsed IS NULL;

-- Verify the change
SELECT label, is_collapsed FROM nodes LIMIT 10;
