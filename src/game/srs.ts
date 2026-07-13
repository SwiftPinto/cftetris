import { TetrominoType } from './constants';

// SRS wall kick data
// Each entry: [rotation from][rotation to] = array of [dx, dy] offsets to try
// dx = column offset (positive = right)
// dy = row offset (negative = up, since row 0 is top)

type KickTable = Record<string, [number, number][]>;

// Wall kicks for J, L, S, T, Z pieces
export const JLSTZ_KICKS: KickTable = {
  '0>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '1>0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '1>2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '2>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '2>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '3>2': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '3>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '0>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};

// Wall kicks for I piece
export const I_KICKS: KickTable = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '1>0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
  '2>1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '3>2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '0>3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
};

export function getKicks(type: TetrominoType, fromRot: number, toRot: number): [number, number][] {
  const key = `${fromRot}>${toRot}`;
  if (type === 'I') return I_KICKS[key] || [[0, 0]];
  if (type === 'O') return [[0, 0]]; // O piece doesn't kick
  return JLSTZ_KICKS[key] || [[0, 0]];
}
