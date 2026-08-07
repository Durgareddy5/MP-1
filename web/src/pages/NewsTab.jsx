import { useState, useEffect } from "react";

function NewsTab({ symbol }) {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    

    let interval;

    const fetchNews = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/v1/news/${symbol}`);
        const data = await res.json();
        setNewsData(data);
        setLoading(false);
      } catch (err) {
        console.error("News fetch error:", err);
      }
    };

    // initial fetch
    fetchNews();

    // 🔁 auto refresh every 30 sec
    interval = setInterval(fetchNews, 30000);

    return () => clearInterval(interval);

  }, [symbol]);

  return (
    <div className="space-y-3" style={{ maxHeight: "150px", overflowY: "auto" }}>

      {loading ? (
        <p className="text-sm text-gray-400">Loading news...</p>
      ) : newsData.length === 0 ? (
        <p className="text-sm text-gray-400">No news available</p>
      ) : (
        newsData.map((news, i) => (
          <a
            key={i}
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-xl border hover:bg-gray-50 transition"
            style={{ padding: "0.25rem" }}
          >
            <p className="text-sm font-medium mb-1">
              {news.title}
            </p>

            <div className="flex gap-2 text-xs text-gray-500">
              <span>{news.source}</span>
              <span>•</span>
              <span>{news.time}</span>
            </div>
          </a>
        ))
      )}

      {/* optional indicator */}
      <p className="text-xs text-gray-400">
        Auto-updates every 30s
      </p>

    </div>
  );
}

export default NewsTab;