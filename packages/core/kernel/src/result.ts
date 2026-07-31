export type Result<Value, Failure> =
  Readonly<{ ok: true; value: Value }> | Readonly<{ ok: false; error: Failure }>;

export const ok = <Value>(value: Value): Result<Value, never> =>
  Object.freeze({ ok: true, value });

export const err = <Failure>(error: Failure): Result<never, Failure> =>
  Object.freeze({ ok: false, error });

export function unwrap<Value, Failure>(result: Result<Value, Failure>): Value {
  if (result.ok) {
    return result.value;
  }

  throw result.error;
}

export interface ApplicationError {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}
