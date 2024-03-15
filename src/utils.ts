import fetch from 'node-fetch';

export async function tsFetch<Data>(
  schema: { parse: (value: unknown) => Data },
  ...args: Parameters<typeof fetch>
) {
  const raw = await fetch(...args);
  const res = await raw.json();

  return schema.parse(res);
}

export class UsersNotFound extends Error {
  cause: any;

  constructor(api?: string, cause?: any) {
    super();
    this.message = `Users not found from API: ${api}`;
    this.cause = cause;

    Object.setPrototypeOf(this, UsersNotFound.prototype);
  }
}
