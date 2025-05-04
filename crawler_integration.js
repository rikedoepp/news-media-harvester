const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const axios = require('axios');
const cheerio = require('cheerio');
const { RateLimiter } = require('limiter');
const { URL } = require('url');
const { parse } = require('date-fns');

// Initialize Supabase client with service role key
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

// Rate limiter: 2 requests per second
const limiter = new RateLimiter({ tokensPerInterval: 2, interval: 1000 });

// Common selectors for different news sites
const SELECTORS = {
  title: [
    'h1',
    'article h1',
    '.article-title',
    '.headline',
    '.post-title',
    'title'
  ],
  content: [
    'article',
    'main',
    '.article-content',
    '.post-content',
    '.story-content',
    '#content'
  ],
  author: [
    '.author',
    '.byline',
    '.article-author',
    '.post-author',
    '[rel="author"]',
    '.author-name'
  ],
  date: [
    'time[datetime]',
    '.date',
    '.article-date',
    '.post-date',
    '.published-date',
    'meta[property="article:published_time"]'
  ]
};

// Function to extract text using multiple selectors
function extractText($, selectors) {
  for (const selector of selectors) {
    const element = $(selector);
    if (element.length) {
      if (selector.includes('meta')) {
        return element.attr('content') || '';
      }
      return element.text().trim();
    }
  }
  return '';
}

// Function to clean and normalize text
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

// Function to parse date from various formats
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  
  try {
    // Try ISO format first
    if (dateStr.includes('T')) {
      return new Date(dateStr);
    }
    
    // Try common date formats
    const formats = [
      'MMMM d, yyyy',
      'MMM d, yyyy',
      'yyyy-MM-dd',
      'dd/MM/yyyy',
      'MM/dd/yyyy'
    ];
    
    for (const format of formats) {
      try {
        return parse(dateStr, format, new Date());
      } catch (e) {
        continue;
      }
    }
    
    return new Date();
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
}

// Function to extract article data from HTML with retry logic
async function extractArticleData(url, retries = 3) {
  try {
    await limiter.removeTokens(1);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000,
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract article data using multiple selectors
    const title = cleanText(extractText($, SELECTORS.title));
    const content = cleanText(extractText($, SELECTORS.content));
    const author = cleanText(extractText($, SELECTORS.author));
    const dateStr = extractText($, SELECTORS.date);
    const date = parseDate(dateStr);
    
    // Extract meta data
    const description = $('meta[name="description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    
    // Extract image
    const image = $('meta[property="og:image"]').attr('content') || 
                 $('article img').first().attr('src') || '';
    
    return {
      title,
      content,
      author,
      date,
      url,
      description,
      keywords,
      image,
      word_count: content.split(/\s+/).length
    };
  } catch (error) {
    console.error(`Error extracting data from ${url}:`, error.message);
    
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return extractArticleData(url, retries - 1);
    }
    
    return null;
  }
}

// Function to detect country from domain
function detectCountry(domain) {
  const tld = domain.split('.').pop();
  const countryMap = {
    'uk': 'United Kingdom',
    'us': 'United States',
    'ca': 'Canada',
    'au': 'Australia',
    'in': 'India',
    'de': 'Germany',
    'fr': 'France',
    'jp': 'Japan',
    'cn': 'China'
  };
  return countryMap[tld] || 'Unknown';
}

// Function to process and store article data with transaction
async function processArticle(articleData) {
  try {
    const domain = new URL(articleData.url).hostname;
    const country = detectCountry(domain);
    
    // Start a transaction
    const { data: transaction, error: transactionError } = await supabase
      .rpc('begin_transaction');
      
    if (transactionError) throw transactionError;
    
    try {
      // 1. Handle media data
      let mediaData = await supabase
        .from('mediadata')
        .select('*')
        .eq('domain', domain)
        .single();

      if (!mediaData.data) {
        const { data: newMediaData, error: mediaError } = await supabase
          .from('mediadata')
          .insert([
            {
              domain,
              country,
              region: 'Unknown',
              page_rank: '0',
              llm_rank: '0',
              hn_citation: '0',
              signal_score: 0,
              last_updated: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (mediaError) throw mediaError;
        mediaData = { data: newMediaData };
      }

      // 2. Handle reporter
      let reporter = await supabase
        .from('reporters')
        .select('*')
        .eq('tagged_reporter', articleData.author)
        .single();

      if (!reporter.data) {
        const { data: newReporter, error: reporterError } = await supabase
          .from('reporters')
          .insert([
            {
              domain,
              tagged_reporter: articleData.author,
              country,
              relevance_tier: 'Tier 3'
            }
          ])
          .select()
          .single();

        if (reporterError) throw reporterError;
        reporter = { data: newReporter };
      }

      // 3. Store article
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .insert([
          {
            title: articleData.title,
            content: articleData.content,
            url: articleData.url,
            published_at: articleData.date,
            reporter_id: reporter.data.id,
            media_id: mediaData.data.id,
            sentiment_score: 0,
            description: articleData.description,
            keywords: articleData.keywords,
            image_url: articleData.image,
            word_count: articleData.word_count
          }
        ])
        .select()
        .single();

      if (articleError) throw articleError;

      // Commit transaction
      await supabase.rpc('commit_transaction');
      
      console.log(`Successfully processed article: ${articleData.title}`);
      return article;
    } catch (error) {
      // Rollback transaction on error
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  } catch (error) {
    console.error('Error processing article:', error);
    return null;
  }
}

// Main function to run the crawler with concurrency control
async function runCrawler(urls, maxConcurrent = 3) {
  const results = [];
  const queue = [...urls];
  
  while (queue.length > 0) {
    const batch = queue.splice(0, maxConcurrent);
    const promises = batch.map(url => 
      extractArticleData(url)
        .then(articleData => articleData ? processArticle(articleData) : null)
    );
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults.filter(Boolean));
    
    // Add a small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// Example usage
const sampleUrls = [
  'https://example.com/article1',
  'https://example.com/article2'
];

// Uncomment to run the crawler
// runCrawler(sampleUrls);

module.exports = {
  extractArticleData,
  processArticle,
  runCrawler
}; 