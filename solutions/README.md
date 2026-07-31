# Solutions

This directory contains independently versioned first-party Solution packages.

The first approved product blueprint and implementation is
[Coffee Solution](../COFFEE_SOLUTION.md). Its current frontend package provides the
Project administration environment and typed mock repositories; operational workflows
and backend adapters remain outside the current scope.

A future Solution must be an independently versioned workspace package with an approved
manifest, clear bounded context, project-scoped data, public contracts, migrations,
capability definitions, health checks, and lifecycle hooks.

Each implementation must continue to satisfy the gates in [Roadmap](../docs/roadmap.md)
and its Solution-specific roadmap.
