
import type { LibraryItem } from "../components/Tutor/types";

// Removed static import to prevent bundle bloat
// import scribeData from '../data/full_archive.json';

const STORAGE_KEY = 'myos_library_items';
const MANIFEST_URL = '/data/archive_manifest.json';
const DATA_DIR = '/data/';

// In-memory cache for the static archive (once loaded)
let archiveCache: LibraryItem[] = [];
let isArchivedLoaded = false;

export const loadArchive = async (): Promise<LibraryItem[]> => {
    if (isArchivedLoaded) return archiveCache;

    try {
        console.log("📚 Loading Exocortex Archive...");
        const response = await fetch(MANIFEST_URL);
        if (!response.ok) throw new Error("Manifest not found");

        const manifest = await response.json();
        let allItems: LibraryItem[] = [];

        // Load chunks sequentially (or parallel if prefered)
        // Sequential is safer for memory spike prevention during JSON parsing
        for (const partFile of manifest.parts) {
            const partRes = await fetch(`${DATA_DIR}${partFile}`);
            const partItems = await partRes.json();
            allItems = allItems.concat(partItems);
        }

        console.log(`📚 Exocortex Loaded: ${allItems.length} items.`);
        archiveCache = allItems;
        isArchivedLoaded = true;
        return archiveCache;
    } catch (error) {
        console.error("Failed to load archive:", error);
        return [];
    }
};

export const getLocalItems = (): LibraryItem[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
};

export const getLibraryItems = async (): Promise<LibraryItem[]> => {
    // 1. Ensure archive is loaded
    await loadArchive();

    // 2. Get local overrides/additions
    const localItems = getLocalItems();

    // 3. Merge (Local first, then Archive)
    return [...localItems, ...archiveCache];
};

export const saveLibraryItem = (entry: Omit<LibraryItem, 'id' | 'timestamp'>) => {
    // Only save to LocalStorage (User Memory)
    const localItems = getLocalItems();
    const newItem: LibraryItem = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: Date.now()
    };

    const updated = [newItem, ...localItems];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newItem;
};

export const deleteLibraryItem = (id: string) => {
    // Only delete from LocalStorage
    // We cannot delete from static archive unless we use an exclusion list (not implemented yet)
    const localItems = getLocalItems();
    const updated = localItems.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
};
