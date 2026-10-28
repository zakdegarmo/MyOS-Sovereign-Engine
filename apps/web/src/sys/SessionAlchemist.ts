import { AlchemyEncoder } from './AlchemyEncoder';

/**
 * SessionAlchemist.ts
 * 
 * Manifests the 'Light Body' of the current session by distilling 
 * its UUID into a 2-glyph Semantic Address.
 */

export class SessionAlchemist {
    /**
     * Reveals the 'True Name' of a session.
     */
    static getSessionGlyphs(uuid: string): string {
        return AlchemyEncoder.distill(uuid);
    }

    /**
     * Generates the 'Ontological Map' for the session's brain folder.
     */
    static getSessionMap(uuid: string) {
        const glyphs = this.getSessionGlyphs(uuid);
        return {
            existentialID: uuid,
            semanticGlyphs: glyphs,
            ucdaPath: `brain/${glyphs}.ucda`,
            lastPurityCheck: 1.0, // Initial purity for a newly minted alchemist
        };
    }
}
