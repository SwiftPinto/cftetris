import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Board,
  Piece,
  createBoard,
  isValidPosition,
  lockPiece,
  clearLines,
  getGhostY,
  isGameOver,
  spawnPiece,
} from '../game/board';
import { getKicks } from '../game/srs';
import { createBag } from '../game/tetrominos';
import {
  TetrominoType,
  LINE_SCORES,
  SOFT_DROP_SCORE,
  HARD_DROP_SCORE,
  getDropInterval,
  getLevel,
} from '../game/constants';

export interface GameState {
  board: Board;
  currentPiece: Piece | null;
  nextPiece: Piece | null;
  holdPiece: TetrominoType | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  gameStarted: boolean;
  paused: boolean;
}

const initialState: GameState = {
  board: createBoard(),
  currentPiece: null,
  nextPiece: null,
  holdPiece: null,
  canHold: true,
  score: 0,
  level: 1,
  lines: 0,
  gameOver: false,
  gameStarted: false,
  paused: false,
};

export function useTetris() {
  const [state, setState] = useState<GameState>(initialState);
  const bagRef = useRef<TetrominoType[]>([]);
  const dropTimerRef = useRef<number | null>(null);
  const lockDelayRef = useRef<number | null>(null);
  const lockDelayCountRef = useRef(0);
  const MAX_LOCK_DELAY_RESETS = 15;
  const stateRef = useRef(state);
  stateRef.current = state;

  const nextFromBag = useCallback((): TetrominoType => {
    if (bagRef.current.length === 0) {
      bagRef.current = createBag();
    }
    return bagRef.current.shift()!;
  }, []);

  const spawnNext = useCallback((): Piece | null => {
    const type = nextFromBag();
    const piece = spawnPiece(type);
    if (!isValidPosition(stateRef.current.board, piece)) {
      return null; // can't spawn = game over
    }
    return piece;
  }, [nextFromBag]);

  const startDropTimer = useCallback(() => {
    if (dropTimerRef.current) clearInterval(dropTimerRef.current);
    const interval = getDropInterval(stateRef.current.level);
    dropTimerRef.current = window.setInterval(() => {
      const s = stateRef.current;
      if (s.gameOver || s.paused || !s.currentPiece) return;
      moveDown();
    }, interval);
  }, []);

  const moveDown = useCallback((): boolean => {
    const s = stateRef.current;
    if (!s.currentPiece) return false;
    const newPiece = { ...s.currentPiece, y: s.currentPiece.y + 1 };
    if (isValidPosition(s.board, newPiece)) {
      setState(prev => ({ ...prev, currentPiece: newPiece }));
      return true;
    }
    // Can't move down — lock with delay
    if (!lockDelayRef.current) {
      lockDelayRef.current = window.setTimeout(() => {
        lockDelayRef.current = null;
        lockDelayCountRef.current = 0;
        doLock();
      }, 500);
    }
    return false;
  }, []);

  const doLock = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece) return;
    const newBoard = lockPiece(s.board, s.currentPiece);
    const { board: clearedBoard, linesCleared } = clearLines(newBoard);

    const newLines = s.lines + linesCleared;
    const newLevel = getLevel(newLines);
    const lineScore = LINE_SCORES[linesCleared] || 0;
    const newScore = s.score + lineScore * s.level;

    const newState: Partial<GameState> = {
      board: clearedBoard,
      lines: newLines,
      level: newLevel,
      score: newScore,
      canHold: true,
      currentPiece: null,
    };

    if (isGameOver(clearedBoard)) {
      newState.gameOver = true;
      newState.gameStarted = false;
    }

    // Update stateRef with cleared board so spawnNext validates against it
    stateRef.current = { ...s, board: clearedBoard };

    setState(prev => ({ ...prev, ...newState }));

    // Spawn next piece
    if (!newState.gameOver && s.nextPiece) {
      const nextPiece = s.nextPiece;
      const newNext = spawnNext();
      if (!newNext) {
        setState(prev => ({ ...prev, gameOver: true, gameStarted: false }));
      } else {
        setState(prev => ({ ...prev, currentPiece: nextPiece, nextPiece: newNext }));
      }
    }
  }, []);

  const startGame = useCallback(() => {
    bagRef.current = createBag();
    const piece = spawnPiece(nextFromBag());
    const nextPiece = spawnPiece(nextFromBag());

    if (!isValidPosition(createBoard(), piece)) {
      setState(prev => ({ ...prev, gameOver: true }));
      return;
    }

    setState({
      ...initialState,
      board: createBoard(),
      currentPiece: piece,
      nextPiece,
      holdPiece: null,
      canHold: true,
      gameStarted: true,
      gameOver: false,
    });

    startDropTimer();
  }, [nextFromBag, startDropTimer]);

  useEffect(() => {
    return () => {
      if (dropTimerRef.current) clearInterval(dropTimerRef.current);
      if (lockDelayRef.current) clearTimeout(lockDelayRef.current);
    };
  }, []);

  const moveLeft = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || s.gameOver || s.paused) return;
    const newPiece = { ...s.currentPiece, x: s.currentPiece.x - 1 };
    if (isValidPosition(s.board, newPiece)) {
      setState(prev => ({ ...prev, currentPiece: newPiece }));
      // Reset lock delay on successful move (capped to prevent infinite stalling)
      if (lockDelayRef.current && lockDelayCountRef.current < MAX_LOCK_DELAY_RESETS) {
        clearTimeout(lockDelayRef.current);
        lockDelayRef.current = null;
        lockDelayCountRef.current++;
      }
    }
  }, []);

  const moveRight = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || s.gameOver || s.paused) return;
    const newPiece = { ...s.currentPiece, x: s.currentPiece.x + 1 };
    if (isValidPosition(s.board, newPiece)) {
      setState(prev => ({ ...prev, currentPiece: newPiece }));
      if (lockDelayRef.current && lockDelayCountRef.current < MAX_LOCK_DELAY_RESETS) {
        clearTimeout(lockDelayRef.current);
        lockDelayRef.current = null;
        lockDelayCountRef.current++;
      }
    }
  }, []);

  const softDrop = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || s.gameOver || s.paused) return;
    if (moveDown()) {
      setState(prev => ({ ...prev, score: prev.score + SOFT_DROP_SCORE }));
    }
  }, [moveDown]);

  const hardDrop = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || s.gameOver || s.paused) return;
    const ghostY = getGhostY(s.board, s.currentPiece);
    const distance = ghostY - s.currentPiece.y;
    const droppedPiece = { ...s.currentPiece, y: ghostY };
    const newScore = s.score + distance * HARD_DROP_SCORE;

    // Update ref synchronously so doLock sees the correct position & score
    stateRef.current = { ...s, currentPiece: droppedPiece, score: newScore };

    // Clear any pending lock delay
    if (lockDelayRef.current) {
      clearTimeout(lockDelayRef.current);
      lockDelayRef.current = null;
    }
    lockDelayCountRef.current = 0;

    // Commit visual state and lock immediately
    setState(prev => ({ ...prev, currentPiece: droppedPiece, score: newScore }));
    doLock();
  }, [doLock]);

  const rotate = useCallback((direction: 1 | -1) => {
    const s = stateRef.current;
    if (!s.currentPiece || s.gameOver || s.paused) return;
    const piece = s.currentPiece;
    if (piece.type === 'O') return; // O doesn't rotate

    const fromRot = piece.rotation;
    const toRot = ((fromRot + direction) % 4 + 4) % 4;
    const kicks = getKicks(piece.type, fromRot, toRot);

    for (const [dx, dy] of kicks) {
      const newPiece: Piece = {
        ...piece,
        rotation: toRot,
        x: piece.x + dx,
        y: piece.y + dy,
      };
      if (isValidPosition(s.board, newPiece)) {
        setState(prev => ({ ...prev, currentPiece: newPiece }));
        if (lockDelayRef.current && lockDelayCountRef.current < MAX_LOCK_DELAY_RESETS) {
          clearTimeout(lockDelayRef.current);
          lockDelayRef.current = null;
          lockDelayCountRef.current++;
        }
        return;
      }
    }
  }, []);

  const hold = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || !s.canHold || s.gameOver || s.paused) return;

    const currentType = s.currentPiece.type;
    const heldType = s.holdPiece;

    if (heldType) {
      // Swap with held piece
      const newPiece = spawnPiece(heldType);
      if (!isValidPosition(s.board, newPiece)) return;
      setState(prev => ({
        ...prev,
        currentPiece: newPiece,
        holdPiece: currentType,
        canHold: false,
      }));
    } else {
      // First hold — swap with next piece
      const newPiece = s.nextPiece ? { ...s.nextPiece } : null;
      if (newPiece && !isValidPosition(s.board, newPiece)) {
        return; // can't place the next piece at spawn — reject hold
      }
      const newNext = spawnNext();
      if (!newNext) {
        setState(prev => ({ ...prev, holdPiece: currentType, canHold: false }));
        return;
      }
      setState(prev => ({
        ...prev,
        currentPiece: newPiece,
        nextPiece: newNext,
        holdPiece: currentType,
        canHold: false,
      }));
    }
  }, [spawnNext]);

  // Sync drop timer when level changes
  useEffect(() => {
    if (state.gameStarted && !state.gameOver && !state.paused) {
      startDropTimer();
    }
  }, [state.level, state.gameStarted, state.gameOver, state.paused, startDropTimer]);

  const togglePause = useCallback(() => {
    setState(prev => {
      if (!prev.gameStarted || prev.gameOver) return prev;
      return { ...prev, paused: !prev.paused };
    });
  }, []);

  return {
    state,
    startGame,
    moveLeft,
    moveRight,
    softDrop,
    hardDrop,
    rotateCW: () => rotate(1),
    rotateCCW: () => rotate(-1),
    hold,
    togglePause,
    ghostY: state.currentPiece ? getGhostY(state.board, state.currentPiece) : 0,
  };
}
