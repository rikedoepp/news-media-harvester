-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or update articles table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create or update reporters table
CREATE TABLE IF NOT EXISTS public.reporters (
    id SERIAL PRIMARY KEY,
    domain TEXT NOT NULL,
    tagged_reporter TEXT NOT NULL,
    country TEXT,
    relevance_tier TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create or update mediadata table
CREATE TABLE IF NOT EXISTS public.mediadata (
    id SERIAL PRIMARY KEY,
    domain TEXT NOT NULL UNIQUE,
    country TEXT,
    region TEXT,
    page_rank TEXT,
    llm_rank TEXT,
    hn_citation TEXT,
    signal_score INTEGER,
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