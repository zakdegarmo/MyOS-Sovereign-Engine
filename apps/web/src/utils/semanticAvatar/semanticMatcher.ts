import lpcRegistryData from '../../assets/lpc/lpc_registry.json';

interface RegistryEntry {
    path: string;
    width: number;
    height: number;
    type: 'sheet' | 'singular';
    bias: 'top' | 'mid' | 'bottom';
    category: string;
    tags: string[];
}

interface Registry {
    sheets: RegistryEntry[];
    singular: RegistryEntry[];
}

const lpcRegistry = lpcRegistryData as unknown as Registry;

export interface GenomeObject {
    body?: string;
    hair?: string;
    tops?: string;
    bottoms?: string;
    facial?: string;
    headwear?: string;
    footwear?: string;
    [key: string]: string | undefined;
}

/**
 * Normalizes input tags for looser matching
 */
const normalize = (tag: string) => tag.toLowerCase().trim();

/**
 * Bias Rules: Enforce physical location check to avoid "belts in shoe slots"
 */
function isValidBias(category: string, bias: string): boolean {
    switch (category) {
        case 'footwear': return bias === 'bottom';
        case 'headwear':
        case 'hair': return bias === 'top';
        case 'tops': return bias === 'mid';
        case 'bottoms': return bias === 'bottom' || bias === 'mid';
        default: return true;
    }
}

/**
 * Scores a set of target tags against an asset's ontology tags.
 */
function getMatchScore(targetTags: string[], assetTags: string[]): number {
    let score = 0;
    const lowerAssetTags = assetTags.map(normalize);

    for (const target of targetTags) {
        const normalizedTarget = normalize(target);
        if (lowerAssetTags.includes(normalizedTarget)) {
            score += 1.0;
        } else {
            const partialMatch = lowerAssetTags.some(at => at.includes(normalizedTarget) || normalizedTarget.includes(at));
            if (partialMatch) {
                score += 0.5;
            }
        }
    }
    return score;
}

/**
 * Deterministic algorithm to select the best LPC asset for each layer
 */
export function buildConceptualSkin(characterTags: string[]): GenomeObject {
    const genome: GenomeObject = {};
    const categories: GenomeLayer[] = ['body', 'hair', 'tops', 'bottoms', 'footwear', 'headwear', 'facial'];

    const allAssets = [...lpcRegistry.sheets, ...lpcRegistry.singular];

    categories.forEach(category => {
        let bestAsset = null;
        let highestScore = -1;

        // Optimized pass through all assets
        allAssets.forEach(asset => {
            // 1. Strict Category Match (from filename/parent folder tagging)
            if (asset.category !== category && category !== 'body') return;

            // 2. Strict Bias Validation (Ghost-busting the "belts in shoes" problem)
            if (!isValidBias(category, asset.bias)) return;

            // 3. Body Hotfix
            if (category === 'body' && !asset.path.includes('body/')) return;

            const score = getMatchScore(characterTags, asset.tags);
            if (score > highestScore) {
                highestScore = score;
                bestAsset = asset.path;
            }
        });

        if (bestAsset && highestScore >= 0.5) {
            genome[category] = bestAsset;
        } else {
            // Defaults
            if (category === 'body') {
                genome[category] = "body/human/male/light.png"; // Example legacy fallback
            } else {
                genome[category] = "none";
            }
        }
    });

    return genome;
}

type GenomeLayer = 'body' | 'hair' | 'tops' | 'bottoms' | 'footwear' | 'headwear' | 'facial';
