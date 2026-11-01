export class AdminDashboardRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "AdminDashboardRequestError";
  }
}
