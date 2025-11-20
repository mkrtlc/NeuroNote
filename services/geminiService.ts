import { Note } from "../types";

// AI features are disabled - the app works perfectly without them!
// All linking and graph visualization work locally without any API.

export const suggestConnections = async (
  currentNote: Note,
  allNotes: Note[]
): Promise<string[]> => {
  console.info("AI suggestions are disabled. Use manual linking with [[note title]] syntax.");
  return [];
};

export const summarizeNote = async (content: string): Promise<string> => {
  console.info("AI summarization is disabled.");
  return "AI features are optional - use manual note-taking instead.";
};
