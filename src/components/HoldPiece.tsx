import { SHAPES } from '../game/tetrominos';
import { PIECE_COLORS, TetrominoType } from '../game/constants';

interface HoldPieceProps {
  type: TetrominoType | null;
  canHold: boolean;
}

const CELL = 20;
const BOX = 5;

export default function HoldPiece({ type, canHold }: HoldPieceProps) {
  return (
    <div className="panel">
      <h3>HOLD</h3>
      <div style={{
        width: BOX * CELL,
        height: BOX * CELL,
        position: 'relative',
        opacity: canHold ? 1 : 0.4,
      }}>
        {type && (() => {
          const shape = SHAPES[type][0];
          const rows = shape.length;
          const cols = shape[0].length;
          const offsetX = Math.floor((BOX - cols) / 2);
          const offsetY = Math.floor((BOX - rows) / 2);
          const color = PIECE_COLORS[type];

          return shape.map((row, r) =>
            row.map((cell, c) =>
              cell ? (
                <div
                  key={`${r}-${c}`}
                  style={{
                    position: 'absolute',
                    left: (offsetX + c) * CELL + 1,
                    top: (offsetY + r) * CELL + 1,
                    width: CELL - 2,
                    height: CELL - 2,
                    backgroundColor: color,
                    borderTop: '2px solid rgba(255,255,255,0.3)',
                    borderLeft: '2px solid rgba(255,255,255,0.3)',
                    borderBottom: '2px solid rgba(0,0,0,0.3)',
                    borderRight: '2px solid rgba(0,0,0,0.3)',
                  }}
                />
              ) : null
            )
          );
        })()}
      </div>
    </div>
  );
}
