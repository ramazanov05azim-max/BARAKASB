# Platform contracts

Owns transport-neutral schema primitives, contract metadata, and compatibility test
utilities. Domain entities and persistence models are not contracts.

The package defines the neutral `SolutionRuntimeManifest` and Operational Module
contracts used across the browser composition boundary. Operational contracts declare
module navigation, logical routes and screens, capabilities, state/port versions,
workspace access, and opt-in shared platform service ports without importing React or
provider SDKs.

Recipe semantics and module-specific repositories remain owned by the relevant Solution.
This package contains no Coffee fields, framework types, transport types, or runtime
implementation.
