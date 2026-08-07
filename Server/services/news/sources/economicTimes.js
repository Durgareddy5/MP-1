import Parser from "rss-parser";

const parser = new Parser();

export const fetchEconomicTimes = async () => {
  const url = "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms";

  const feed = await parser.parseURL(url);

  return feed.items.map(item => ({
    title: item.title,
    url: item.link,
    source: "Economic Times",
    time: item.pubDate,
    summary: item.contentSnippet || "",
  }));
};