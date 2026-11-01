export type FieldErrors = Record<string, string[]>;

export class AuthRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = "AuthRequestError";
  }
}
