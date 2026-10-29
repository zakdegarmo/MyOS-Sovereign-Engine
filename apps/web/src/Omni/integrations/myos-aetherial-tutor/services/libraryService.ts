import type { LibraryItem } from '@Omni/types';

const STORAGE_KEY = 'myos_library_v1';

export const saveLibraryItem = (item: Omit<LibraryItem, 'id' | 'timestamp'>): LibraryItem => {
  const newItem: LibraryItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  const existing = getLibraryItems();
  const updated = [newItem, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newItem;
};

export const getLibraryItems = (): LibraryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load library", e);
    return [];
  }
};

export const searchLibrary = (query: string): LibraryItem[] => {
  const items = getLibraryItems();
  const lowerQ = query.toLowerCase();

  if (!query) return items;

  return items.filter(item =>
    item.title.toLowerCase().includes(lowerQ) ||
    item.content.toLowerCase().includes(lowerQ) ||
    item.tags.some(tag => tag.toLowerCase().includes(lowerQ)) ||
    item.deweyCode.includes(query)
  );
};

export const deleteLibraryItem = (id: string) => {
  const existing = getLibraryItems();
  const updated = existing.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
