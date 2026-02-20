# 🗄️ Supabase Database Setup - Free Tier

## **Create Supabase Account**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub/Google
4. **No credit card required**

## **Create New Project**
1. Click "New Project"
2. **Organization**: Your name
3. **Project Name**: `mrn-football-legends`
4. **Database Password**: Save this securely
5. **Region**: Choose closest to your users
6. Click "Create new project"

## **Free Tier Limits:**
- ✅ **50,000 active users**
- ✅ **500MB database storage**
- ✅ **2GB bandwidth**
- ✅ **Real-time connections**
- ✅ **No time limit**

## **Database Tables to Create:**

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 1000
);

-- Matches table
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES users(id),
  guest_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'waiting', -- waiting, playing, finished
  created_at TIMESTAMP DEFAULT NOW(),
  room_code TEXT UNIQUE NOT NULL
);

-- Game sessions table
CREATE TABLE game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  player_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## **API Keys (Keep Secret):**
1. Go to Settings > API
2. Copy **Project URL** and **Anon Key**
3. Save these for your app

## **Row Level Security (RLS):**
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Users can only update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can read matches
CREATE POLICY "Matches are viewable by everyone" ON matches
  FOR SELECT USING (true);
```
