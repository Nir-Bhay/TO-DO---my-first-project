export function scoreDocument(query, text) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hay = text.toLowerCase();
  return terms.reduce((acc, term) => acc + (hay.includes(term) ? 10 : 0), 0);
}
