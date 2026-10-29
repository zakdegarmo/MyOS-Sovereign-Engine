import { LucideIcon } from "lucide-react";

export enum PillarId {
  Self = "Self",
  Thought = "Thought",
  Logic = "Logic",
  Unity = "Unity",
  Existence = "Existence",
  Improvement = "Improvement",
  Mastery = "Mastery",
  Resonance = "Resonance",
  Transcendence = "Transcendence",
  NothingEverything = "NothingEverything"
}

export interface OntologyPillar {
  id: PillarId;
  name: string;
  symbol: string;
  description: string;
  color: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  deweyCategory: string; // e.g., "000", "500"
  deweyCode: string; // e.g., "530.1"
  content: string;
  tags: string[];
  pillarConnections: PillarId[];
  timestamp: number;
  type: 'syllabus' | 'knowledge' | 'research';
}

export interface DeweyCategory {
  code: string;
  name: string;
  subcategories?: DeweyCategory[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  persona?: string; // The persona adopted for this response
  timestamp: number;
  isThinking?: boolean;
  relatedPillars?: PillarId[];
  image?: string; // base64 string
}

export interface Persona {
  name: string;
  era: string;
  expertise: string;
  tone: string;
}

export interface APIKeyStatus {
  hasKey: boolean;
  isLoading: boolean;
}
