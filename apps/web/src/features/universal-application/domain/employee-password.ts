export interface PasswordCredential {
  readonly algorithm: 'PBKDF2-SHA256';
  readonly salt: string;
  readonly iterations: number;
  readonly digest: string;
  readonly updatedAt: string;
}

const defaultIterations = 120_000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(value: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})+$/iu.test(value)) {
    throw new Error('invalid-password-credential-salt');
  }
  return Uint8Array.from(
    value.match(/.{2}/gu)?.map((pair) => Number.parseInt(pair, 16)) ?? [],
  );
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<string> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt as BufferSource,
      iterations,
    },
    material,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function createPasswordCredential(
  password: string,
  options: {
    readonly iterations?: number;
    readonly salt?: Uint8Array;
    readonly now?: () => string;
  } = {},
): Promise<PasswordCredential> {
  const normalized = password.normalize('NFKC');
  if (normalized.length < 4 || normalized.length > 128) {
    throw new Error('invalid-employee-password');
  }
  const salt = options.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const iterations = options.iterations ?? defaultIterations;
  return {
    algorithm: 'PBKDF2-SHA256',
    salt: bytesToHex(salt),
    iterations,
    digest: await derive(normalized, salt, iterations),
    updatedAt: (options.now ?? (() => new Date().toISOString()))(),
  };
}

export async function verifyPasswordCredential(
  password: string,
  credential: PasswordCredential,
): Promise<boolean> {
  if (
    credential.algorithm !== 'PBKDF2-SHA256' ||
    !Number.isSafeInteger(credential.iterations) ||
    credential.iterations <= 0
  ) {
    return false;
  }
  try {
    const actual = await derive(
      password.normalize('NFKC'),
      hexToBytes(credential.salt),
      credential.iterations,
    );
    if (actual.length !== credential.digest.length) return false;
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) {
      difference |= actual.charCodeAt(index) ^ credential.digest.charCodeAt(index);
    }
    return difference === 0;
  } catch {
    return false;
  }
}
