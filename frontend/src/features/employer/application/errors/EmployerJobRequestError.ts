export type EmployerJobFieldErrors = Record<string, string[]>;

export class EmployerJobRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly fieldErrors: EmployerJobFieldErrors = {},
  ) {
    super(message);
    this.name = "EmployerJobRequestError";
  }
}
