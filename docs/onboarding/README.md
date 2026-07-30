# Developer onboarding

This onboarding path is designed to make a developer independently productive without an
architecture walkthrough.

## Required reading order

### 1. Understand the platform

Read [Platform mental model](platform-mental-model.md). You should be able to explain:

- why Project is the isolation boundary;
- how Core, Solutions, and Plugins depend on one another;
- how control plane and data-plane cells differ;
- why one transaction has one module write owner.

### 2. Learn the repository

Read [Repository navigation](repository-navigation.md), then inspect the Nx graph:

```text
pnpm install --frozen-lockfile
pnpm architecture:check
pnpm exec nx show projects
pnpm graph
```

Node.js 24 LTS and the pinned pnpm version are required.

### 3. Follow one request

Read [Request lifecycle](request-lifecycle.md). You should understand where identity,
Project placement, authorization, RLS, transaction, outbox, audit, and response mapping
occur.

### 4. Learn how decisions work

Read the [Architecture decision map](../architecture/decision-map.md) and
[ADR process](../adr/README.md). Architecture docs explain what exists; ADRs explain
why.

Also read [Architecture governance](../governance/architecture-governance.md) before
proposing a cross-cutting change.

### 5. Make changes safely

Use [Change playbook](change-playbook.md) and
[Definition of Done](../development/definition-of-done.md).

## First-day success criteria

A new developer is onboarded when they can:

- locate the owner of a concept without searching framework folders;
- determine whether a change belongs to Core, Shared, Solution, Plugin, or app
  composition;
- identify actor, Project, placement, authorization, and transaction boundaries;
- explain why direct cross-module SQL and cross-owner transactions are forbidden;
- run the architecture and formatting checks;
- find the ADR behind a normative architecture rule;
- recognize when a new ADR is required.

## Current repository state

This is still the Foundation phase. Applications and extension implementations do not
exist yet. Empty implementation targets are intentional; the repository contains
architecture, governance, and structural checks only.
