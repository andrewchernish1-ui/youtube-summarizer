-- Create user_usage table for tracking daily limits
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  video_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Create video_summaries table for storing user history
CREATE TABLE IF NOT EXISTS video_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_title TEXT,
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for user_usage
CREATE POLICY "Users can view their own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON user_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for video_summaries
CREATE POLICY "Users can view their own summaries" ON video_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summaries" ON video_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_usage
CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
