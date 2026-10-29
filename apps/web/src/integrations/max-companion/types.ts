export enum MaxState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  SPEAKING = 'SPEAKING',
  GLITCHING = 'GLITCHING',
  SLEEPING = 'SLEEPING'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface WebPage {
  url: string;
  title: string;
  content: string; // HTML content
  loading: boolean;
}
