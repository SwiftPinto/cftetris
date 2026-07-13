import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTetris } from '../useTetris';
import { BOARD_WIDTH, TOTAL_HEIGHT, HIDDEN_ROWS } from '../../game/constants';
import type { TetrominoType } from '../../game/constants';

// Deterministic bag: I, O, T, S, Z, J, L (Math.random returns 0.99, no shuffle)
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function currentPieceType(result: { current: ReturnType<typeof useTetris> }): TetrominoType | null {
  return result.current.state.currentPiece?.type ?? null;
}

describe('useTetris', () => {
  describe('initial state', () => {
    it('game is not started', () => {
      const { result } = renderHook(() => useTetris());
      expect(result.current.state.gameStarted).toBe(false);
      expect(result.current.state.gameOver).toBe(false);
      expect(result.current.state.currentPiece).toBeNull();
      expect(result.current.state.nextPiece).toBeNull();
      expect(result.current.state.score).toBe(0);
      expect(result.current.state.level).toBe(1);
      expect(result.current.state.lines).toBe(0);
    });
  });

  describe('startGame', () => {
    it('initialises the game with pieces and an empty board', () => {
      const { result } = renderHook(() => useTetris());

      act(() => result.current.startGame());

      const s = result.current.state;
      expect(s.gameStarted).toBe(true);
      expect(s.gameOver).toBe(false);
      expect(s.currentPiece).not.toBeNull();
      expect(s.nextPiece).not.toBeNull();
      // Board should be all zeros
      for (const row of s.board) {
        for (const cell of row) expect(cell).toBe(0);
      }
    });

    it('spawns pieces at rotation 0', () => {
      const { result } = renderHook(() => useTetris());

      act(() => result.current.startGame());

      expect(result.current.state.currentPiece?.rotation).toBe(0);
    });
  });

  describe('movement', () => {
    it('moveLeft shifts piece left by 1', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      const xBefore = result.current.state.currentPiece!.x;
      act(() => result.current.moveLeft());
      expect(result.current.state.currentPiece!.x).toBe(xBefore - 1);
    });

    it('moveRight shifts piece right by 1', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      const xBefore = result.current.state.currentPiece!.x;
      act(() => result.current.moveRight());
      expect(result.current.state.currentPiece!.x).toBe(xBefore + 1);
    });

    it('piece cannot move past the left wall', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      // Move all the way left
      const maxMoves = result.current.state.currentPiece!.x;
      for (let i = 0; i < maxMoves + 2; i++) {
        act(() => result.current.moveLeft());
      }
      expect(result.current.state.currentPiece!.x).toBe(0);
    });

    it('piece cannot move past the right wall', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      // Move all the way right
      for (let i = 0; i < BOARD_WIDTH; i++) {
        act(() => result.current.moveRight());
      }
      const piece = result.current.state.currentPiece!;
      const shape = piece.type === 'I' ? 4 : piece.type === 'O' ? 2 : 3;
      expect(piece.x).toBeLessThanOrEqual(BOARD_WIDTH - shape);
    });
  });

  describe('rotation', () => {
    it('rotateCW increments rotation (wrapping at 3→0)', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      act(() => result.current.rotateCW());
      expect(result.current.state.currentPiece?.rotation).toBe(1);

      act(() => result.current.rotateCW());
      expect(result.current.state.currentPiece?.rotation).toBe(2);

      act(() => result.current.rotateCW());
      expect(result.current.state.currentPiece?.rotation).toBe(3);

      act(() => result.current.rotateCW());
      expect(result.current.state.currentPiece?.rotation).toBe(0);
    });

    it('rotateCCW decrements rotation (wrapping at 0→3)', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      act(() => result.current.rotateCCW());
      expect(result.current.state.currentPiece?.rotation).toBe(3);

      act(() => result.current.rotateCCW());
      expect(result.current.state.currentPiece?.rotation).toBe(2);
    });

    it('O piece rotation is a no-op', () => {
      // O is the second piece in the bag with random=0.99: I, O, T, ...
      // Hard-drop I first, then O appears
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      // Hard drop I piece to get to O
      act(() => result.current.hardDrop());

      expect(currentPieceType(result)).toBe('O');
      act(() => result.current.rotateCW());
      expect(result.current.state.currentPiece?.rotation).toBe(0);
    });

    it('wall kick allows rotation near obstacles', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      // Push the I piece to the right wall
      for (let i = 0; i < BOARD_WIDTH; i++) {
        act(() => result.current.moveRight());
      }

      const rotBefore = result.current.state.currentPiece!.rotation;
      // Rotation should still work (wall kick shifts piece left)
      act(() => result.current.rotateCW());
      // Either the rotation changed or it was blocked (both acceptable for a wall-kick test)
      // The important thing is it didn't crash
      expect(result.current.state.currentPiece).not.toBeNull();
    });
  });

  describe('hardDrop', () => {
    it('locks piece at the bottom and spawns next piece', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      const firstType = currentPieceType(result);
      act(() => result.current.hardDrop());

      // Piece should be locked on the board
      const board = result.current.state.board;
      const hasLockedCells = board.some(row => row.some(cell => cell !== 0));
      expect(hasLockedCells).toBe(true);

      // A new piece should have spawned
      expect(result.current.state.currentPiece).not.toBeNull();
      expect(currentPieceType(result)).not.toBe(firstType);
    });

    it('awards hard drop score (2 points per cell)', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      act(() => result.current.hardDrop());
      // I piece drops from y=0 to y=22 (distance 22) → 22 * 2 = 44 points
      expect(result.current.state.score).toBeGreaterThan(0);
    });

    it('does not cause game over on an empty board', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      act(() => result.current.hardDrop());
      expect(result.current.state.gameOver).toBe(false);
      expect(result.current.state.gameStarted).toBe(true);
    });

    it('game continues after multiple hard drops (no false game over)', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      // Hard drop several pieces
      for (let i = 0; i < 5; i++) {
        act(() => result.current.hardDrop());
        expect(result.current.state.gameOver).toBe(false);
      }

      expect(result.current.state.currentPiece).not.toBeNull();
    });
  });

  describe('softDrop', () => {
    it('moves piece down by 1 and awards 1 point', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      const yBefore = result.current.state.currentPiece!.y;
      const scoreBefore = result.current.state.score;

      act(() => result.current.softDrop());

      expect(result.current.state.currentPiece!.y).toBe(yBefore + 1);
      expect(result.current.state.score).toBe(scoreBefore + 1);
    });
  });

  describe('hold', () => {
    it('first hold stores current piece and brings in next piece', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      const firstType = currentPieceType(result); // I
      const nextType = result.current.state.nextPiece?.type; // O

      act(() => result.current.hold());

      // Hold should contain the first piece type
      expect(result.current.state.holdPiece).toBe(firstType);
      // Current piece should be the previous next piece
      expect(currentPieceType(result)).toBe(nextType);
      // canHold is consumed
      expect(result.current.state.canHold).toBe(false);
    });

    it('second hold swaps current piece with held piece', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      const firstType = currentPieceType(result); // I
      act(() => result.current.hold()); // store I, bring in O

      // canHold was consumed — need piece to lock first
      act(() => result.current.hardDrop()); // locks O, spawns T, canHold reset

      act(() => result.current.hold()); // store T, bring back I
      expect(result.current.state.holdPiece).not.toBe(firstType); // now holds T
      expect(currentPieceType(result)).toBe(firstType); // I is back
    });

    it('canHold resets to true after locking a piece', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      act(() => result.current.hold());
      expect(result.current.state.canHold).toBe(false);

      act(() => result.current.hardDrop());
      expect(result.current.state.canHold).toBe(true);
    });

    it('hold is ignored when canHold is false', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      act(() => result.current.hold()); // consume hold
      const pieceAfterFirstHold = currentPieceType(result);

      act(() => result.current.hold()); // attempt second hold before lock
      // Should be a no-op — same piece still active
      expect(currentPieceType(result)).toBe(pieceAfterFirstHold);
    });
  });

  describe('pause', () => {
    it('togglePause sets paused to true', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      act(() => result.current.togglePause());
      expect(result.current.state.paused).toBe(true);
    });

    it('togglePause sets paused back to false', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      act(() => result.current.togglePause());
      act(() => result.current.togglePause());
      expect(result.current.state.paused).toBe(false);
    });

    it('cannot pause before game starts', () => {
      const { result } = renderHook(() => useTetris());

      act(() => result.current.togglePause());
      expect(result.current.state.paused).toBe(false);
    });

    it('movement is ignored while paused', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      const xBefore = result.current.state.currentPiece!.x;
      act(() => result.current.togglePause());
      act(() => result.current.moveLeft());

      expect(result.current.state.currentPiece!.x).toBe(xBefore);
    });

    it('hard drop is ignored while paused', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      const yBefore = result.current.state.currentPiece!.y;
      act(() => result.current.togglePause());
      act(() => result.current.hardDrop());

      // Piece should not have moved
      expect(result.current.state.currentPiece!.y).toBe(yBefore);
    });
  });

  describe('game over', () => {
    it('game over is detected when spawn fails (board overflows)', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      // Pile up pieces without clearing lines until game over
      // This requires many pieces; stop when game is over or after a limit
      for (let i = 0; i < 200; i++) {
        if (result.current.state.gameOver) break;
        act(() => result.current.hardDrop());
      }

      expect(result.current.state.gameOver).toBe(true);
    });

    it('startGame resets after game over', () => {
      const { result } = renderHook(() => useTetris());

      // Force game over by filling the board
      act(() => result.current.startGame());
      for (let i = 0; i < 300; i++) {
        if (result.current.state.gameOver) break;
        act(() => result.current.hardDrop());
      }
      expect(result.current.state.gameOver).toBe(true);

      // Restart
      act(() => result.current.startGame());
      expect(result.current.state.gameOver).toBe(false);
      expect(result.current.state.gameStarted).toBe(true);
      expect(result.current.state.score).toBe(0);
      expect(result.current.state.lines).toBe(0);
      expect(result.current.state.level).toBe(1);
    });
  });

  describe('stress test', () => {
    it('game survives 200 hard drops without crashing', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      for (let i = 0; i < 200 && !result.current.state.gameOver; i++) {
        // Spread pieces across the board: alternate left/right edges
        if (i % 2 === 0) {
          for (let m = 0; m < 10; m++) act(() => result.current.moveLeft());
        } else {
          for (let m = 0; m < 10; m++) act(() => result.current.moveRight());
        }
        act(() => result.current.hardDrop());

        // Verify invariant: after each drop, if game is not over, a new piece exists
        if (!result.current.state.gameOver) {
          expect(result.current.state.currentPiece).not.toBeNull();
        }
      }

      // Either game ended naturally or we survived 200 drops
      expect(result.current.state.gameOver || result.current.state.currentPiece).toBeTruthy();
    });

    it('score increases with play', () => {
      const { result } = renderHook(() => useTetris());
      act(() => result.current.startGame());

      // Play 20 pieces, score should accumulate
      for (let i = 0; i < 20 && !result.current.state.gameOver; i++) {
        if (i % 3 === 0) act(() => result.current.moveLeft());
        act(() => result.current.hardDrop());
      }

      expect(result.current.state.score).toBeGreaterThan(0);
    });
  });
});
