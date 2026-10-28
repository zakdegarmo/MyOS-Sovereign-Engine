import { SpatialMemoryNode } from '../spatial/types.js';
import { DMPromptOptions, SwarmContextParams } from './types.js';

export class DMPromptBuilder {
  /**
   * Builds the baseline Dungeon Master persona system prompt.
   */
  static buildDMRolePrompt(options?: DMPromptOptions): string {
    const style = options?.narrativeStyle || 'B-Movie Horror';
    const diff = options?.difficulty || 'NORMAL';
    const preset = options?.atmospherePreset || 'default';

    return [
      `# DUNGEON MASTER SYSTEM PROMPT (${style.toUpperCase()} MODE)`,
      `You are the Dungeon Master (DM) for an autonomous AI Swarm playtest in a 3D WebGL environment.`,
      `Narrative Tone: ${style}`,
      `Difficulty Level: ${diff}`,
      `Atmospheric Preset: ${preset}`,
      ``,
      `## DM DIRECTIVES:`,
      `1. Synthesize active spatial memory nodes into immersive environmental scene descriptions.`,
      `2. Dynamically weave regional lore, ancient history, and past agent events into spatial terrain details at current [X, Y, Z] coordinates.`,
      `3. Present tactical choices and active environmental hazards corresponding to the spatial memory tags.`,
      `4. Adapt encounter severity based on party condition and difficulty setting (${diff}).`,
      `5. Maintain crisp, structured formatting suitable for consumption by hero agents (Hero/Fighter, Mage/Wizard, Cleric).`,
    ].join('\n');
  }

  /**
   * Maps regional spatial memories into narrative environmental lore sections.
   */
  static buildDMSpatialContextPrompt(
    params: SwarmContextParams,
    options?: DMPromptOptions
  ): string {
    const memories = params.memories || [];
    const limit = options?.maxMemoriesInContext || 5;
    const activeMemories = memories.slice(0, limit);

    if (activeMemories.length === 0) {
      return [
        `### 📍 Spatial Vector Store Regional Lore`,
        `*Coordinates*: [${params.position.join(', ')}] | *Region*: \`${params.activeRegionId}\``,
        `*No specific regional lore vectors anchored within ${params.radius} units radius.*`,
        `The surroundings feature standard terrain with no active historical anomalies.`,
      ].join('\n');
    }

    let md = `### 📍 Spatial Vector Store Regional Lore (${activeMemories.length} Active Vector Nodes)\n`;
    md += `*Current 3D Coordinates*: [${params.position.join(', ')}] | *Active Region*: \`${params.activeRegionId}\` | *Search Radius*: ${params.radius} units\n\n`;

    activeMemories.forEach((m, idx) => {
      const tagsStr = Array.isArray(m.tags) ? m.tags.map((t) => `\`#${t}\``).join(' ') : '';
      const textFormatted = typeof m.text === 'string' ? m.text.replace(/\n/g, '\n  > ') : '';

      md += `#### Vector Lore Node ${idx + 1}: ${m.title || 'Untitled Regional Lore'}\n`;
      md += `- **Anchor Vector Coords**: [${m.x}, ${m.y}, ${m.z}] (Radius: ${m.radius_influence}u)\n`;
      md += `- **Type**: \`${m.type}\` | **Region ID**: \`${m.region_id}\`\n`;
      md += `- **Tags**: ${tagsStr}\n`;
      md += `- **Historical Memory Snapshot**:\n  > ${textFormatted}\n\n`;
    });

    return md.trim();
  }

  /**
   * Generates full DM turn prompt containing system framing, spatial context, party status, and turn prompt.
   */
  static formatDMTurnPrompt(
    params: SwarmContextParams,
    options?: DMPromptOptions
  ): string {
    const rolePrompt = this.buildDMRolePrompt(options);
    const spatialPrompt = this.buildDMSpatialContextPrompt(params, options);

    let partyMd = `### 🛡️ Active Party Status (Turn ${params.currentTurn})\n`;
    (params.partyState || []).forEach((p) => {
      partyMd += `- **${p.name}** (${p.role}): HP ${p.hp}/${p.maxHp} | MP ${p.mp}/${p.maxMp} | Status: [${p.statusEffects.join(', ') || 'Normal'}]\n`;
    });

    let historyMd = `### 📜 Recent Turn History (Last ${Math.min(3, params.turnHistory?.length || 0)} Actions)\n`;
    if (!params.turnHistory || params.turnHistory.length === 0) {
      historyMd += `*Playtest session initialized. No turn history recorded yet.*\n`;
    } else {
      const recent = params.turnHistory.slice(-3);
      recent.forEach((h) => {
        historyMd += `- Turn ${h.turnNumber} [${h.actorName} - ${h.actionType} -> ${h.target}]: ${h.narrativeReasoning} (${h.isLegal ? 'LEGAL' : 'ILLEGAL'})\n`;
      });
    }

    return [
      rolePrompt,
      ``,
      spatialPrompt,
      ``,
      partyMd,
      ``,
      historyMd,
      ``,
      `## DM SCENE GENERATION TASK:`,
      `Describe the immediate environmental conditions at [${params.position.join(', ')}], frame active tactical opportunities or threats for the Party based on the spatial vector lore above, and set up turn ${params.currentTurn}.`,
    ].join('\n');
  }

  /**
   * Utility to format raw DM scene narration into clean structured description.
   */
  static parseDMSceneNarration(rawOutput: string): {
    narration: string;
    hazards: string[];
    spatialTagsReferenced: string[];
  } {
    const hazards: string[] = [];
    const spatialTagsReferenced: string[] = [];

    const tagMatches = rawOutput.match(/#[\w-]+/g);
    if (tagMatches) {
      tagMatches.forEach((t) => {
        const tag = t.replace('#', '');
        if (!spatialTagsReferenced.includes(tag)) spatialTagsReferenced.push(tag);
      });
    }

    if (rawOutput.toLowerCase().includes('hazard') || rawOutput.toLowerCase().includes('trap')) {
      hazards.push('Environmental Hazard Detected');
    }

    return {
      narration: rawOutput.trim(),
      hazards,
      spatialTagsReferenced,
    };
  }
}
