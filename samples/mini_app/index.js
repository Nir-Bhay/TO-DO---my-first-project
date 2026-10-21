import { scoreDocument } from "./ranker.js";

export async function searchNotes(notes, query) {
  return notes
    .map((n) => ({ ...n, score: scoreDocument(query, n.title + " " + n.body) }))
    .filter((n) => n.score > 0)
    .sort((a, b) => b.score - a.score);
}
