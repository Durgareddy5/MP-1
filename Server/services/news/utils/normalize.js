export const normalize = (news) => {
  return news.map(n => ({
    title: n.title,
    source: n.source,
    time: formatTime(n.time),
    url: n.url,
    summary: n.summary,
  }));
};

const formatTime = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const hrs = Math.floor(diff / (1000 * 60 * 60));

  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;

  return `${Math.floor(hrs / 24)}d ago`;
};