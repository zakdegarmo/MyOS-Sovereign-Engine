import { LevelDefinition } from './CampaignTypes';
import { Level1_Junkyard } from './levels/Level1';
import { Level2_Reunion } from './levels/Level2';
import { Level3_CycNetAmbush } from './levels/Level3';
import { Level4_OutlawCanyon } from './levels/Level4';

export const CAMPAIGN_LEVELS: LevelDefinition[] = [
    Level1_Junkyard,
    Level2_Reunion,
    Level3_CycNetAmbush,
    Level4_OutlawCanyon
];

export function getNextCampaignLevel(currentId: string): LevelDefinition | null {
    const idx = CAMPAIGN_LEVELS.findIndex(lvl => lvl.id === currentId);
    if (idx >= 0 && idx + 1 < CAMPAIGN_LEVELS.length) {
        return CAMPAIGN_LEVELS[idx + 1];
    }
    return null;
}
