import { GrubberResponse, OntologicalAnalysis } from './types';

export class GrubberService {

    /**
     * Crawls a URL to extract links.
     * Maps to the 'fetchLinks' logic from HyperAetherPilgrim.
     */
    static async crawl(url: string): Promise<string[]> {
        try {
            const res = await fetch(`/api/grubber?url=${encodeURIComponent(url)}`);
            if (!res.ok) throw new Error(`Grubber API error: ${res.status}`);
            const data: GrubberResponse = await res.json();
            return data.links;
        } catch (err: any) {
            console.error('[Grubber] Crawl Error:', err);
            throw new Error(err.message || 'Failed to crawl URL');
        }
    }

    /**
     * Analyzes a page for ontological concepts.
     * Maps to the 'onAnalyzeClick' logic from HyperAetherPilgrim.
     */
    static async analyze(targetUrl: string, apiKey: string): Promise<OntologicalAnalysis> {
        if (!targetUrl.startsWith('http')) {
            targetUrl = 'https://' + targetUrl;
        }

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUrl, apiKey }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Analysis failed');
            }

            return await response.json();
        } catch (error: any) {
            console.error('[Grubber] Analysis Error:', error);
            throw error;
        }
    }
}
