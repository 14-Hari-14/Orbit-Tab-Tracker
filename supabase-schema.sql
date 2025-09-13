-- Orbit Knowledge Graph Database Schema
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER TABLE IF EXISTS nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS edges DISABLE ROW LEVEL SECURITY;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS edges;
DROP TABLE IF EXISTS nodes;

-- Create nodes table
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT,
  note TEXT,
  is_root BOOLEAN DEFAULT FALSE,
  is_parent BOOLEAN DEFAULT FALSE,
  shape TEXT DEFAULT 'box',
  value INTEGER DEFAULT 20,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create edges table
CREATE TABLE edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_node UUID REFERENCES nodes(id) ON DELETE CASCADE,
  to_node UUID REFERENCES nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
CREATE POLICY "Users can only see their own nodes" ON nodes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own edges" ON edges
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_nodes_user_id ON nodes(user_id);
CREATE INDEX idx_edges_user_id ON edges(user_id);
CREATE INDEX idx_edges_from_node ON edges(from_node);
CREATE INDEX idx_edges_to_node ON edges(to_node);

-- Enable realtime (optional, for future collaboration features)
ALTER PUBLICATION supabase_realtime ADD TABLE nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE edges;
