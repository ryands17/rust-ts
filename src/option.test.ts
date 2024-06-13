import { assert, describe, expect, it } from 'vitest';
import { Option } from './option';
import { aN } from 'vitest/dist/reporters-yx5ZTtEV.js';

describe('option', () => {
  it('maps', () => {
    const startingValue = 1;

    const starting = Option.from(startingValue);

    function mapper(num: number) {
      return num + 1;
    }

    const mapped = starting.map(mapper);

    assert(mapped.isSome());

    expect(mapped.unwrap()).toBe(mapper(startingValue));
  });

  describe('filtering', () => {
    function isEven(num: number): boolean {
      return num % 2 == 0;
    }

    type TestCases = {
      starting: number | null | undefined;
      isSome: boolean;
      description: string;
    };

    const testCases: Array<TestCases> = [
      {
        description: 'When is even',
        isSome: true,
        starting: 4,
      },
      {
        description: 'When is odd',
        isSome: false,
        starting: 3,
      },
      {
        description: 'When is null',
        isSome: false,
        starting: null,
      },

      { description: 'When is undefined', isSome: false, starting: undefined },
    ];

    for (const tc of testCases) {
      it(`Option value: -> ${tc.description}`, () => {
        const option = Option.from(tc.starting);

        const mapped = option.filter(isEven);

        expect(mapped.isSome()).toBe(tc.isSome);
      });
    }
  });

  describe('unwrapsOr', () => {
    it('returns inner value', () => {
      const starting = 1;
      const option = Option.from(1);

      const backup = 5;

      const final = option.unwrapOr(backup);

      expect(final).toBe(starting);
    });

    it('returns backup value', () => {
      const option = Option.from<number>(null);

      const backup = 5;

      const final = option.unwrapOr(backup);

      expect(final).toBe(backup);
    });
  });

  describe('or', () => {
    it('returns the backup or', () => {
      const anOption = Option.from<number>(null);

      const backup = Option.from<number>(5);

      const newOption = anOption.or(backup);

      expect(newOption).toEqual(backup);
    });

    it('does not change anything', () => {
      const anOption = Option.from(5);

      const backup = Option.from(10);

      const newOption = anOption.or(backup);

      expect(newOption).toEqual(anOption);
    });
  });
});
