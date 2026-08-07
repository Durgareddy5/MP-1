export const dedupe = (news) => {
  const seen = new Set();

  return news.filter(item => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};