import { describe, it, expect } from 'vitest';
import {
  createBoard,
  isValidPosition,
  lockPiece,
  clearLines,
  getGhostY,
  isGameOver,
  spawnPiece,
  getShape,
} from '../board';
import { BOARD_WIDTH, TOTAL_HEIGHT, HIDDEN_ROWS } from '../constants';
import type { TetrominoType } from '../constants';

function makePiece(type: TetrominoType, x: number, y: number, rotation = 0) {
  return { type, x, y, rotation };
}

describe('createBoard', () => {
  it('creates a TOTAL_HEIGHT x BOARD_WIDTH grid', () => {
    const board = createBoard();
    expect(board).toHaveLength(TOTAL_HEIGHT);
    for (const row of board) {
      expect(row).toHaveLength(BOARD_WIDTH);
    }
  });

  it('all cells are initialized to 0', () => {
    const board = createBoard();
    for (const row of board) {
      for (const cell of row) {
        expect(cell).toBe(0);
      }
    }
  });

  it('returns a new board each call', () => {
    const a = createBoard();
    const b = createBoard();
    a[0][0] = 99;
    expect(b[0][0]).toBe(0);
  });
});

describe('isValidPosition', () => {
  it('accepts a piece at spawn position on empty board', () => {
    const board = createBoard();
    const piece = spawnPiece('T');
    expect(isValidPosition(board, piece)).toBe(true);
  });

  it('rejects piece out of bounds (left)', () => {
    const board = createBoard();
    const piece = makePiece('T', -2, HIDDEN_ROWS);
    expect(isValidPosition(board, piece)).toBe(false);
  });

  it('rejects piece out of bounds (right)', () => {
    const board = createBoard();
    const piece = makePiece('T', BOARD_WIDTH - 1, HIDDEN_ROWS);
    expect(isValidPosition(board, piece)).toBe(false);
  });

  it('rejects piece below the board', () => {
    const board = createBoard();
    const piece = makePiece('T', 3, TOTAL_HEIGHT);
    expect(isValidPosition(board, piece)).toBe(false);
  });

  it('accepts piece partially above the board (hidden rows)', () => {
    const board = createBoard();
    const piece = makePiece('T', 3, -1);
    expect(isValidPosition(board, piece)).toBe(true);
  });

  it('accepts I piece spawn above board', () => {
    const board = createBoard();
    const piece = spawnPiece('I');
    // I piece spawns at y = 0 (HIDDEN_ROWS - 4)
    expect(piece.y).toBe(0);
    expect(isValidPosition(board, piece)).toBe(true);
  });

  it('rejects piece overlapping locked cells', () => {
    const board = createBoard();
    // Place a block at row 22, col 4 (near bottom)
    board[22][4] = 1;
    const piece = makePiece('T', 3, 20);
    // T piece at rotation 0 has block at position (1,0) relative = row 21, col 4
    // Actually T rot 0: [[0,1,0],[1,1,1],[0,0,0]]
    // At x=3, y=20: blocks at (4,20), (3,21), (4,21), (5,21)
    // That doesn't overlap board[22][4]. Let me set up a proper overlap.
    const piece2 = makePiece('O', 4, 21);
    board[22][4] = 1; // O piece at (4,21) would have blocks at (4,21),(5,21),(4,22),(5,22)
    expect(isValidPosition(board, piece2)).toBe(false);
  });

  it('accepts piece that fits between locked cells', () => {
    const board = createBoard();
    board[23][0] = 1;
    board[23][2] = 1;
    const piece = makePiece('T', 3, 21);
    expect(isValidPosition(board, piece)).toBe(true);
  });
});

describe('lockPiece', () => {
  it('locks piece cells onto the board', () => {
    const board = createBoard();
    const piece = makePiece('O', 4, 20);
    const locked = lockPiece(board, piece);

    // O piece: 2x2 at (4,20) and (4,21)
    expect(locked[20][4]).toBe('O'.charCodeAt(0));
    expect(locked[20][5]).toBe('O'.charCodeAt(0));
    expect(locked[21][4]).toBe('O'.charCodeAt(0));
    expect(locked[21][5]).toBe('O'.charCodeAt(0));
  });

  it('does not mutate the original board', () => {
    const board = createBoard();
    const original = board.map(r => [...r]);
    lockPiece(board, makePiece('O', 4, 20));
    expect(board).toEqual(original);
  });

  it('handles pieces partially above the board', () => {
    const board = createBoard();
    // I piece vertical (rot 1) at y=-1: filled cells at cols 2 of rows 0,1,2,3
    // At x=3, y=-1: board positions (5,0), (5,1), (5,2) — row -1 is above board and skipped
    const piece = makePiece('I', 3, -1, 1);
    const locked = lockPiece(board, piece);
    // Row 0 col 5 (the only cell in row 0 of the piece that landed on the board)
    expect(locked[0][5]).toBe('I'.charCodeAt(0));
    expect(locked[1][5]).toBe('I'.charCodeAt(0));
    expect(locked[2][5]).toBe('I'.charCodeAt(0));
  });
});

describe('clearLines', () => {
  it('clears a single full line', () => {
    const board = createBoard();
    // Fill row 23 completely
    for (let c = 0; c < BOARD_WIDTH; c++) board[23][c] = 1;
    const { board: cleared, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(1);
    // Row 23 (now the top row after shift) should be empty
    expect(cleared[0].every(c => c === 0)).toBe(true);
    // Total height unchanged
    expect(cleared).toHaveLength(TOTAL_HEIGHT);
  });

  it('clears 4 lines (Tetris)', () => {
    const board = createBoard();
    for (let r = TOTAL_HEIGHT - 4; r < TOTAL_HEIGHT; r++) {
      for (let c = 0; c < BOARD_WIDTH; c++) board[r][c] = 1;
    }
    const { board: cleared, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(4);
    // Top 4 rows should be empty
    for (let r = 0; r < 4; r++) {
      expect(cleared[r].every(c => c === 0)).toBe(true);
    }
  });

  it('returns linesCleared=0 when no line is full', () => {
    const board = createBoard();
    board[23][0] = 1; // only one cell filled
    const { board: cleared, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(0);
    // Board unchanged (no shift)
    expect(cleared[23][0]).toBe(1);
  });

  it('shifts non-full lines down when lines above are cleared', () => {
    const board = createBoard();
    // Fill rows 21 and 23, leave 22 partially filled
    for (let c = 0; c < BOARD_WIDTH; c++) {
      board[21][c] = 1; // full
      board[23][c] = 1; // full
    }
    board[22][0] = 2; // partial — this row should survive

    const { board: cleared, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(2);
    // The partial row (originally at 22) should have shifted down by 2
    expect(cleared[TOTAL_HEIGHT - 1][0]).toBe(2);
    // Top 2 rows should be empty
    expect(cleared[0].every(c => c === 0)).toBe(true);
    expect(cleared[1].every(c => c === 0)).toBe(true);
  });

  it('does not mutate the original board', () => {
    const board = createBoard();
    for (let c = 0; c < BOARD_WIDTH; c++) board[23][c] = 1;
    const original = board.map(r => [...r]);
    clearLines(board);
    expect(board).toEqual(original);
  });
});

describe('getGhostY', () => {
  it('drops piece to bottom of empty board', () => {
    const board = createBoard();
    // T piece rot 0: [[0,1,0],[1,1,1],[0,0,0]] — only rows 0-1 have filled cells
    // Effectively 2 rows tall for collision. Drops to TOTAL_HEIGHT - 2 = 22
    const piece = makePiece('T', 3, 0);
    expect(getGhostY(board, piece)).toBe(22);
  });

  it('drops piece onto an obstacle', () => {
    const board = createBoard();
    // Place obstacle at row 20
    board[20][4] = 1;
    // T piece at x=3: blocks at x=4 in row 1 (of the piece)
    const piece = makePiece('T', 3, 0);
    // Ghost should stop at y=18 (piece row 1 at board row 19, one above obstacle)
    expect(getGhostY(board, piece)).toBe(18);
  });

  it('returns current y when piece cannot move down', () => {
    const board = createBoard();
    // Fill the row directly below piece
    for (let c = 0; c < BOARD_WIDTH; c++) board[4][c] = 1;
    const piece = makePiece('O', 4, 2); // 2x2, bottom at row 3, sitting on row 4
    expect(getGhostY(board, piece)).toBe(2);
  });

  it('I piece vertical ghost', () => {
    const board = createBoard();
    // I piece rot 1 (vertical): [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]]
    const piece = makePiece('I', 3, 0, 1);
    // 4 rows tall, should drop to y = TOTAL_HEIGHT - 4 = 20
    expect(getGhostY(board, piece)).toBe(20);
  });
});

describe('isGameOver', () => {
  it('returns false for empty board', () => {
    expect(isGameOver(createBoard())).toBe(false);
  });

  it('returns false when blocks are only in visible rows', () => {
    const board = createBoard();
    board[HIDDEN_ROWS][0] = 1; // first visible row
    board[TOTAL_HEIGHT - 1][5] = 1; // bottom row
    expect(isGameOver(board)).toBe(false);
  });

  it('returns true when any cell in hidden rows is filled', () => {
    const board = createBoard();
    board[0][5] = 1; // hidden row 0
    expect(isGameOver(board)).toBe(true);
  });

  it('returns true when hidden row 3 is filled', () => {
    const board = createBoard();
    board[HIDDEN_ROWS - 1][0] = 1; // last hidden row
    expect(isGameOver(board)).toBe(true);
  });
});

describe('spawnPiece', () => {
  it('spawns T piece centered horizontally', () => {
    const piece = spawnPiece('T');
    expect(piece.type).toBe('T');
    expect(piece.rotation).toBe(0);
    // T rot 0 is 3 wide. Center: (10 - 3) / 2 = 3.5 → floor = 3
    expect(piece.x).toBe(3);
    // T rot 0 is 3 tall. y = HIDDEN_ROWS - 3 = 1
    expect(piece.y).toBe(1);
  });

  it('spawns I piece centered', () => {
    const piece = spawnPiece('I');
    // I rot 0 is 4 wide. Center: (10 - 4) / 2 = 3
    expect(piece.x).toBe(3);
    // I rot 0 is 4 tall. y = HIDDEN_ROWS - 4 = 0
    expect(piece.y).toBe(0);
  });

  it('spawns O piece centered', () => {
    const piece = spawnPiece('O');
    // O is 2 wide. Center: (10 - 2) / 2 = 4
    expect(piece.x).toBe(4);
    // O is 2 tall. y = HIDDEN_ROWS - 2 = 2
    expect(piece.y).toBe(2);
  });

  it('spawned piece is valid on empty board', () => {
    const board = createBoard();
    for (const type of ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as TetrominoType[]) {
      const piece = spawnPiece(type);
      expect(isValidPosition(board, piece)).toBe(true);
    }
  });

  it('returns rotation 0 for all spawns', () => {
    for (const type of ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as TetrominoType[]) {
      expect(spawnPiece(type).rotation).toBe(0);
    }
  });
});

describe('getShape', () => {
  it('returns the correct shape for a given piece and rotation', () => {
    const piece = makePiece('T', 3, 5, 0);
    const shape = getShape(piece);
    expect(shape).toEqual([
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ]);
  });

  it('uses piece rotation not the piece state', () => {
    const piece = makePiece('S', 0, 0, 2);
    const shape = getShape(piece);
    // S rot 2: [[0,0,0],[0,1,1],[1,1,0]]
    expect(shape[2][0]).toBe(1);
    expect(shape[2][1]).toBe(1);
  });
});

describe('edge cases / integration', () => {
  it('full game sequence: spawn, drop, lock, clear lines', () => {
    const board = createBoard();

    // Fill row 23 completely and row 22 at cols 0-4
    for (let c = 0; c < BOARD_WIDTH; c++) board[23][c] = 1;
    for (let c = 0; c < 6; c++) board[22][c] = 1;

    // Spawn O piece at x=4 (cols 4,5)
    const piece = makePiece('O', 4, 0);
    expect(isValidPosition(board, piece)).toBe(true);

    // Drop to bottom: O piece (2 tall, rows 0-1 filled) → ghost at 20 (TOTAL_HEIGHT - 2 - 1 due to row 22 obstacle at cols 4-5)
    // Actually row 22 has cols 0-5 filled. O at x=4 covers cols 4,5. So ghost drops to y=20 (row 21 is last valid position)
    const ghostY = getGhostY(board, piece);
    const dropped = { ...piece, y: ghostY };

    // Lock the piece
    const locked = lockPiece(board, dropped);

    // Row 22 now has cols 0-5 + O piece at cols 4-5 = all 10 cols filled?
    // Actually O piece at y=20 covers rows 20 and 21 (y to y+1). Let me check ghostY first.
    // Row 22 is an obstacle at cols 0-5. O at x=4: cols 4,5. 
    // check y=21 (rows 21,22): row 22 cols 4,5 are filled → invalid
    // So ghostY=20. Lock at y=20 fills rows 20-21 at cols 4,5.
    // Row 21 now has cols 4,5 filled. Not a full row.
    // Let me just verify the lock succeeded and lines were cleared appropriately.
    expect(locked[20][4]).toBe('O'.charCodeAt(0));
    expect(locked[21][4]).toBe('O'.charCodeAt(0));

    // Row 23 should still be full (10 cells)
    expect(locked[23].every(c => c !== 0)).toBe(true);

    const { board: cleared, linesCleared } = clearLines(locked);
    expect(linesCleared).toBe(1); // row 23 cleared
    // Row 23 cleared → top row should now be empty
    expect(cleared[0].every(c => c === 0)).toBe(true);
  });

  it('spawn position is valid for all piece types after line clears', () => {
    const board = createBoard();
    // Fill bottom rows so they get cleared
    for (let r = TOTAL_HEIGHT - 2; r < TOTAL_HEIGHT; r++) {
      for (let c = 0; c < BOARD_WIDTH; c++) {
        board[r][c] = 1;
      }
    }
    const { board: cleared } = clearLines(board);

    // After clearing, spawn positions should still be valid
    for (const type of ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as TetrominoType[]) {
      const piece = spawnPiece(type);
      expect(isValidPosition(cleared, piece)).toBe(true);
    }
  });
});
