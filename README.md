# News Media Harvester

A simple app to paste a news URL, scrape it with Firecrawl, and save the result to Supabase.

## Usage

1. Clone the repository:
   ```
   git clone https://github.com/rikedoepp/news-media-harvester.git
   cd news-media-harvester
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Paste a news article URL
- Scrape the article using Firecrawl
- Save the result to your Supabase database

## Configuration

- Update your Supabase URL and anon key in `src/pages/index.tsx` if you use a different Supabase project.
- Update your Firecrawl API key in `src/pages/index.tsx` if needed.

---

Enjoy!
