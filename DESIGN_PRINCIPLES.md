# BARAKASB Design Principles

## Product promise

BARAKASB turns a portfolio of independent businesses into one calm operating
environment. The experience is quiet, direct, and predictable: users see the health of
their work, understand the next action, and never wonder which Project they are
changing.

“Apple-like” means disciplined simplicity, precise hierarchy, fast feedback, excellent
defaults, and progressive disclosure. It does not mean copying another product's visual
assets or hiding important operational detail.

## Principles

### 1. One screen, one primary outcome

Every screen has one visually dominant action or decision. Secondary actions remain
available but cannot compete for attention. If a screen needs several primary actions,
it is probably several screens.

### 2. Always answer “What should I do next?”

The next useful action appears near the page title, current status, or empty state.
Dashboards prioritize exceptions and decisions over decorative metrics.

### 3. Make Project context impossible to miss

Project name and status remain visible in every project-scoped screen. Switching Project
is an explicit context transition with data reset, not a cosmetic menu change. Global
and project settings have distinct labels and navigation.

### 4. Start simple; reveal depth on demand

The default view serves the most common task. Advanced configuration, diagnostics, and
rare actions use secondary pages or disclosure. Progressive disclosure must not hide
security, price, irreversible impact, or required decisions.

### 5. Prefer recognition over recall

Use clear labels, familiar nouns, saved context, previews, recent items, and visible
choices. Never require users to remember IDs, paths, permission codes, or previous
screen values.

### 6. Preserve momentum

Navigation, validation, save feedback, and Project switching feel immediate. Skeletons
preserve layout. Long operations become observable background progress with a safe place
to leave and return.

### 7. Prevent errors before explaining them

Use safe defaults, constraints, previews, capability-aware controls, and confirmation
proportional to consequence. Disabled actions explain the missing prerequisite.

### 8. Use plain, accountable language

Labels describe outcomes: “Invite employee,” “Archive Project,” “Retry installation.”
Avoid framework, infrastructure, and internal lifecycle vocabulary unless the target
user is a developer or platform operator.

### 9. Show truth, not optimism

Status distinguishes pending, delayed, degraded, failed, and complete. Never display a
successful state before the authoritative operation completes. Explain stale data and
last update time when it matters.

### 10. Permissions improve clarity, not security

The interface hides irrelevant actions and explains unavailable ones, but the backend
remains authoritative. A denied action never implies that another Project or resource
exists.

### 11. Accessibility is the default interaction model

Keyboard, touch, pointer, screen reader, zoom, reduced motion, high contrast, and
localization are designed together. WCAG 2.2 AA is the release floor.

### 12. No decoration without information

Every color, icon, animation, chart, card, and badge must convey hierarchy, state,
relationship, or affordance. Remove anything whose absence does not reduce
understanding.

### 13. Consistency beats novelty

The same action uses the same term, placement, icon, confirmation pattern, and keyboard
behavior throughout Core, Solutions, and Plugins. Extensions compose platform patterns;
they do not create parallel design systems.

### 14. Trust is visible

Pricing, permission changes, security events, data impact, and irreversible operations
state what will happen before commitment. Dark patterns, hidden defaults, fabricated
urgency, and obstructive cancellation are forbidden.

## Product review questions

Before approving a screen:

1. What is its single business purpose?
2. Who is it for, and what capability is required?
3. What should the user do next?
4. What can be removed without losing clarity?
5. Is Project context unmistakable?
6. Are empty, loading, partial, denied, offline, and failure states actionable?
7. Does the screen still work at 200% zoom, by keyboard, and on a narrow phone?
8. Does it expose sensitive existence or data through labels, counts, search, or errors?
9. Does it remain truthful during asynchronous operations?
10. Is the outcome measurable without collecting unnecessary personal data?

## Non-goals

- maximizing time in product;
- filling screens with charts;
- exposing every capability in navigation;
- making all workflows fit one page;
- using visual novelty to imply product value;
- teaching users internal platform architecture.
