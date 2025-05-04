import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabaseUrl = "https://torosdzdrwpnpyyzlslx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcm9zZHpkcndwbnB5eXpsc2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3OTU2NDEsImV4cCI6MjA2MDM3MTY0MX0.sqUleF89MAKAYn_CCRFEWjm3iesNrxD3p8zU_PySyHo";
const firecrawlApiKey = "fc-262aba9b9ddd4266bc9168d162677792";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const scrapeAndSave = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Scrape with Firecrawl
      const response = await axios.post(
        "https://api.firecrawl.dev/scrape",
        { url },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firecrawlApiKey}`,
          },
        }
      );
      setResult(response.data);

      // Save to Supabase
      const { error: supabaseError } = await supabase.from("articles").insert({
        title: response.data.title,
        content: response.data.content,
        url: url,
        published_at: response.data.published_date,
        author: response.data.author || response.data.reporter || null,
      });
      if (supabaseError) setError(supabaseError.message);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 16 }}>
        News Media Harvester
      </h1>
      <input
        style={{ width: "70%", padding: 8, marginRight: 8 }}
        type="url"
        placeholder="Paste a news article URL"
        value={url}
        onChange={e => setUrl(e.target.value)}
      />
      <button
        style={{
          background: "#2563eb",
          color: "white",
          padding: "8px 16px",
          border: "none",
          borderRadius: 4,
        }}
        onClick={scrapeAndSave}
        disabled={loading}
      >
        {loading ? "Scraping..." : "Scrape & Save"}
      </button>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 16, background: "#f3f4f6", padding: 16, borderRadius: 8 }}>
          <h2 style={{ fontWeight: "bold" }}>{result.title}</h2>
          <p>{result.content?.slice(0, 300)}...</p>
          <div style={{ fontSize: 14, color: "#555" }}>
            <div>Author: {result.author || result.reporter || "N/A"}</div>
            <div>Published: {result.published_date || "N/A"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
