import { useCallback, useEffect, useRef } from 'react';
import type { Board as BoardType, Piece } from '../game/board';
import { getShape } from '../game/board';
import { BOARD_WIDTH, VISIBLE_HEIGHT, HIDDEN_ROWS, PIECE_COLORS, PIECE_COLORS_DIM } from '../game/constants';
import type { TetrominoType } from '../game/constants';

interface BoardProps {
  board: BoardType;
  currentPiece: Piece | null;
  ghostY: number;
  gameOver: boolean;
  paused: boolean;
  onRestart: () => void;
}

const CELL_SIZE = 30;
const GRID_COLOR = '#1a1a3e';
const BOARD_BG = '#0a0a1a';

function getPieceColor(cellValue: number): string {
  if (cellValue === 0) return 'transparent';
  const type = String.fromCharCode(cellValue) as TetrominoType;
  return PIECE_COLORS[type] || '#fff';
}

export default function Board({ board, currentPiece, ghostY, gameOver, paused, onRestart }: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = BOARD_WIDTH * CELL_SIZE;
    const height = VISIBLE_HEIGHT * CELL_SIZE;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= VISIBLE_HEIGHT; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(width, r * CELL_SIZE);
      ctx.stroke();
    }
    for (let c = 0; c <= BOARD_WIDTH; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, height);
      ctx.stroke();
    }

    // Draw locked cells (visible rows only)
    for (let r = 0; r < VISIBLE_HEIGHT; r++) {
      for (let c = 0; c < BOARD_WIDTH; c++) {
        const boardRow = r + HIDDEN_ROWS;
        const cell = board[boardRow]?.[c];
        if (cell) {
          const color = getPieceColor(cell);
          drawCell(ctx, c, r, color, 1);
        }
      }
    }

    // Draw ghost piece
    if (currentPiece && !gameOver) {
      const shape = getShape(currentPiece);
      const ghostColor = PIECE_COLORS_DIM[currentPiece.type];
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const px = currentPiece.x + c;
          const py = ghostY + r - HIDDEN_ROWS;
          if (py >= 0 && py < VISIBLE_HEIGHT && px >= 0 && px < BOARD_WIDTH) {
            drawCell(ctx, px, py, ghostColor, 0.3);
          }
        }
      }
    }

    // Draw current piece
    if (currentPiece && !gameOver) {
      const shape = getShape(currentPiece);
      const color = PIECE_COLORS[currentPiece.type];
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const px = currentPiece.x + c;
          const py = currentPiece.y + r - HIDDEN_ROWS;
          if (py >= 0 && py < VISIBLE_HEIGHT && px >= 0 && px < BOARD_WIDTH) {
            drawCell(ctx, px, py, color, 1);
          }
        }
      }
    }

    // Pause overlay
    if (paused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.font = '24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', width / 2, height / 2 - 10);
      ctx.fillStyle = '#fff';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('Press P to resume', width / 2, height / 2 + 20);
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.font = '24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', width / 2, height / 2 - 15);
      ctx.fillStyle = '#fff';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('Press ENTER or', width / 2, height / 2 + 20);
      ctx.fillText('click to restart', width / 2, height / 2 + 36);
    }
  }, [board, currentPiece, ghostY, gameOver, paused]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      onClick={gameOver ? onRestart : undefined}
      style={{
        border: '2px solid #333',
        borderRadius: 4,
        cursor: gameOver ? 'pointer' : 'default',
        imageRendering: 'pixelated',
      }}
    />
  );
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  color: string,
  alpha: number
) {
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  // Highlight (top-left bevel)
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, 2);
  ctx.fillRect(x + 1, y + 1, 2, CELL_SIZE - 2);
  // Shadow (bottom-right bevel)
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 1, y + CELL_SIZE - 3, CELL_SIZE - 2, 2);
  ctx.fillRect(x + CELL_SIZE - 3, y + 1, 2, CELL_SIZE - 2);
  ctx.globalAlpha = 1;
}
