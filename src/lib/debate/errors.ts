export class DebateStepError extends Error {
  constructor(message: string, public retryable: boolean) {
    super(message);
  }
}
