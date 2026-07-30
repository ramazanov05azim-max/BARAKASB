# Core packages

Core contains platform behavior only. It cannot import a Solution or Plugin. Every
package owns a bounded capability, its public contract, and its data.

Implementation packages follow the Clean Architecture shape documented in
[Monorepo architecture](../../docs/architecture/monorepo.md).
