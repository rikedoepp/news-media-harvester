const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Initialize Supabase client with service role key
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function verifyChanges() {
  try {
    // Check articles table
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .limit(1);

    if (articlesError) {
      console.error('Error checking articles table:', articlesError);
    } else {
      console.log('Articles table structure:', articles[0]);
    }

    // Check reporters table
    const { data: reporters, error: reportersError } = await supabase
      .from('reporters')
      .select('*')
      .limit(1);

    if (reportersError) {
      console.error('Error checking reporters table:', reportersError);
    } else {
      console.log('Reporters table structure:', reporters[0]);
    }

    // Check mediadata table
    const { data: mediadata, error: mediadataError } = await supabase
      .from('mediadata')
      .select('*')
      .limit(1);

    if (mediadataError) {
      console.error('Error checking mediadata table:', mediadataError);
    } else {
      console.log('Mediadata table structure:', mediadata[0]);
    }

    // Check article_categories table
    const { data: categories, error: categoriesError } = await supabase
      .from('article_categories')
      .select('*')
      .limit(1);

    if (categoriesError) {
      console.error('Error checking article_categories table:', categoriesError);
    } else {
      console.log('Article_categories table structure:', categories[0] || 'Table exists but is empty');
    }

  } catch (error) {
    console.error('Error in verifyChanges:', error);
  }
}

// Run the verification
verifyChanges(); 