const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

async function exploreDatabase() {
  try {
    // Get all tables using a direct query
    const { data: tables, error: tablesError } = await supabase
      .from('articles')
      .select('*')
      .limit(1);

    if (tablesError) throw tablesError;

    console.log('Sample data from articles table:');
    console.log(tables);

    // Try to get data from other tables we know exist based on CSV files
    const tablesToCheck = [
      'reporters',
      'spokespeople',
      'portcos',
      'mediadata',
      'dropdown_funds',
      'mediatracker'
    ];

    for (const tableName of tablesToCheck) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`\nError accessing ${tableName}:`, error.message);
      } else {
        console.log(`\nSample data from ${tableName} table:`, data);
      }
    }

  } catch (error) {
    console.error('Error exploring database:', error);
  }
}

// Run the exploration
exploreDatabase(); 