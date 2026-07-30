# Extension runner boundary

Reserved isolated execution boundary for future partner or customer-provided extensions.
It is not implemented or enabled in Foundation.

The runner accepts only signed deployment-approved artifacts and capability-scoped
invocations. It receives no direct PostgreSQL, Redis, object-store, identity-provider,
or secret-manager credentials. Data access uses audited project-scoped platform APIs.
Runtime isolation includes a dedicated workload identity, filesystem/network policy,
CPU/memory/time quotas, concurrency limits, and termination.

Reviewed first-party Solutions and Plugins may remain in-process under the trusted-code
policy. Moving an extension to this runner must not change its public contract.
