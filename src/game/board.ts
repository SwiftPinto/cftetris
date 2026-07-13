import { BOARD_WIDTH, TOTAL_HEIGHT, HIDDEN_ROWS } from './constants';
import { SHAPES } from './tetrominos';

export type Board = number[][];

export function createBoard(): Board {
  return Array.from({ length: TOTAL_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
}

export interface Piece {
  type: import('./constants').TetrominoType;
  rotation: number;
  x: number; // column of top-left corner
  y: number; // row of top-left corner (0 = top hidden row)
}

export function getShape(piece: Piece): number[][] {
  return SHAPES[piece.type][piece.rotation];
}

export function isValidPosition(board: Board, piece: Piece): boolean {
  const shape = getShape(piece);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const br = piece.y + r;
      const bc = piece.x + c;
      if (bc < 0 || bc >= BOARD_WIDTH || br >= TOTAL_HEIGHT) return false;
      if (br < 0) continue; // above board is OK
      if (board[br][bc]) return false;
    }
  }
  return true;
}

export function lockPiece(board: Board, piece: Piece): Board {
  const newBoard = board.map(row => [...row]);
  const shape = getShape(piece);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const br = piece.y + r;
      const bc = piece.x + c;
      if (br >= 0 && br < TOTAL_HEIGHT && bc >= 0 && bc < BOARD_WIDTH) {
        newBoard[br][bc] = piece.type.charCodeAt(0); // store piece type for coloring
      }
    }
  }
  return newBoard;
}

export function clearLines(board: Board): { board: Board; linesCleared: number } {
  const newBoard = board.filter(row => row.some(cell => cell === 0));
  const linesCleared = TOTAL_HEIGHT - newBoard.length;
  while (newBoard.length < TOTAL_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0));
  }
  return { board: newBoard, linesCleared };
}

export function getGhostY(board: Board, piece: Piece): number {
  let ghostY = piece.y;
  while (isValidPosition(board, { ...piece, y: ghostY + 1 })) {
    ghostY++;
  }
  return ghostY;
}

export function isGameOver(board: Board): boolean {
  // Game over if any cells in the hidden rows are filled
  for (let r = 0; r < HIDDEN_ROWS; r++) {
    if (board[r].some(cell => cell !== 0)) return true;
  }
  return false;
}

export function spawnPiece(type: import('./constants').TetrominoType): Piece {
  const shape = SHAPES[type][0];
  const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
  const y = HIDDEN_ROWS - shape.length; // spawn above visible area
  return { type, rotation: 0, x, y };
}
