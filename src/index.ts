import { z } from 'zod';
import { match } from 'ts-pattern';
import { Result } from './rust.js';
import { UsersNotFound, tsFetch } from './utils.js';

const numbers = [1, 2, 3, 4, 5];

// constructor test
const num = Result.Ok(1);
if (num.result.ok) {
  console.log(num.result.value);
}

// from a function (mostly used)
const val = Result.fromFn(
  () => numbers.find((n) => n === 2),
  'number not found',
);

// unwrapOr for a default value instead of throwing
console.log(val.unwrapOr(-1));

// map to different values
const str = Result.Ok(123)
  .map((x) => x.toString())
  .mapError('string not found!')
  .map((x) => x.split('').reverse().join());

console.log(str.unwrapOr(''));

// use async functions
const API_URL = 'https://jsonplaceholder.typicode.com/users';
const users = await Result.fromAsyncFn(
  () =>
    tsFetch(z.array(z.object({ id: z.number(), name: z.string() })), API_URL),
  new UsersNotFound(API_URL),
);

// pattern matching
match(users.result)
  .with({ ok: true }, (res) => {
    // do whatever you want with the result
    const users = res.value;
    users.push({ id: 3, name: 'def' });
  })
  .with({ ok: false }, (res) => console.error(res.err))
  .exhaustive();
