import { unknown } from 'zod';

type Maybe<T> = T | null | undefined;

type Ok<T> = { ok: true; value: T };
const Ok = <T>(value: T): Ok<T> => ({ ok: true, value });

type Err<E> = { ok: false; err: E };
const Err = <E>(err: E): Err<E> => ({ ok: false, err });

type _Result<T, E> = Ok<T> | Err<E>;

type TResult<T, E> = {
  unwrap(): T;
  unwrapOr(defaultValue: T): T;
};

type Mapper<T, E> = <T2>(func: (prev: T) => T2) => AsyncResultMethods<T2, E>;

export class Result<T, E> {
  readonly result: _Result<T, E>;

  protected constructor(value: _Result<T, E>) {
    this.result = value;
  }

  unwrap() {
    if (this.result.ok) {
      return this.result.value;
    }
    throw this.result.err;
  }

  unwrapOr(defaultValue: T) {
    return this.result.ok ? this.result.value : defaultValue;
  }

  map<T2>(mapper: (val: T) => T2): Result<T2, E> {
    if (this.result.ok) {
      return new Result(Ok(mapper(this.result.value)));
    }

    return new Result(this.result);
  }

  mapError<E2>(error: E2): Result<T, E2> {
    if (this.result.ok) {
      return new Result(this.result);
    }
    return new Result(Err(error));
  }

  mapAsync<T2>(mapper: (value: T) => Promise<T2>): IAsyncResultMethods<T2, E> {
    return new AsyncResultMethods(
      mapper,
      this.result as unknown as _Result<T2, E>,
    );
  }

  static Ok<T>(val: T) {
    return new Result(Ok(val));
  }

  static Err<E>(err: E) {
    return new Result(Err(err));
  }

  static fromFn<T, E>(fn: () => Maybe<T>, error: E): Result<T, E> {
    try {
      const val = fn();
      const result = Result.stripNullAndUndefined(val) ? Ok(val) : Err(error);
      return new Result(result);
    } catch (_error) {
      console.log(_error);
      return new Result(Err(error));
    }
  }

  static async fromAsyncFn<T, E>(
    fn: () => Promise<Maybe<T>>,
    error: E,
  ): Promise<Result<T, E>> {
    try {
      const val = await fn();
      return Result.fromFn(() => val, error);
    } catch (_error) {
      console.error(_error);
      return new Result(Err(error));
    }
  }

  private static stripNullAndUndefined<T>(val: Maybe<T>): val is T {
    return val !== undefined && val !== null;
  }
}

class AsyncResultMethods<T, E>
  extends Result<T, E>
  implements IAsyncResultMethods<T, E>
{
  memory: Array<(v: T) => Promise<unknown> | unknown> = [];
  state: _Result<T, E>;

  constructor(func: (v: any) => Promise<T>, state: _Result<T, E>) {
    super(state);
    this.memory.push(func);
    this.state = state;
  }

  mapAsync<T2>(mapper: (value: T) => Promise<T2>) {
    this.memory.push(mapper);
    return this as unknown as IAsyncResultMethods<T2, E>;
  }

  async collect<E2>(fallbackErr: E2): Promise<Result<T, E2>> {
    for (const iteration of this.memory) {
      if (!this.state.ok) {
        continue;
      }

      const value = this.state.value;

      const result = await Result.fromAsyncFn(
        () => iteration(value) as Promise<T>,
        fallbackErr,
      );
      if (!result.result.ok) {
        return new Result(result.result);
      }
      this.state = result.result as unknown as _Result<T, E>;
    }

    return new Result(this.state) as never;
  }

  mapSync<T2>(mapper: (prev: T) => T2): IAsyncResultMethods<T2, E> {
    this.memory.push(mapper);
    return this as unknown as IAsyncResultMethods<T2, E>;
  }
}

type IAsyncResultMethods<T, E> = {
  mapSync<T2>(mapper: (prev: T) => T2): IAsyncResultMethods<T2, E>;
  mapAsync<T2>(maper: (value: T) => Promise<T2>): IAsyncResultMethods<T2, E>;
  collect<E2>(fallbackErr: E2): Promise<Result<T, E2>>;
};

// function hello() {
//   let value = 1

// const r = Result.Ok(true)

// const asyncResult = r.mapAsync(async () => {
//   value++
// })

// value+=743 // 1003

// asyncResult.map(v => v+ value).mapAsync(() => {
//   value+=70

// })

// }
