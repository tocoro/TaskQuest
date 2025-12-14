export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Language = 'en' | 'ja';

export interface GridPosition {
  col: number;
  row: number;
}

export interface TaskNode {
  id: string;
  title: string;
  description: string;
  status: 'locked' | 'available' | 'completed';
  position: GridPosition;
  type: 'start' | 'task' | 'boss' | 'blank';
  difficulty: number; // 1-5, determines XP
  generatedFrom?: string; // ID of the parent node
  
  // Logic & Flags
  requiredFlag?: string;    // Flag required to enter/traverse this node
  onCompleteFlag?: string;  // Flag to set true when completed
  
  // Conditional Content
  conditionFlag?: string;   // If this flag is active...
  conditionTitle?: string;  // ...show this title
  conditionDesc?: string;   // ...and this description
}

export interface Edge {
  source: string;
  target: string;
}

export interface Settings {
  language: Language;
}

export interface GameState {
  nodes: TaskNode[];
  edges: Edge[];
  pawnPosition: string; // ID of the node the pawn is on
  focusedNodeId: string; // ID of the node currently highlighted
  xp: number;
  level: number;
  camera: { x: number; y: number };
  settings: Settings;
  isGmMode: boolean;
  flags: Record<string, boolean>; // Global flag state
}

export interface NewTaskSuggestion {
  title: string;
  description: string;
  difficulty: number;
}