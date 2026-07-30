# Documentation standard

## Document types

| Type                   | Purpose                                                  | Update rule                                              |
| ---------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| Onboarding             | Teach the platform in a deliberate order                 | Update whenever the mental model or workflow changes     |
| Architecture           | Describe current structure, invariants, and interactions | Update in the same change as implementation/ADR          |
| ADR                    | Record one durable decision and why                      | Immutable after acceptance; supersede instead of rewrite |
| Development standard   | Define engineering policy and quality expectations       | Version with toolchain/process                           |
| Operations             | Define safe deployment, recovery, and incident behavior  | Validate through drills                                  |
| Review                 | Preserve a point-in-time assessment                      | Do not treat as current design after remediation         |
| Open-decision register | Prevent unapproved local choices                         | Remove only through accepted ADR                         |

## Required qualities

Documentation is:

- **owned**: an accountable role can approve changes;
- **traceable**: normative architecture links to ADR rationale;
- **testable**: “must” statements identify validation where practical;
- **current**: implementation and docs change together;
- **navigable**: linked from the canonical index or onboarding path;
- **secure**: contains no secrets, production data, or unsafe operational detail.

## ADR writing rule

An ADR answers:

1. What problem and constraints existed?
2. Which qualities drove the decision?
3. What exactly was decided?
4. Why did this option best satisfy the drivers?
5. Which alternatives were rejected and why?
6. What costs and risks are accepted?
7. How is the decision validated?
8. When should it be revisited?

One ADR contains one coherent decision. Large proposals are split when parts can be
accepted, superseded, or implemented independently.

## Diagrams and terminology

Diagrams use the canonical terms in the [Glossary](../glossary.md). Arrows state whether
they represent dependency, request, event, or data movement. A diagram supplements
normative text; it is not the only definition of a security boundary.

## Link and freshness controls

`pnpm architecture:check` validates local links, required documents, ADR indexing,
decision-map coverage, and ADR traceability from architecture documents.

Review owners remove stale claims rather than appending contradictory notes. Historical
rationale remains in ADRs and reviews.

## Related decision

- [ADR 0026: Architecture quality gates](../adr/0026-architecture-quality-gates.md)
