/**
 * EpochTimelineEngine.ts
 * 
 * Living Historical Epoch Engine for Toril (The Forgotten Realms).
 * Manages temporal timeline states, environmental physics parameters,
 * and knowledge base vector serialization.
 */

export type TemporalEpoch = 
  | 'DAYS_OF_THUNDER'   // -35,000 DR (Primordial Elemental Terrain & Weather)
  | 'FIRST_FLOWERINGS'  // -24,000 DR (Elven Mythals & High Magic Particle Fields)
  | 'CROWN_WARS'        // -12,000 DR (Tactical Faction AI & Grid Alignment)
  | 'NETHERIL_ARCANE'   // -3,000 DR  (Floating Floating City Flying Physics & Mana)
  | 'AGE_OF_HUMANITY'   // -339 DR    (WFC Settlement Spawner & NPC Schedules)
  | 'TIME_OF_TROUBLES'  // 1358 DR    (Avatar Wild Magic Surge & Morph Engine)
  | 'ERA_OF_UPHEAVAL';  // 1492+ DR   (Multi-Timeline Nexus Portal & RAG Lattice)

export interface EpochConfig {
  id: TemporalEpoch;
  yearDR: string;
  title: string;
  description: string;
  skyColor: string;
  fogColor: string;
  heightScale: number;
  noiseComplexity: number;
  primaryBiome: string;
  allowedProps: string[];
}

export const EPOCH_REGISTRY: Record<TemporalEpoch, EpochConfig> = {
  DAYS_OF_THUNDER: {
    id: 'DAYS_OF_THUNDER',
    yearDR: '-35,000 DR',
    title: 'Days of Thunder',
    description: 'Primordial elemental storms, jagged volcanic ridges, and ancient stone monoliths.',
    skyColor: '#1e052b',
    fogColor: '#4a154b',
    heightScale: 35.0,
    noiseComplexity: 0.025,
    primaryBiome: 'volcanic_primordial',
    allowedProps: ['stones', 'monoliths', 'lava_vents']
  },
  FIRST_FLOWERINGS: {
    id: 'FIRST_FLOWERINGS',
    yearDR: '-24,000 DR',
    title: 'First Flowerings',
    description: 'Golden age of Elven Mythal magic, dense ancient forests, and glowing leyline flora.',
    skyColor: '#0a2342',
    fogColor: '#1d4e89',
    heightScale: 18.0,
    noiseComplexity: 0.012,
    primaryBiome: 'mythal_forest',
    allowedProps: ['cormanthor_oak', 'stones', 'mythal_runes']
  },
  CROWN_WARS: {
    id: 'CROWN_WARS',
    yearDR: '-12,000 DR',
    title: 'The Crown Wars',
    description: 'Cataclysmic mage-warfare, scorched earth, and fractured tactical grid boundaries.',
    skyColor: '#2b0505',
    fogColor: '#631616',
    heightScale: 28.0,
    noiseComplexity: 0.02,
    primaryBiome: 'scorched_wasteland',
    allowedProps: ['ruins', 'stones', 'barricades']
  },
  NETHERIL_ARCANE: {
    id: 'NETHERIL_ARCANE',
    yearDR: '-3,000 DR',
    title: 'High Netheril',
    description: 'Floating enclave cities, mythallars, and pristine silver-sand plains.',
    skyColor: '#0f172a',
    fogColor: '#38bdf8',
    heightScale: 12.0,
    noiseComplexity: 0.008,
    primaryBiome: 'arcane_plains',
    allowedProps: ['floating_enclave', 'mythallar', 'stones']
  },
  AGE_OF_HUMANITY: {
    id: 'AGE_OF_HUMANITY',
    yearDR: '-339 DR',
    title: 'Age of Humanity',
    description: 'Rise of Shadowdale, Waterdeep, and early settlement trade roads.',
    skyColor: '#0f172a',
    fogColor: '#1e293b',
    heightScale: 15.0,
    noiseComplexity: 0.012,
    primaryBiome: 'heartlands',
    allowedProps: ['old_skull_inn', 'twisted_tower', 'cormanthor_oak', 'stones']
  },
  TIME_OF_TROUBLES: {
    id: 'TIME_OF_TROUBLES',
    yearDR: '1358 DR',
    title: 'Time of Troubles',
    description: 'Gods walk the earth, wild magic surges, and unstable planar rifts.',
    skyColor: '#31103f',
    fogColor: '#8b5cf6',
    heightScale: 22.0,
    noiseComplexity: 0.018,
    primaryBiome: 'wild_magic_chaos',
    allowedProps: ['planar_rift', 'god_avatar', 'stones']
  },
  ERA_OF_UPHEAVAL: {
    id: 'ERA_OF_UPHEAVAL',
    yearDR: '1492+ DR',
    title: 'Era of Upheaval',
    description: 'Unified MyOS Multi-Timeline Nexus lattice and real-time AI knowledge pool.',
    skyColor: '#090d16',
    fogColor: '#06b6d4',
    heightScale: 16.0,
    noiseComplexity: 0.014,
    primaryBiome: 'nexus_lattice',
    allowedProps: ['nexus_portal', 'telemetry_node', 'stones']
  }
};
