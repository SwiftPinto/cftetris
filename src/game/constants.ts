export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const VISIBLE_HEIGHT = 20;
export const HIDDEN_ROWS = 4; // rows above the visible area for spawning

export const TOTAL_HEIGHT = BOARD_HEIGHT + HIDDEN_ROWS;

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export const PIECE_COLORS: Record<TetrominoType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};

export const PIECE_COLORS_DIM: Record<TetrominoType, string> = {
  I: '#003333',
  O: '#333300',
  T: '#220033',
  S: '#003300',
  Z: '#330000',
  J: '#000033',
  L: '#332200',
};

// Scoring
export const LINE_SCORES = [0, 100, 300, 500, 800];
export const SOFT_DROP_SCORE = 1;
export const HARD_DROP_SCORE = 2;

// Level speeds: milliseconds per gravity tick
export function getDropInterval(level: number): number {
  return Math.max(50, 800 - (level - 1) * 70);
}

// Lines needed per level
export const LINES_PER_LEVEL = 10;

export function getLevel(totalLines: number): number {
  return Math.floor(totalLines / LINES_PER_LEVEL) + 1;
}
