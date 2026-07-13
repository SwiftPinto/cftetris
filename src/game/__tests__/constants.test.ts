import { describe, it, expect } from 'vitest';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  HIDDEN_ROWS,
  VISIBLE_HEIGHT,
  TOTAL_HEIGHT,
  PIECE_COLORS,
  PIECE_COLORS_DIM,
  LINE_SCORES,
  SOFT_DROP_SCORE,
  HARD_DROP_SCORE,
  LINES_PER_LEVEL,
  getDropInterval,
  getLevel,
} from '../constants';
import { PIECE_TYPES } from '../tetrominos';

describe('Board dimensions', () => {
  it('BOARD_WIDTH is 10', () => expect(BOARD_WIDTH).toBe(10));
  it('BOARD_HEIGHT is 20', () => expect(BOARD_HEIGHT).toBe(20));
  it('VISIBLE_HEIGHT is 20', () => expect(VISIBLE_HEIGHT).toBe(20));
  it('HIDDEN_ROWS is 4', () => expect(HIDDEN_ROWS).toBe(4));
  it('TOTAL_HEIGHT is 24 (visible + hidden)', () => expect(TOTAL_HEIGHT).toBe(24));
});

describe('Piece types', () => {
  it('has 7 piece types', () => expect(PIECE_TYPES.length).toBe(7));
  it('contains all expected types', () => {
    expect([...PIECE_TYPES].sort()).toEqual(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
  });
});

describe('Piece colors', () => {
  it('PIECE_COLORS has an entry for every piece type', () => {
    for (const type of PIECE_TYPES) {
      expect(PIECE_COLORS[type]).toBeTruthy();
      expect(PIECE_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('PIECE_COLORS_DIM has an entry for every piece type', () => {
    for (const type of PIECE_TYPES) {
      expect(PIECE_COLORS_DIM[type]).toBeTruthy();
      expect(PIECE_COLORS_DIM[type]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('each piece has a unique normal color', () => {
    const colors = PIECE_TYPES.map(t => PIECE_COLORS[t].toLowerCase());
    expect(new Set(colors).size).toBe(7);
  });
});

describe('Scoring constants', () => {
  it('LINE_SCORES matches Tetris guideline', () => {
    expect(LINE_SCORES).toEqual([0, 100, 300, 500, 800]);
  });
  it('SOFT_DROP_SCORE is 1 per cell', () => expect(SOFT_DROP_SCORE).toBe(1));
  it('HARD_DROP_SCORE is 2 per cell', () => expect(HARD_DROP_SCORE).toBe(2));
  it('LINES_PER_LEVEL is 10', () => expect(LINES_PER_LEVEL).toBe(10));
});

describe('getDropInterval', () => {
  it('level 1 is 800ms', () => expect(getDropInterval(1)).toBe(800));
  it('level 2 is 730ms', () => expect(getDropInterval(2)).toBe(730));
  it('level 5 is 520ms', () => expect(getDropInterval(5)).toBe(520));
  it('level 10 is 170ms', () => expect(getDropInterval(10)).toBe(170));
  it('never goes below 50ms', () => {
    expect(getDropInterval(20)).toBe(50);
    expect(getDropInterval(100)).toBe(50);
  });
  it('decreases monotonically', () => {
    let prev = Infinity;
    for (let lvl = 1; lvl <= 20; lvl++) {
      const curr = getDropInterval(lvl);
      expect(curr).toBeLessThanOrEqual(prev);
      prev = curr;
    }
  });
});

describe('getLevel', () => {
  it('level 1 at 0-9 lines', () => {
    expect(getLevel(0)).toBe(1);
    expect(getLevel(5)).toBe(1);
    expect(getLevel(9)).toBe(1);
  });
  it('level 2 at 10-19 lines', () => {
    expect(getLevel(10)).toBe(2);
    expect(getLevel(15)).toBe(2);
    expect(getLevel(19)).toBe(2);
  });
  it('level 3 at 20-29 lines', () => expect(getLevel(20)).toBe(3));
  it('level 10 at 90-99 lines', () => expect(getLevel(90)).toBe(10));
});
