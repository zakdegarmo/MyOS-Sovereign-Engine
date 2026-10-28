import { useState, useEffect } from 'react';

/**
 * Shared hook to load the LPC asset manifest.
 * Used by SpriteLab, SemanticAvatar, and other ontological components.
 */
export function useLpcManifest() {
    const [manifest, setManifest] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const fetchManifest = async () => {
            try {
                const response = await fetch('/textures/avatars/lpc/mephit_manifest.json');
                const data = await response.json();
                
                // If it's the structured manifest from SpriteLab, we flatten/normalize it
                if (data.sprites) {
                    setManifest(data.sprites);
                } else {
                    setManifest(data);
                }
            } catch (e) {
                console.error("Failed to load LPC manifest:", e);
            }
        };

        fetchManifest();
    }, []);

    return manifest;
}
