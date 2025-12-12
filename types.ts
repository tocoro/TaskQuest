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
  type: 'start' | 'task' | 'boss';
  difficulty: number; // 1-5, determines XP
  generatedFrom?: string; // ID of the parent node
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
}

export interface NewTaskSuggestion {
  title: string;
  description: string;
  difficulty: number;
}
