# News Media Harvester

A secure web application for scraping and tracking media content, built with Supabase and Firecrawl.

## Features

- 🔐 Secure authentication with Supabase
- 📰 Content scraping with Firecrawl
- 💾 Secure data storage with Row Level Security (RLS)
- 📊 Media content tracking and management
- 🔍 Reporter and media data organization

## Setup

1. Clone the repository:
```bash
git clone https://github.com/rikedoepp/news-media-harvester.git
cd news-media-harvester
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project in Supabase
   - Run the SQL script in `setup_database.sql` in the Supabase SQL Editor
   - Get your Supabase URL and anon key from the project settings

4. Configure environment variables:
   - Create a `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   ```

5. Start the development server:
```bash
npm run dev
```

## Database Structure

The application uses the following tables:

- `articles`: Stores scraped content with metadata
- `reporters`: Tracks reporter information
- `mediadata`: Stores media outlet information

All tables are protected with Row Level Security (RLS) to ensure data privacy.

## Security Features

- Row Level Security (RLS) policies for all tables
- User-specific data access
- Secure authentication
- Protected API endpoints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [Firecrawl](https://firecrawl.dev) for the content scraping API
