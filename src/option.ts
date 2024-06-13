// Optional<Someting> = Something | null  | undefined

type None = {
  some: false;
};

type Some<SomeVal> = {
  some: true;
  value: SomeVal;
};

type _Option<SomeVal> = Some<SomeVal> | None;

type Mapper<Old, New> = (value: Old) => New;

interface OptionMethods<SomeVal> {
  isSome(): this is Some<SomeVal>;
  isNone(): this is None;
  map<New>(mapper: Mapper<SomeVal, New>): OptionMethods<New>;
  or(orCase: OptionMethods<SomeVal>): OptionMethods<SomeVal>;
  filter(predicate: (arg: SomeVal) => boolean): OptionMethods<SomeVal>;
  //   Jumps out of option
  unwrap(): SomeVal;
  unwrapOr(backupValue: SomeVal): SomeVal;
}

declare const a: OptionMethods<string>;

export class Option<T> implements OptionMethods<T> {
  option: _Option<T>;

  private constructor(option: _Option<T>) {
    this.option = option;
  }

  //   contructor(option: _Option<T>) {
  //     this.option = option;
  //   }

  isSome(): this is Some<T> {
    return this.option.some;
  }

  isNone(): this is None {
    return !this.option.some;
  }

  map<New>(mapper: Mapper<T, New>): OptionMethods<New> {
    if (!this.option.some) {
      return this as unknown as OptionMethods<New>;
    }

    const result = mapper(this.option.value);

    if (result == null) {
      this.option = { some: false } as never;

      return this as unknown as OptionMethods<New>;
    }

    (this.option.value as unknown as New) = result;

    return this as unknown as OptionMethods<New>;
  }

  static from<V>(value: V | null | undefined): Option<V> {
    if (value != null) {
      return new Option({ some: true, value });
    }

    return new Option({ some: false });
  }

  unwrap(): T {
    if (!this.option.some) {
      throw new Error('Kaboom');
    }

    return this.option.value;
  }

  filter(predicate: (arg: T) => boolean): OptionMethods<T> {
    if (!this.option.some) {
      return this;
    }

    const resultOfPredicate = predicate(this.option.value);

    if (!resultOfPredicate) {
      this.option = { some: false };

      return this;
    }

    return this;
  }

  unwrapOr(backupValue: T): T {
    if (!this.option.some) {
      return backupValue;
    }

    return this.option.value;
  }

  or(orCase: OptionMethods<T>): OptionMethods<T> {
    if (this.option.some) {
      return this;
    }

    return orCase;
  }
}
