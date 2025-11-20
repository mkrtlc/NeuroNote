import { Note } from "../types";

const API_URL = 'http://localhost:3003/api';

export const loadNotes = async (): Promise<Note[]> => {
  try {
    const response = await fetch(`${API_URL}/notes`);
    if (!response.ok) throw new Error('Failed to load notes');
    const notes = await response.json();
    return notes;
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
};

export const saveNotes = async (notes: Note[]): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notes),
    });
    if (!response.ok) throw new Error('Failed to save notes');
    return true;
  } catch (error) {
    console.error('Error saving notes:', error);
    return false;
  }
};
