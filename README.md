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
G(s, a) → { ALLOW, DENY, ESCALATE }
```

Execution semantics:

```
ALLOW    → execute transition
DENY     → block transition
ESCALATE → block transition, emit escalation event (requires authority)
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
Any uncovered (state, action) pair resolves to DENY.
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

## Demo

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
```

## Requirements

Python 3.10+. No external dependencies.

## Licence

MIT
