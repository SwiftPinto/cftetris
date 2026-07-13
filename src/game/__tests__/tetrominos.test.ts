import { describe, it, expect } from 'vitest';
import { SHAPES, createBag, PIECE_TYPES } from '../tetrominos';

describe('SHAPES', () => {
  it('has all 7 piece types', () => {
    expect(Object.keys(SHAPES).sort()).toEqual(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
  });

  it('each piece has exactly 4 rotation states', () => {
    for (const type of PIECE_TYPES) {
      expect(SHAPES[type]).toHaveLength(4);
    }
  });

  it('all shapes are 2D arrays of 0s and 1s', () => {
    for (const type of PIECE_TYPES) {
      for (let rot = 0; rot < 4; rot++) {
        const shape = SHAPES[type][rot];
        expect(Array.isArray(shape)).toBe(true);
        for (const row of shape) {
          expect(Array.isArray(row)).toBe(true);
          for (const cell of row) {
            expect([0, 1]).toContain(cell);
          }
        }
      }
    }
  });

  it('O piece is identical in all 4 rotations', () => {
    const rot0 = SHAPES['O'][0];
    expect(SHAPES['O'][1]).toEqual(rot0);
    expect(SHAPES['O'][2]).toEqual(rot0);
    expect(SHAPES['O'][3]).toEqual(rot0);
  });

  it('I piece has correct rotation 0 (horizontal)', () => {
    expect(SHAPES['I'][0]).toEqual([
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
  });

  it('I piece has correct rotation 1 (vertical)', () => {
    expect(SHAPES['I'][1]).toEqual([
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ]);
  });

  it('T piece rotation 0 has correct shape', () => {
    expect(SHAPES['T'][0]).toEqual([
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ]);
  });

  it('each piece has exactly 4 filled cells', () => {
    for (const type of PIECE_TYPES) {
      for (let rot = 0; rot < 4; rot++) {
        const count = SHAPES[type][rot]
          .flat()
          .reduce((sum, c) => sum + c, 0);
        expect(count).toBe(4);
      }
    }
  });
});

describe('createBag', () => {
  it('returns an array of 7 pieces', () => {
    const bag = createBag();
    expect(bag).toHaveLength(7);
  });

  it('contains exactly one of each piece type', () => {
    const bag = createBag();
    expect([...bag].sort()).toEqual(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
  });

  it('produces different orderings (statistical check)', () => {
    // Run many bags and check that not all are the same order
    const orders = new Set<string>();
    for (let i = 0; i < 50; i++) {
      orders.add(createBag().join(''));
    }
    // With 7! = 5040 permutations, 50 runs should produce >1 unique order
    expect(orders.size).toBeGreaterThan(1);
  });

  it('does not mutate the PIECE_TYPES source array', () => {
    const original = [...PIECE_TYPES];
    createBag();
    expect(PIECE_TYPES).toEqual(original);
  });
});
