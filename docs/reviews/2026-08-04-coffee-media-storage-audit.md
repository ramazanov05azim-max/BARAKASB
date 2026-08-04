# Coffee image storage audit and local media correction

- **Date:** 2026-08-04
- **Scope:** Coffee menu-item image upload and local prototype persistence
- **Outcome:** Corrected without a new application, deployable, composition root, or
  backend dependency

## Previous implementation

The menu-item image field used `FileReader.readAsDataURL`. The complete `data:` URL,
including Base64 image bytes, was assigned to `MenuItem.imagePlaceholder` and serialized
inside the Coffee Project snapshot.

| Audit question         | Finding                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| Physical storage       | Browser `localStorage`                                                  |
| Key                    | `barakasb.mock.coffee.project.v1.<encodedProjectId>`                    |
| Stored format          | JSON field containing a Base64 `data:` URL                              |
| Menu-item value        | Complete image payload in `imagePlaceholder`                            |
| Size limit             | None                                                                    |
| MIME validation        | None; the file input accepted `image/*`                                 |
| Refresh survival       | Yes, because the payload was part of the persisted Project JSON         |
| Project isolation      | Snapshot keys were partitioned by Project ID                            |
| Replace/delete orphans | No separate orphan existed; the embedded string was replaced or removed |
| Object URL lifecycle   | Not applicable; the old control used data URLs                          |

This model carried a high quota-exhaustion risk. Base64 expands binary data by roughly
one third, and `localStorage` commonly has a small synchronous per-origin quota. A few
phone-camera images could prevent all Coffee Project state from being written.

## Corrected model

`MenuItem` and `MenuCategory` now store only a typed `MediaAssetId` in `imageAssetId`.
Generic `MediaAsset` metadata is declared in `@barakasb/contracts-platform`. The browser
repository and normalization service live in `@barakasb/frontend-media`; Coffee depends
on those public contracts and does not own media binary persistence.

The local adapter uses IndexedDB database `barakasb.media.v1`, version `1`:

- `media-assets` stores typed metadata;
- `media-binaries` stores normalized `Blob` content.

Both stores are keyed by media asset ID, records carry `projectId`, and resolution
rejects a request from another Project. `localStorage` contains only the small
`imageAssetId` reference as part of the Coffee entity.

## Upload and lifecycle

Upload validates the file, normalizes it, persists the media asset, and returns the
reference used by the menu item. Preview resolution returns an object-URL lease with a
mandatory `release()` method. The React control releases the URL when the reference
changes or the control unmounts.

Replacement updates the menu-item reference before attempting orphan cleanup. Removal
clears the reference and deletes the asset only when no menu item still references it.
An asset shared by multiple menu items is preserved until the last reference is gone.
Project deletion removes that Project's media records.

## Normalization policy

- accepted input MIME types: `image/jpeg`, `image/png`, `image/webp`;
- maximum input size: 10 MiB;
- maximum stored dimension: 1600 px on the longest edge;
- output format: WebP;
- quality: `0.82`;
- small images are not upscaled;
- `createImageBitmap` requests embedded-orientation correction when available;
- an `Image` fallback is used where `createImageBitmap` is unavailable.

## Migration

On Coffee snapshot load, legacy menu-item and menu-category image values are inspected:

1. A deterministic media asset ID is derived from Project, menu-item ID, and legacy
   value.
2. A Base64 data URL is decoded and passed through the normal upload/normalization
   pipeline.
3. An HTTP(S) URL becomes isolated legacy-external media metadata; arbitrary remote
   content is not downloaded.
4. The Coffee snapshot is updated to `imageAssetId` only after media persistence
   succeeds.
5. The legacy field is then removed.

The migration is idempotent. A repeated attempt uses the same media asset ID. If media
persistence or snapshot persistence fails, the original value remains untouched and
available for preview; no Project reset or crash-test seed recreation occurs.

## Future customer-menu compatibility

The customer-menu plugin can receive the same `imageAssetId` and use the generic
`MediaAssetService` to:

- resolve project-authorized metadata;
- resolve a displayable URL;
- release that URL after use.

No image duplication or Coffee-specific media API is required. A future backend media
API, object-storage adapter, and CDN resolver can implement the same public repository
contract.
