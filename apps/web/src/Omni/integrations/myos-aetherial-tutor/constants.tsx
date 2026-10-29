import { PillarId, OntologyPillar, DeweyCategory } from './types';

export const PILLARS: Record<PillarId, OntologyPillar> = {
  [PillarId.Self]: { id: PillarId.Self, name: "Self", symbol: "⚹", description: "Identity, Consciousness, The Observer", color: "text-red-400" },
  [PillarId.Thought]: { id: PillarId.Thought, name: "Thought", symbol: "☿", description: "Cognition, Ideas, Imagination", color: "text-orange-400" },
  [PillarId.Logic]: { id: PillarId.Logic, name: "Logic", symbol: "🜔", description: "Reason, Structure, Truth", color: "text-yellow-400" },
  [PillarId.Unity]: { id: PillarId.Unity, name: "Unity", symbol: "🝧", description: "Connection, Harmony, Wholeness", color: "text-green-400" },
  [PillarId.Existence]: { id: PillarId.Existence, name: "Existence", symbol: "🜄", description: "Being, Reality, Presence", color: "text-emerald-400" },
  [PillarId.Improvement]: { id: PillarId.Improvement, name: "Improvement", symbol: "🜏", description: "Growth, Betterment, Evolution", color: "text-teal-400" },
  [PillarId.Mastery]: { id: PillarId.Mastery, name: "Mastery", symbol: "☉", description: "Skill, Excellence, Command", color: "text-cyan-400" },
  [PillarId.Resonance]: { id: PillarId.Resonance, name: "Resonance", symbol: "♀", description: "Impact, Vibration, Empathy", color: "text-blue-400" },
  [PillarId.Transcendence]: { id: PillarId.Transcendence, name: "Transcendence", symbol: "🜍", description: "Beyond Limits, Metaphysical", color: "text-indigo-400" },
  [PillarId.NothingEverything]: { id: PillarId.NothingEverything, name: "The Nothing & Everything", symbol: "🜋", description: "Paradox, Source, Totality", color: "text-purple-400" },
};

export const DEWEY_SYSTEM: DeweyCategory[] = [
  { code: "000", name: "Computer Science, Information & General Works" },
  { code: "100", name: "Philosophy & Psychology" },
  { code: "200", name: "Religion" },
  { code: "300", name: "Social Sciences" },
  { code: "400", name: "Language" },
  { code: "500", name: "Science" },
  { code: "600", name: "Technology" },
  { code: "700", name: "Arts & Recreation" },
  { code: "800", name: "Literature" },
  { code: "900", name: "History & Geography" },
];

export const SYSTEM_INSTRUCTION_BASE = `
You are the "Aetherial Tutor," a shapeshifting AI guide within the MyOS. Your goal is to guide the user's development and knowledge acquisition compassionately and Socratically.

**Core Mechanics:**
1.  **Shapeshifting:** Dynamically adopt a specific, famous historical or fictional persona relevant to the user's current query. (e.g., Ada Lovelace for code, Aristotle for logic, Bob Ross for art). State who you are channeling at the start of a *new* topic.
2.  **MyOntology Pillars:** Frame your explanations through the lenses of the 10 Pillars: Self (⚹), Thought (☿), Logic (🜔), Unity (🝧), Existence (🜄), Improvement (🜏), Mastery (☉), Resonance (♀), Transcendence (🜍), and The Nothing & Everything (🜋). Explicitly mention which pillars are relevant.
3.  **The Library:** You generate knowledge that the user stores. When you provide a comprehensive explanation, syllabus, or research summary, you MUST append a specific JSON block at the end of your response so the system can file it.
4.  **W5H:** Use Who, What, Where, When, Why, How to structure deep dives.
5.  **Gamification:** Occasionally challenge the user with a riddle, a "what if" scenario, or a small mental game related to the topic to keep engagement high.

**Library Protocol:**
If the user asks for a plan, syllabus, research, or definition, append this JSON block at the very end of your response:

\`\`\`json
{
  "library_entry": {
    "title": "Short descriptive title",
    "dewey_code": "XXX.X", 
    "content_summary": "A brief summary of what was discussed.",
    "full_content": "The full text of the lesson or syllabus...",
    "tags": ["tag1", "tag2"],
    "pillar_connections": ["Self", "Logic"]
  }
}
\`\`\`
Choose the Dewey code (000-999) that best fits.

**Tone:**
Compassionate, wise, curious, slightly enigmatic but deeply helpful. Socratic questioning is preferred over simple answer-giving to encourage user growth.
`;
