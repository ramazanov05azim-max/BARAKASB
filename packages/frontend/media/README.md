# Browser media

Owns the replaceable browser-side media repository and image normalization policy.
Business entities store only `MediaAssetId`; binary content and metadata are isolated
from Solution state.

The local prototype uses IndexedDB database `barakasb.media.v1`, version `1`, with two
stores:

- `media-assets` — typed metadata keyed by asset ID;
- `media-binaries` — normalized `Blob` content keyed by asset ID.

Both records carry `projectId`, and every read validates the requested Project. No
binary or Base64 payload is written to `localStorage`.

## Image policy

- accepted input: JPEG, PNG, and WebP;
- maximum input size: 10 MiB;
- maximum stored width or height: 1600 px;
- output: WebP at quality `0.82`;
- small images are never upscaled;
- browser decoding applies embedded orientation when supported.

Resolved object URLs are leases. Consumers must call `release()` when a preview is
replaced or unmounted. The contract is reusable by Solution and Plugin UI; a future
backend adapter may replace IndexedDB without changing consumers.
