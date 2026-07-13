import { describe, it, expect } from 'vitest';
import { getKicks, JLSTZ_KICKS, I_KICKS } from '../srs';

describe('getKicks', () => {
  describe('O piece (no rotation)', () => {
    it('returns only (0,0) for any rotation change', () => {
      expect(getKicks('O', 0, 1)).toEqual([[0, 0]]);
      expect(getKicks('O', 1, 2)).toEqual([[0, 0]]);
      expect(getKicks('O', 3, 0)).toEqual([[0, 0]]);
    });
  });

  describe('I piece wall kicks', () => {
    it('returns correct kicks for I 0>1', () => {
      expect(getKicks('I', 0, 1)).toEqual(I_KICKS['0>1']);
    });

    it('all I kicks include (0,0) as first test', () => {
      for (const key of Object.keys(I_KICKS)) {
        expect(I_KICKS[key][0]).toEqual([0, 0]);
      }
    });

    it('each I kick entry has exactly 5 tests', () => {
      for (const key of Object.keys(I_KICKS)) {
        expect(I_KICKS[key]).toHaveLength(5);
      }
    });

    it('covers all 8 rotation transitions', () => {
      const transitions = ['0>1', '1>0', '1>2', '2>1', '2>3', '3>2', '3>0', '0>3'];
      for (const t of transitions) {
        expect(I_KICKS[t]).toBeDefined();
        expect(I_KICKS[t].length).toBeGreaterThan(0);
      }
    });
  });

  describe('JLSTZ wall kicks', () => {
    it('returns correct kicks for T piece', () => {
      expect(getKicks('T', 0, 1)).toEqual(JLSTZ_KICKS['0>1']);
      expect(getKicks('T', 1, 2)).toEqual(JLSTZ_KICKS['1>2']);
    });

    it('returns same kick table for J, L, S, T, Z', () => {
      const types = ['J', 'L', 'S', 'T', 'Z'] as const;
      for (const type of types) {
        expect(getKicks(type, 0, 1)).toEqual(JLSTZ_KICKS['0>1']);
        expect(getKicks(type, 1, 0)).toEqual(JLSTZ_KICKS['1>0']);
      }
    });

    it('all JLSTZ kicks include (0,0) as first test', () => {
      for (const key of Object.keys(JLSTZ_KICKS)) {
        expect(JLSTZ_KICKS[key][0]).toEqual([0, 0]);
      }
    });

    it('each JLSTZ kick entry has exactly 5 tests', () => {
      for (const key of Object.keys(JLSTZ_KICKS)) {
        expect(JLSTZ_KICKS[key]).toHaveLength(5);
      }
    });

    it('covers all 8 rotation transitions', () => {
      const transitions = ['0>1', '1>0', '1>2', '2>1', '2>3', '3>2', '3>0', '0>3'];
      for (const t of transitions) {
        expect(JLSTZ_KICKS[t]).toBeDefined();
        expect(JLSTZ_KICKS[t].length).toBeGreaterThan(0);
      }
    });
  });

  describe('unknown rotations', () => {
    it('returns (0,0) for out-of-range rotations', () => {
      expect(getKicks('T', 0, 4)).toEqual([[0, 0]]);
      expect(getKicks('I', 5, 3)).toEqual([[0, 0]]);
    });
  });
});
