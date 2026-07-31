export interface ConfigSource {
  get(key: string): string | undefined;
}

export class RecordConfigSource implements ConfigSource {
  readonly #values: Readonly<Record<string, string | undefined>>;

  constructor(values: Readonly<Record<string, string | undefined>>) {
    this.#values = Object.freeze({ ...values });
  }

  get(key: string): string | undefined {
    return this.#values[key];
  }
}
