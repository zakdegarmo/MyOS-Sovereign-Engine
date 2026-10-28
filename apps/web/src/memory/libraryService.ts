import type { LibraryItem } from '../Thought/components/Tutor/types';
import { BRAIN_LIBRARY_ENTRIES, getBrainLibraryItems } from './brainLibraryData';

const STORAGE_KEY = 'myos_library_v1';

export const saveLibraryItem = (item: Omit<LibraryItem, 'id' | 'timestamp'>): LibraryItem => {
  const newItem: LibraryItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  const existing = getUserLibraryItems();
  const updated = [newItem, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newItem;
};

/** Returns ONLY user-saved items from localStorage */
export const getUserLibraryItems = (): LibraryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load library", e);
    return [];
  }
};

/**
 * Returns user-saved items MERGED with the bundled KI brain library.
 * User items appear first (highest precedence / most recent).
 */
export const getLibraryItems = (): LibraryItem[] => {
  const userItems = getUserLibraryItems();
  // Deduplicate by id — user items win
  const userIds = new Set(userItems.map(i => i.id));
  const brainItems = (BRAIN_LIBRARY_ENTRIES as LibraryItem[]).filter(i => !userIds.has(i.id));
  return [...userItems, ...brainItems];
};

export const searchLibrary = (query: string): LibraryItem[] => {
  const items = getLibraryItems();
  const lowerQ = query.toLowerCase();

  if (!query) return items;

  return items.filter(item =>
    item.title.toLowerCase().includes(lowerQ) ||
    item.content.toLowerCase().includes(lowerQ) ||
    item.tags.some((tag: string) => tag.toLowerCase().includes(lowerQ)) ||
    item.deweyCode.includes(query)
  );
};

export const deleteLibraryItem = (id: string) => {
  const existing = getUserLibraryItems();
  const updated = existing.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

/** Re-export for convenience */
export { getBrainLibraryItems };
