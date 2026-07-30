# BARAKASB Design System

## Direction

The visual system is restrained, high-contrast, and content-led. Neutral surfaces carry
structure; color communicates action and state. Density is comfortable by default and
compact only for data-heavy expert views. No gradient, glass, decorative illustration,
or motion is introduced unless it improves comprehension.

Tokens use semantic names so light mode, dark mode, high contrast, and future brand
themes can change without altering component meaning.

## Spacing

Base unit: **4 px**.

| Token      | Value | Typical use                          |
| ---------- | ----: | ------------------------------------ |
| `space-0`  |     0 | Explicit reset                       |
| `space-1`  |  4 px | Tight icon/text adjustment           |
| `space-2`  |  8 px | Inline gaps, compact control padding |
| `space-3`  | 12 px | Control internal spacing             |
| `space-4`  | 16 px | Standard component gap               |
| `space-5`  | 20 px | Dense section padding                |
| `space-6`  | 24 px | Card padding, form groups            |
| `space-8`  | 32 px | Section separation                   |
| `space-10` | 40 px | Page-header spacing                  |
| `space-12` | 48 px | Major section separation             |
| `space-16` | 64 px | Public-page sections                 |
| `space-20` | 80 px | Large marketing rhythm               |

Spacing uses the smallest token that keeps grouping obvious. Dense screens reduce
internal padding, not minimum touch targets.

## Typography

System font stack:

```text
Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Monospace:

```text
"SFMono-Regular", Consolas, "Liberation Mono", monospace
```

| Style       | Size / line height | Weight | Use                              |
| ----------- | ------------------ | -----: | -------------------------------- |
| Display     | 48 / 56 px         |    650 | Public-page value statement only |
| H1          | 32 / 40 px         |    650 | One page title                   |
| H2          | 24 / 32 px         |    650 | Major section                    |
| H3          | 20 / 28 px         |    600 | Card group or subsection         |
| Title       | 17 / 24 px         |    600 | Component title                  |
| Body        | 15 / 22 px         |    400 | Default reading                  |
| Body strong | 15 / 22 px         |    600 | Emphasis and labels              |
| Small       | 13 / 18 px         |    400 | Metadata and help                |
| Caption     | 12 / 16 px         |    500 | Compact labels; never long prose |
| Code        | 13 / 20 px         |    400 | IDs, scopes, examples            |

Body text does not drop below 15 px; secondary text does not drop below 12 px. Line
length targets 60–75 characters for prose. Uppercase is limited to short technical
identifiers and never used for navigation or long labels.

## Grid and breakpoints

| Breakpoint | Range        | Columns | Outer margin | Gutter |
| ---------- | ------------ | ------: | -----------: | -----: |
| Compact    | 0–599 px     |       4 |        16 px |  16 px |
| Medium     | 600–1023 px  |       8 |        24 px |  20 px |
| Large      | 1024–1439 px |      12 |        32 px |  24 px |
| Wide       | 1440 px+     |      12 |        48 px |  24 px |

Authenticated page content has a readable maximum width of 1440 px. Forms use 560–720
px. Text-heavy content uses 760 px. Data tables may use full available width. Layout
responds to available container width, not device labels alone.

## Color

### Light theme

| Semantic token   | Value     | Use                                    |
| ---------------- | --------- | -------------------------------------- |
| `bg-canvas`      | `#F7F8FA` | Application background                 |
| `bg-surface`     | `#FFFFFF` | Primary surface                        |
| `bg-subtle`      | `#F0F2F5` | Grouping and hover                     |
| `bg-inverse`     | `#15181D` | Inverse content                        |
| `text-primary`   | `#171A1F` | Main text                              |
| `text-secondary` | `#5E6673` | Supporting text                        |
| `text-tertiary`  | `#7B8492` | Metadata meeting contrast requirements |
| `border-default` | `#D9DEE7` | Boundaries                             |
| `border-strong`  | `#AEB6C3` | Emphasized boundary                    |
| `action-primary` | `#1769E0` | Primary action and links               |
| `action-hover`   | `#0F57BE` | Hover/pressed progression              |
| `focus-ring`     | `#6EA8FF` | 2 px focus indicator plus offset       |
| `status-success` | `#18794E` | Confirmed success                      |
| `status-warning` | `#9A6700` | Needs attention                        |
| `status-danger`  | `#C52A2A` | Destructive/error                      |
| `status-info`    | `#1769E0` | Informational                          |

Status colors always pair with text or icon. Large background tints use low-chroma
derived values and retain at least 4.5:1 text contrast.

### Dark theme

| Semantic token   | Value     |
| ---------------- | --------- |
| `bg-canvas`      | `#0F1115` |
| `bg-surface`     | `#171A20` |
| `bg-subtle`      | `#20242C` |
| `bg-inverse`     | `#F7F8FA` |
| `text-primary`   | `#F4F6F8` |
| `text-secondary` | `#B4BBC6` |
| `text-tertiary`  | `#929BA8` |
| `border-default` | `#333946` |
| `border-strong`  | `#525B6B` |
| `action-primary` | `#73A9FF` |
| `action-hover`   | `#9BC1FF` |
| `focus-ring`     | `#8DB7FF` |
| `status-success` | `#5CCB93` |
| `status-warning` | `#E9B949` |
| `status-danger`  | `#FF7B7B` |
| `status-info`    | `#73A9FF` |

Pure black and pure white are avoided for large surfaces to reduce glare. User choice
supports light, dark, and system; theme does not encode Project or permission.

## Radius and elevation

| Token         |  Value | Use                           |
| ------------- | -----: | ----------------------------- |
| `radius-sm`   |   6 px | Small controls, tags          |
| `radius-md`   |  10 px | Inputs, buttons, menus        |
| `radius-lg`   |  14 px | Cards, dialogs                |
| `radius-xl`   |  20 px | Large public surfaces only    |
| `radius-pill` | 999 px | Status pills and avatars only |

Nested surfaces use equal or smaller radius. Shadows are reserved for temporary
overlays:

- menu: `0 8px 24px rgb(15 23 42 / 12%)`;
- dialog: `0 20px 60px rgb(15 23 42 / 20%)`.

Permanent cards use border and surface contrast, not shadow.

## Icons

Use one outline icon family with 1.75–2 px stroke, rounded joins, and 16, 20, or 24 px
sizes. Icons support labels; they do not replace unfamiliar text. The same symbol never
represents different actions. Destructive icons are not red until the action is
destructive in context.

Solution icons are supplied as reviewed monochrome SVG assets, have accessible names
where meaningful, and cannot introduce remote scripts, fonts, or animation.

## Buttons

Heights: 32 px compact, 40 px standard, 48 px prominent/mobile. Minimum touch target is
44 by 44 px even when the visual control is smaller.

| Variant     | Use                                     |
| ----------- | --------------------------------------- |
| Primary     | One main action in the current region   |
| Secondary   | Supporting action with equal safety     |
| Quiet       | Low-emphasis local action               |
| Destructive | Explicit destructive confirmation only  |
| Link        | Navigation in prose or compact metadata |

Buttons have default, hover, pressed, focus, disabled, and loading states. Loading keeps
the label width stable and uses “Creating…”, not an unlabeled spinner. Disabled controls
must remain legible and explain why when the reason is actionable.

## Inputs

Standard controls are 40 px high; multiline inputs grow by content within documented
limits. Labels are always visible above fields. Placeholder is an example, never a
label. Help precedes errors; an error appears beside the field and is summarized at the
form top after submit.

Use the correct semantic input, autocomplete, input mode, locale formatting, and
password-manager behavior. Required fields are identified in text. Validation occurs on
blur for field-level guidance and on submit for completion; typing is not interrupted
for non-critical formatting.

## Tables

Tables are used for comparison, scanning, and bulk operations—not simple navigation.
Default row height is 52 px; compact expert mode is 40 px. Header stays visible for long
tables. Numeric values align right, text left, and status consistently.

Columns disappear by priority on narrow widths. When row meaning would be lost, rows
become labeled records rather than horizontally compressed text. Selection, sort,
filters, pagination, empty states, and bulk actions have explicit accessible labels.

## Charts

Charts answer a named business question and include:

- clear title and time range;
- current value and comparison where meaningful;
- axis labels and units;
- accessible text/table equivalent;
- no 3D, perspective, decorative animation, or truncated axes that distort meaning.

Use line for change over time, bar for category comparison, stacked bar for composition,
and single value for a current KPI. Pie/donut is limited to at most five stable parts
when part-to-whole is the actual question. Color palettes remain distinguishable under
common color-vision deficiencies.

## Motion

| Motion                 |                    Duration | Curve       |
| ---------------------- | --------------------------: | ----------- |
| Press/hover            |                   80–120 ms | ease-out    |
| Menu/disclosure        |                  140–180 ms | ease-out    |
| Page-region transition |                  180–240 ms | ease-in-out |
| Background progress    | continuous only when useful | linear      |

Movement communicates spatial relationship or change. No parallax, ambient motion, or
attention loops. `prefers-reduced-motion` removes movement and preserves state change
through opacity or instant transition.

## Accessibility

- WCAG 2.2 AA minimum; critical workflows are tested at AAA contrast where practical.
- Full keyboard operation with visible focus and logical order.
- Semantic HTML and native controls before custom behavior.
- Screen-reader names, descriptions, errors, live-region announcements, and table
  semantics are specified per component.
- Content remains usable at 200% browser zoom and 400% reflow.
- Touch targets are at least 44 px and do not require precision gestures.
- No information depends solely on color, hover, sound, direction, or animation.
- Timeouts warn, allow extension where safe, and preserve work.
- Authentication supports password managers, paste, passkeys, and accessible MFA.

## Governance

Core owns tokens and accessible primitives. Solutions may define domain composites using
Core tokens; Plugins use their target Solution's declared slots. New tokens require a
cross-product need. Every component addition includes purpose, variants, states,
keyboard behavior, accessibility contract, responsive behavior, content guidance, and
visual regression criteria.
