-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create transaction functions
CREATE OR REPLACE FUNCTION public.begin_transaction()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Start a transaction
  BEGIN;
END;
$$;

CREATE OR REPLACE FUNCTION public.commit_transaction()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Commit the transaction
  COMMIT;
END;
$$;

CREATE OR REPLACE FUNCTION public.rollback_transaction()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Rollback the transaction
  ROLLBACK;
END;
$$;

-- Create articles table with RLS
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    published_at TIMESTAMP WITH TIME ZONE,
    reporter_id INTEGER,
    media_id INTEGER,
    sentiment_score FLOAT,
    description TEXT,
    keywords TEXT,
    image_url TEXT,
    word_count INTEGER,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reporters table with RLS
CREATE TABLE IF NOT EXISTS public.reporters (
    id SERIAL PRIMARY KEY,
    domain TEXT NOT NULL,
    tagged_reporter TEXT NOT NULL,
    country TEXT,
    relevance_tier TEXT,
    email TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mediadata table with RLS
CREATE TABLE IF NOT EXISTS public.mediadata (
    id SERIAL PRIMARY KEY,
    domain TEXT NOT NULL UNIQUE,
    country TEXT,
    region TEXT,
    page_rank TEXT,
    llm_rank TEXT,
    hn_citation TEXT,
    signal_score INTEGER,
    user_id UUID REFERENCES auth.users(id),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE public.articles
    ADD CONSTRAINT fk_articles_reporter
    FOREIGN KEY (reporter_id)
    REFERENCES public.reporters(id)
    ON DELETE SET NULL;

ALTER TABLE public.articles
    ADD CONSTRAINT fk_articles_media
    FOREIGN KEY (media_id)
    REFERENCES public.mediadata(id)
    ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_url ON public.articles(url);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at);
CREATE INDEX IF NOT EXISTS idx_reporters_domain ON public.reporters(domain);
CREATE INDEX IF NOT EXISTS idx_reporters_tagged_reporter ON public.reporters(tagged_reporter);
CREATE INDEX IF NOT EXISTS idx_mediadata_domain ON public.mediadata(domain);

-- Enable Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mediadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for articles
CREATE POLICY "Users can view their own articles"
    ON public.articles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own articles"
    ON public.articles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles"
    ON public.articles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles"
    ON public.articles FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for reporters
CREATE POLICY "Users can view their own reporters"
    ON public.reporters FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reporters"
    ON public.reporters FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reporters"
    ON public.reporters FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reporters"
    ON public.reporters FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for mediadata
CREATE POLICY "Users can view their own mediadata"
    ON public.mediadata FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mediadata"
    ON public.mediadata FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mediadata"
    ON public.mediadata FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mediadata"
    ON public.mediadata FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reporters_updated_at
    BEFORE UPDATE ON public.reporters
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mediadata_updated_at
    BEFORE UPDATE ON public.mediadata
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.articles TO authenticated;
GRANT ALL ON public.reporters TO authenticated;
GRANT ALL ON public.mediadata TO authenticated;
GRANT USAGE ON SEQUENCE public.reporters_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.mediadata_id_seq TO authenticated; 