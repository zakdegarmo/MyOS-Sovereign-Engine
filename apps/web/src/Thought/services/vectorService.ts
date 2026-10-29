
// Types for Vector Data
export interface VectorNode {
    id: string; // The Glyph or ID
    name?: string; // For Genome Nodes
    rationale?: string; // For Genome Nodes
    title?: string; // For Archive Items
    deweyCode?: string; // For Archive Items
    vector: number[];
    type: 'genome' | 'archive';
}

// simple cosine similarity
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

class VectorService {
    private genomeVectors: VectorNode[] = [];
    private archiveVectors: VectorNode[] = [];
    private isLoaded = false;
    private isLoading = false;

    // Load Vectors from JSON files
    async init() {
        if (this.isLoaded || this.isLoading) return;
        this.isLoading = true;

        try {
            console.log("🧬 Loading Semantic Lattice...");

            // Parallel fetch
            const [genomeRes, archiveRes] = await Promise.all([
                fetch('/data/genome_vectors.json'),
                fetch('/data/archive_vectors.json')
            ]);

            if (genomeRes.ok) {
                const data = await genomeRes.json();
                this.genomeVectors = data.map((d: any) => ({ ...d, type: 'genome' }));
            }

            if (archiveRes.ok) {
                const data = await archiveRes.json();
                this.archiveVectors = data.map((d: any) => ({ ...d, type: 'archive' }));
            }

            console.log(`🧬 Lattice Loaded: ${this.genomeVectors.length} Genome Nodes, ${this.archiveVectors.length} Archive Files.`);
            this.isLoaded = true;
        } catch (error) {
            console.error("Failed to load vectors:", error);
        } finally {
            this.isLoading = false;
        }
    }

    // Find closest Genome Node to a query vector (or text if we had a local embedder, but for now we assume text matching or pre-calculated vectors)
    // Wait, we need an embedder on the frontend to turn "User Query" into a Vector.
    // We can use the Gemini API (via tutorGeminiService) to get an embedding for the query if we want true semantic search.
    // For now, let's assume we pass a vector (or implementation TODO).

    // Actually, to make this work LIVE, `tutorGeminiService` needs to request an embedding for the user's input, 
    // THEN pass it here. 

    findClosestMatches(queryVector: number[], target: 'genome' | 'archive' | 'all' = 'all', limit = 5): VectorNode[] {
        if (!this.isLoaded) return [];

        let candidates: VectorNode[] = [];
        if (target === 'genome' || target === 'all') candidates = candidates.concat(this.genomeVectors);
        if (target === 'archive' || target === 'all') candidates = candidates.concat(this.archiveVectors);

        const scored = candidates.map(node => ({
            node,
            score: cosineSimilarity(queryVector, node.vector)
        }));

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(s => s.node);
    }

    getGenome() { return this.genomeVectors; }
    getArchive() { return this.archiveVectors; }
}

export const vectorService = new VectorService();
