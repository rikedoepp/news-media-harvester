-- Example SQL commands to modify the mediatracker database
-- You can add, modify, or delete columns from tables here

-- Add a new column to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT;

-- Add a new column to reporters table
ALTER TABLE reporters
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add a new column to mediadata table
ALTER TABLE mediadata
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create a new table for article categories
CREATE TABLE IF NOT EXISTS article_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES article_categories(id);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_mediadata_domain ON mediadata(domain); 