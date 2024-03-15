# TS Rust

A Rust like typesystem for TypeScript for better error handling. `try/catch` is not a great flow to handle errors and as the caller of a function we don't know if the function throws. This library exposes types for success and failure responses (`Ok` and `Err` respectively) so that we have errors as types.

## Enhancements

- [ ] Create an `asyncMap` function which is a lazy async
- [ ] Have a `collect` method that performs the collection of either success or error values
