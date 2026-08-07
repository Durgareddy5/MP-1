import Parser from "rss-parser";

const parser = new Parser();

export const fetchMoneycontrol = async () => {
  const url = "https://www.moneycontrol.com/rss/MCtopnews.xml";

  const feed = await parser.parseURL(url);

  return feed.items.map(item => ({
    title: item.title,
    url: item.link,
    source: "Moneycontrol",
    time: item.pubDate,
    summary: item.contentSnippet || "",
  }));
};