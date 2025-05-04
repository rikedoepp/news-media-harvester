const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function setupDatabase() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'setup_database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split the SQL into individual statements
    const statements = sql.split(';').filter(statement => statement.trim());

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 100) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error('Error executing statement:', error);
        } else {
          console.log('Statement executed successfully');
        }
      }
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Run the setup
setupDatabase(); 