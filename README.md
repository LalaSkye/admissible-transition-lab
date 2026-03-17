# Admissible Transition Lab

Models generate proposals.
Systems execute state transitions.
Governance determines which transitions are admissible.

This repo demonstrates a minimal runtime governance mechanism for autonomous systems.

## Formal Model

System:

```
S = states
A = actions
T : S × A → S
```

Constraint kernel:

```
G(s, a) → { ALLOW, DENY, ESCALATE, DRIFT }
```

Execution semantics:

```
ALLOW    → execute transition
DENY     → block transition
ESCALATE → block transition, emit escalation event (requires authority)
DRIFT    → block transition, flag governance gap (uncovered action)
```

Admissible actions:

```
A*(s) = { a ∈ A | G(s, a) = ALLOW }
```

Execution rule:

```
A transition executes only if a ∈ A*(s)
```

Closed-world default:

```
Any uncovered (state, action) pair resolves to DRIFT → DENY.
```

## Theorem

If execution is permitted only for actions in A\*(s),
then all reachable runtime transitions are constrained by G.
If uncovered actions default to DENY, the system is fail-closed.

## What This Proves

**Policy governance fails** because it does not restrict the reachable state space.
The transition function executes regardless of what the policy says.

**Kernel governance works** because it constrains reachable transitions.
No action executes unless `G(s, a) = ALLOW`.
Both DENY and ESCALATE block execution. ESCALATE additionally signals that authority is required.
DRIFT detects governance gaps — actions that exist in the transition system but have no kernel rule.

## Interactive Web Demo

The `web/` directory contains a hardened interactive demo (v3) with:

- **3 scenarios**: Policy-only, kernel-enforced, drift detection
- **Bypass demonstration panel**: 6 live attack vectors that show what the kernel catches
- **Braid topology charts**: Track Two experimental results (crossing numbers, generator breadth, adversarial perturbation)
- **Universal protocol stack**: 5-layer architecture for substrate-independent communication
- **Formal theory**: Mathematical foundations

### Hardening (Morpheus Packet v3)

The web demo implements fail-closed governance patterns:

- Single `dispatch(command)` entrypoint with canonical command schema
- All mutable state encapsulated in closure (nothing on `window`)
- Frozen `Verdict` enum and sealed kernel (immutable after construction)
- Monotonic sequence counter with replay rejection
- Session nonce for scenario isolation
- State coherence checks (client state must match engine state)
- Hash-chained append-only event store with integrity verification
- TAMPERED mode with hard execution freeze on integrity violation
- Honest disclaimer: models the patterns, does not claim to be tamper-proof

To run locally:

```bash
cd web
npx serve . -l 3000
```

## Python Demo

```
python src/demo.py
```

Three scenarios:

1. **Policy-only governance** — commit executes without approval. Governance is advisory.
2. **Kernel-enforced governance** — direct commit denied, bypass escalated. Only the governed path executes.
3. **Drift via architecture expansion** — new action added, kernel not updated. Governance gap detected.

## Tests

```
pytest
```

Tests prove four things:

1. Forbidden transitions are unreachable under kernel enforcement
2. Commit transitions require prior admissible authority state
3. Uncovered actions fail closed
4. Architecture changes without kernel updates create detectable drift

## Structure

```
src/
  transition.py    # Transition system (S, A, T)
  kernel.py        # Constraint kernel G(s,a) → {ALLOW, DENY, ESCALATE}
  demo.py          # Three proof scenarios
tests/
  test_admissibility.py
  test_drift.py
docs/
  theory.md        # Formal theory document
web/
  index.html       # Interactive demo (v3 hardened)
  app.js           # Governance engine + bypass demo + D3 charts
  style.css        # Design tokens + component styles
  base.css         # CSS reset
```

## Requirements

Python 3.10+. No external dependencies.
Web demo: any modern browser. No build step required.

## Licence

MIT
