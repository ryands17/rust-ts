type Maybe<T> = T | null | undefined;

type Ok<T> = { ok: true; value: T };
const Ok = <T>(value: T): Ok<T> => ({ ok: true, value });

type Err<E> = { ok: false; err: E };
const Err = <E>(err: E): Err<E> => ({ ok: false, err });

type _Result<T, E> = Ok<T> | Err<E>;

export class Result<T, E> {
  readonly result: _Result<T, E>;

  private constructor(value: _Result<T, E>) {
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
