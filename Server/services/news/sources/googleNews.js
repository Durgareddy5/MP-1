import Parser from "rss-parser";
import { QUERY_MAP } from "../utils/queryMap.js";

const parser = new Parser();

export const fetchGoogleNews = async (symbol) => {
  const query = QUERY_MAP[symbol] || `${symbol} India stock`;

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}`;

  const feed = await parser.parseURL(url);

  return feed.items.map(item => ({
    title: item.title,
    url: item.link,
    source: item.source?.title || "Google News",
    time: item.pubDate,
    summary: item.contentSnippet || "",
  }));
};