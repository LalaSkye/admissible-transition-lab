# Admissible Transition Lab

Models propose.
Systems mutate state.
Governance decides which mutations are admissible.

This repo proves one claim:

> **Governance becomes operational when admissibility is enforced at the execution boundary of a transition system.**

## Formal Model

A **transition system** is a triple:

```
S = finite set of states
A = finite set of actions
T : S × A → S   (transition function)
```

A **constraint kernel** evaluates every transition before execution:

```
G(s, a) → { ALLOW, DENY, ESCALATE }
```

The **admissible action set** from state `s` is:

```
A*(s) = { a ∈ A | G(s, a) = ALLOW }
```

**Execution rule:** A transition may execute only if `a ∈ A*(s)`.

## What This Proves

| Approach | Mechanism | Result |
|---|---|---|
| Policy governance | Advisory rules, no enforcement | Fails — reachable state space unconstrained |
| Kernel governance | Constraint function at execution boundary | Works — only admissible transitions execute |

**Policy governance fails** because it does not restrict the reachable state space.
The transition function executes regardless of what the policy says.

**Kernel governance works** because it constrains reachable transitions.
No action executes unless `G(s, a) = ALLOW`.

## Demo

```
python src/demo.py
```

Runs three scenarios:

1. **Policy-only** — commit executes without approval. Governance is advisory.
2. **Kernel-enforced** — direct commit denied. System follows governed path. Governance is operational.
3. **Drift** — new action added, kernel not updated. Governance gap detected.

## Tests

```
pytest
```

- `test_admissibility.py` — commit blocked without approval, bypass denied, governed path reachable
- `test_drift.py` — new transitions expand action space, drift detected when kernel not updated

## Structure

```
src/
  transition.py    # Transition system (S, A, T)
  kernel.py        # Constraint kernel G(s,a)
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
