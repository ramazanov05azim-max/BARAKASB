# BARAKASB User Journeys

## Journey design rules

- Each journey states intent, next action, completion evidence, and recovery.
- Project context changes are explicit.
- Long operations are resumable and visible outside the initiating screen.
- UI permission checks improve clarity; authoritative checks remain server-side.
- Solution business workflows are intentionally not defined here.

## J01 — Visitor creates the first Project

**Actor:** prospective owner\
**Success:** an active Project exists, an initial Solution choice is recorded, and the
owner knows the next setup action.

| Stage     | User question                     | Experience and next action                                                                                |
| --------- | --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Discover  | Is this for businesses like mine? | Landing explains multi-Project operation, isolation, and the three-step start. Create account is primary. |
| Register  | What information is required?     | Ask only for identity requirements and legal acceptance. Continue is primary.                             |
| Secure    | Is my account protected?          | Complete required verification/passkey/MFA. Continue to Projects.                                         |
| Orient    | Where do I begin?                 | Empty My Projects explains Project as an independent business space. Create Project is primary.           |
| Define    | What must I decide now?           | Enter Project name and only policy-required location choices. Continue to Solution.                       |
| Choose    | Which capability fits?            | Catalog is organized by outcome, with trust, price, and permission/data impact. Select Solution.          |
| Review    | What will happen and cost?        | Review owner, isolation, plan, Solution, and price. Create Project.                                       |
| Provision | Is it ready?                      | Observable stages; user may leave safely. Notification announces completion/failure.                      |
| Start     | What next?                        | Dashboard setup progress identifies the single next setup action.                                         |

Recovery preserves the draft before creation. A provisioning failure says whether no
Project was created or recovery is running; duplicate submission never creates a second
Project.

## J02 — Returning portfolio owner switches Projects

**Actor:** owner of several Projects\
**Success:** the intended Project opens with no state from the previous Project.

1. My Projects prioritizes recent and attention-needed Projects without combining their
   business data.
2. Owner searches or selects a Project.
3. The shell announces the new Project and clears scoped queries, drafts, subscriptions,
   and extension registrations.
4. Dashboard shows only authorized target-Project content.
5. The next priority action is first.

If membership changed, the Project disappears or opens a disclosure-safe access state.
Back navigation never restores stale protected data.

## J03 — Owner invites an employee

**Actor:** Project owner or membership administrator\
**Success:** a single-purpose invitation is sent with the intended role and expiry.

1. Dashboard or Administration offers Invite employee.
2. People & Access explains effective role impact before submission.
3. Administrator enters the verified destination and chooses role bundles.
4. Review states Project, access, expiry, and notification.
5. Success adds a pending invitation row and offers Invite another or Done.

Duplicate or conflicting invitations are resolved inline. The interface never confirms
whether an unrelated platform identity exists.

## J04 — Invited employee starts work

**Actor:** invited employee\
**Success:** invitation is accepted by the intended identity and the focused workspace
opens.

1. Notification/link opens authentication without exposing Project data.
2. Existing user signs in; new user registers and secures the account.
3. Invitation review names the Project, inviter, role summary, and expiry.
4. Accept performs authoritative identity and membership checks.
5. Employee enters Project Dashboard or Work, depending on available next work.

Expired, revoked, wrong-identity, and already-accepted states have distinct safe
recovery. Employees do not see administration unless separately authorized.

## J05 — Administrator installs a Solution

**Actor:** Project Solution administrator\
**Success:** compatible Solution reaches effective enabled state and its workspace
becomes available.

1. Administration shows that no Solution is installed or offers Add Solution.
2. Catalog filters compatible approved artifacts for the current Project.
3. Detail explains purpose, publisher/trust, price, requested capabilities, data
   classes, and lifecycle impact.
4. Administrator reviews plan/billing effect and confirms.
5. Installation becomes a background operation with desired/effective status.
6. On success, navigation contribution appears and Dashboard offers Open workspace.

Compatibility uncertainty blocks confirmation. Failure shows the retained state, safe
retry, and audit/support reference. No partial workspace is exposed.

## J06 — Employee completes daily work

**Actor:** employee\
**Success:** the user reaches the relevant Solution task with minimal navigation.

1. Project opens to a role-aware Dashboard or Employee Workspace.
2. “Next work” lists only actionable, authorized items ordered by due/severity.
3. Employee opens the item in its owning Solution.
4. Solution uses platform form, feedback, and navigation patterns.
5. Completion returns to the next item or a truthful “Nothing needs attention” state.

The Core product does not invent task semantics. A failed Solution region is isolated;
other workspaces and navigation remain usable.

## J07 — Billing administrator resolves payment

**Actor:** billing administrator\
**Success:** authoritative payment state is restored without duplicate charge.

1. Persistent billing banner and notification state the impact and due action.
2. Billing opens in the correct Project.
3. Administrator sees confirmed plan, invoice, amount/currency, and provider-required
   action.
4. Secure provider flow collects payment information.
5. BARAKASB waits for authoritative confirmation and shows pending when necessary.
6. Success clears the actionable banner and records the invoice/payment state.

Retry is idempotent. Provider outage preserves the last confirmed state and offers a
safe retry; the interface never displays invented success.

## J08 — Developer creates an API client

**Actor:** Project developer with secret-management capability\
**Success:** a least-privilege credential is created, captured once, and audited.

1. Developer Console explains scopes, expiry, rotation, and Project boundary.
2. Developer chooses a descriptive name, minimum scopes, and allowed constraints.
3. Recent authentication is completed.
4. Review names Project and effective access.
5. Secret appears once with Copy and “I saved it” acknowledgement.
6. Client list shows masked identity, scopes, created by, activity, and revoke/rotate.

Leaving the one-time reveal cannot reconstruct the secret. Failure reveals no partial
secret. Rotation preserves overlap only when policy explicitly allows it.

## J09 — User recovers account access

**Actor:** locked-out user\
**Success:** identity access is restored and suspicious sessions can be revoked.

1. Login links to recovery.
2. User supplies provider/identifier; confirmation remains account-neutral.
3. Provider proof and required recovery checks complete.
4. New session is established and the user is offered session review.
5. Security notification confirms the event through approved channels.

Recovery never transfers Project ownership or matches identity solely by email.
Rate-limit, expiry, and provider-outage recovery remain accessible and non-disclosing.

## J10 — Owner archives or deletes a Project

**Actor:** Project owner\
**Success:** lifecycle change is intentional, accurately represented, and recoverable
only where policy says so.

1. Project Settings separates Archive from Delete.
2. Archive review states write/background-work impact and restore behavior.
3. Delete review states scope, installed extension cleanup, retention, legal hold,
   billing, irreversibility, and expected duration.
4. Recent authentication and typed Project-name confirmation are required for deletion.
5. The operation shows durable stages and allows safe departure.
6. My Projects reflects archived/deleting status; final completion retains only allowed
   tombstone information.

The last-owner and active-operation invariants block unsafe transitions with a concrete
next action.

## J11 — Operator handles a degraded cell

**Actor:** just-in-time platform operator\
**Success:** impact is contained and an approved recovery workflow is executed without
implicit Project access.

1. Operator requests purpose-bound privilege with target and duration.
2. Platform Settings visibly confirms environment, role, approver, and expiry.
3. Health view identifies cell-level impact using operational metadata.
4. Operator opens the approved runbook/workflow; uncertain placement changes fail
   closed.
5. Dual approval is collected for restricted actions.
6. Progress, rollback point, evidence, and audit references remain visible.
7. Privilege expires or is revoked after completion.

No generic Project-data explorer is available. An expired privilege returns controls to
read-only and preserves the incident reference.

## J12 — User follows a cross-Project notification

**Actor:** user currently working in Project A; notification belongs to Project B\
**Success:** Project B opens only after explicit context change.

1. Notification item clearly labels Project B.
2. Selecting it asks “Switch to Project B?” and warns that unsaved Project A work may be
   lost.
3. If safe, the shell clears Project A state and verifies Project B access.
4. The referenced destination opens and the notification becomes read after display.

Cancel keeps Project A unchanged. Revoked access produces a disclosure-safe explanation
and removes the stale actionable item.

## Journey quality metrics

| Journey          | Primary metric                      | Guardrail                         |
| ---------------- | ----------------------------------- | --------------------------------- |
| First Project    | verified time to active Project     | setup errors and abandonment      |
| Project switch   | time to correct context             | zero stale/cross-Project render   |
| Invite employee  | successful intended acceptance      | no identity disclosure            |
| Install Solution | time to effective state             | no partial activation             |
| Daily work       | time to first relevant task         | no admin clutter                  |
| Billing recovery | authoritative resolution time       | no duplicate charge               |
| API client       | successful least-privilege creation | secret exposure/reveal count      |
| Account recovery | secure completion                   | takeover and support escalation   |
| Project deletion | verified lifecycle completion       | no incomplete downstream deletion |

Metrics never justify weakening security, accessibility, or truthful state.
