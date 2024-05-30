import { expect, describe, it, assert, vi } from 'vitest';
import { Result } from './rust';
import { z } from 'zod';

describe('result', () => {
  describe('unwrap', () => {
    it('returns correctly', () => {
      const value = 'hello';

      const result = Result.Ok(value);

      expect(result.unwrap()).toBe(value);
    });
    it('throws if in error state', () => {
      const value = 'hello';

      const result = Result.Err(value);

      expect(() => result.unwrap()).toThrow();
    });
  });

  describe('unwrapOr', () => {
    it('gets default value in case of error', () => {
      const v = new Error('Kaboom');
      const defaultVal = 123;

      const result = Result.Err(v);

      expect(result.unwrapOr(defaultVal)).toBe(defaultVal);
    });

    it('gets default value in case of error', () => {
      const v = 420;
      const defaultVal = 123;

      const result = Result.Ok(v);

      expect(result.unwrapOr(defaultVal)).not.toBe(defaultVal);
      expect(result.unwrapOr(defaultVal)).toBe(v);
    });
  });

  describe('map', () => {
    it('transforms and maps result', () => {
      const value = 1;

      const result = Result.Ok(value);

      function iterator(v: number) {
        return v + 1;
      }

      const newResult = result.map(iterator);

      assert(newResult.result.ok);
      expect(newResult.result.value).toBe(iterator(value));
    });

    it('does not change if in error state', () => {
      const value = 123;

      const iterator = vi.fn();

      const result = Result.Err(value);

      //   TODO: Look into how to type this
      const newResult = result.map(iterator);

      assert(!newResult.result.ok);

      expect(newResult.result.err).toBe(value);
      expect(iterator).not.toBeCalled();
    });
  });

  describe('mapError', () => {
    it('transforms and maps result (Err)', () => {
      const value = 1;
      const err = new Error('Oaky didnt read');

      const result = Result.Err(value);

      const newResult = result.mapError(err);
      console.log('newResult:', newResult);

      assert(!newResult.result.ok);
      expect(newResult.result.err).toBe(err);
    });

    it('does not change if in ok state', () => {
      const value = 123;

      const iterator = vi.fn().mockImplementation((v) => v + 1);

      const result = Result.Ok(value);

      //   TODO: Look into how to type this
      const newResult = result.map(iterator);

      assert(newResult.result.ok);
      expect(iterator).toHaveBeenCalledOnce();

      expect(newResult.result.value).toBe(iterator(value));
    });
  });

  describe('fromFn', () => {
    it('becomes an Ok if function succeedes AND is not null', () => {
      const func = vi.fn().mockImplementation(() => true);

      const result = Result.fromFn(func, {});

      assert(result.result.ok);

      expect(func).toHaveBeenCalledOnce();
    });

    it('becomes an ERR if function succeedes AND is  null', () => {
      const func = vi.fn().mockImplementation(() => null);
      const fallback = new Error('Ryan did good');

      const result = Result.fromFn(func, fallback);

      assert(!result.result.ok);

      expect(func).toHaveBeenCalledOnce();
      expect(result.result.err).toEqual(fallback);
    });

    it('becomes an ERR if function succeedes AND is undefined', () => {
      const func = vi.fn().mockImplementation(() => undefined);
      const fallback = new Error('Ryan did good');

      const result = Result.fromFn(func, fallback);

      assert(!result.result.ok);

      expect(func).toHaveBeenCalledOnce();
      expect(result.result.err).toEqual(fallback);
    });

    it('becomes an ERR if function fails', () => {
      const fallback = new Error('Ryan did good');
      const func = vi.fn().mockImplementation(() => {
        throw fallback;
      });

      const anotherFallbackError = new Error('Ryan did good again');

      const result = Result.fromFn(func, anotherFallbackError);

      assert(!result.result.ok);

      expect(func).toHaveBeenCalledOnce();
      expect(result.result.err).toEqual(anotherFallbackError);
    });
  });

  describe('fromAsyncFn', () => {
    it('becomes an Ok if function succeedes AND is not null', async () => {
      const func = vi.fn().mockResolvedValue(true);

      const result = await Result.fromAsyncFn(func, {});

      assert(result.result.ok);

      expect(func).toHaveBeenCalledOnce();
    });

    it('becomes an ERR if function succeedes AND is  null', async () => {
      const func = vi.fn().mockResolvedValue(null);
      const fallback = new Error('Ryan did good');

      const result = await Result.fromAsyncFn(func, fallback);

      assert(!result.result.ok);

      expect(func).toHaveBeenCalledOnce();
      expect(result.result.err).toEqual(fallback);
    });

    it('becomes an ERR if function succeedes AND is undefined', async () => {
      const func = vi.fn().mockResolvedValue(undefined);
      const fallback = new Error('Ryan did good');

      const result = await Result.fromAsyncFn(func, fallback);

      assert(!result.result.ok);

      expect(func).toHaveBeenCalledOnce();
      expect(result.result.err).toEqual(fallback);
    });

    it('becomes an ERR if function fails', async () => {
      const fallback = new Error('Ryan did good');
      const func = vi.fn().mockRejectedValue(fallback);

      const anotherFallbackError = new Error('Ryan did good again');

      const result = await Result.fromAsyncFn(func, anotherFallbackError);

      assert(!result.result.ok);

      expect(func).toHaveBeenCalledOnce();
      expect(result.result.err).toEqual(anotherFallbackError);
    });
  });

  describe('AsyncResult', () => {
    it('works?', async () => {
      const r = Result.Ok(123);

      const newR = r
        .mapAsync(async () => {
          return true;
        })
        .mapAsync(async (v) => {
          await new Promise<void>((r) => setTimeout(r, 1000));

          return String(v);
        })
        .mapAsync(async (s) => {
          await new Promise<void>((r) => setTimeout(r, 100));

          return s.length;
        });
      console.log('newR:', newR);

      class RyanError extends Error {
        isInheritanceGood = false as const;
      }

      const value = await newR.collect(new RyanError());
      assert(value.result.ok);
    });

    it('chains', async () => {
      const result = await Result.Ok('which string?')
        .mapAsync(async (v) => {
          await wait();

          return v.length;
        })
        .mapAsync(async (num) => {
          const result = await fetch(
            'https://jsonplaceholder.typicode.com/posts/' + num,
          );
          return result.json();
        })
        .mapSync(async (jsonResult) => {
          return z
            .object({
              id: z.number().int(),
              title: z.string().trim().min(1),
              body: z.string().trim().min(1),
              userId: z.number().int(),
            })
            .parse(jsonResult);
        })
        .collect(new Error('API FAILED'));
      assert(result.result.ok);
    });

    it('chains and potentially fails', async () => {
      const err = new Error('API FAILED');
      const result = await Result.Ok('which string?')
        .mapAsync(async (v) => {
          await wait();

          return v.length;
        })
        .mapAsync(async (num) => {
          const result = await fetch('sdfkugdsfgkjhsdfkjghsdfgjkh/' + num);
          return result.json();
        })
        .mapSync(async (jsonResult) => {
          return z
            .object({
              id: z.number().int(),
              title: z.string().trim().min(1),
              body: z.string().trim().min(1),
              userId: z.number().int(),
            })
            .parse(jsonResult);
        })
        .collect(err);

      assert(!result.result.ok);
      expect(result.result.err).toEqual(err);
    });
  });
});

async function wait(time = 30) {
  return new Promise<void>((r) => setTimeout(r, time));
}
