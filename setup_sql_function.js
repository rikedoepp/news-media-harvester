const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Initialize Supabase client with service role key
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function setupSqlFunction() {
  try {
    // Create the exec_sql function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;

    // Execute the SQL to create the function
    const { data, error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });

    if (error) {
      console.error('Error creating exec_sql function:', error);
    } else {
      console.log('exec_sql function created successfully');
      
      // Now try to modify the database
      const modifySQL = `
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

      const { data: modifyData, error: modifyError } = await supabase.rpc('exec_sql', { sql: modifySQL });

      if (modifyError) {
        console.error('Error modifying database:', modifyError);
      } else {
        console.log('Database modifications completed successfully');
      }
    }
  } catch (error) {
    console.error('Error in setupSqlFunction:', error);
  }
}

// Run the setup
setupSqlFunction(); 