const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Initialize Supabase client with service role key
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function modifyDatabase() {
  try {
    // Execute SQL commands to modify the database
    const sqlCommands = `
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
    `;

    // Execute the SQL commands
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlCommands });

    if (error) {
      console.error('Error modifying database:', error);
    } else {
      console.log('Database modifications completed successfully');
      
      // Verify the changes
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .limit(1);

      if (articlesError) {
        console.error('Error verifying articles table:', articlesError);
      } else {
        console.log('Sample article data after modifications:', articles);
      }
    }
  } catch (error) {
    console.error('Error in modifyDatabase:', error);
  }
}

// Run the modifications
modifyDatabase(); 