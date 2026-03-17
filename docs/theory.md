# Theory: Admissible Transitions and Constraint Kernels

## 1. Transition Systems

A **transition system** is the simplest formal model of a system that changes state.

It consists of three things:

- **S** — a finite set of states the system can be in
- **A** — a finite set of actions the system can take
- **T : S × A → S** — a function that maps a (state, action) pair to the next state

When the system is in state `s` and action `a` occurs, the system moves to state `T(s, a)`.

Example:

```
States:   { idle, proposed, approved, committed }
Actions:  { propose, approve, commit }

T(idle, propose)      = proposed
T(proposed, approve)  = approved
T(approved, commit)   = committed
```

A transition system says nothing about whether a transition *should* happen. It only defines what *can* happen.

## 2. Reachable State Space

The **reachable state space** from a starting state `s₀` is the set of all states the system can reach by following any sequence of transitions.

```
Reachable(s₀) = { s ∈ S | there exists a path from s₀ to s }
```

This matters because the reachable state space defines the **actual behaviour** of the system — not the intended behaviour, not the documented behaviour, but the set of states that are physically reachable through execution.

If a dangerous state is reachable, the system can reach it. Policy documents do not change this.

## 3. Constraint Kernel

A **constraint kernel** is a function that evaluates every transition *before* it executes:

```
G : S × A → { ALLOW, DENY, ESCALATE }
```

- **ALLOW** — the transition may execute
- **DENY** — the transition is blocked
- **ESCALATE** — the transition requires human review before proceeding

The kernel sits at the **execution boundary** — the point where a proposed action becomes an executed state change. Nothing executes without passing through `G`.

This is different from a policy. A policy is a statement about what should happen. A kernel is a function that determines what *does* happen.

## 4. Admissible Action Set

Given a constraint kernel `G`, the **admissible action set** from state `s` is:

```
A*(s) = { a ∈ A | G(s, a) = ALLOW }
```

These are the only actions that may execute from state `s`. All other actions are blocked.

The **execution rule** is:

> A transition `T(s, a)` may execute **only if** `a ∈ A*(s)`.

This constrains the reachable state space. If `G(s, a) = DENY`, then `T(s, a)` never executes, and any state reachable only through that transition becomes unreachable.

The admissible action set is what makes governance *operational* rather than *advisory*. The system cannot reach states that require inadmissible transitions.

## 5. Drift

**Drift** occurs when the transition system changes but the constraint kernel does not.

Example:
- A new action `auto_commit` is added: `T(idle, auto_commit) = committed`
- The kernel has no rule for `(idle, auto_commit)`
- If the kernel defaults to DENY, the action is blocked — but the governance team may not know the gap exists
- If the kernel does not cover the action at all, the transition may execute outside governance

Drift is detected by comparing the actions defined in the transition system against the actions covered by the kernel:

```
Drift(s) = { a ∈ actions_from(s) | G has no rule for (s, a) }
```

If `Drift(s)` is non-empty, the constraint kernel has a gap. Governance is incomplete.

**Key statement:**

> Safety in autonomous systems depends on controlling the reachable state space rather than controlling model outputs.

Model outputs are proposals. State transitions are execution. Governance must operate at the execution boundary — where proposals become reality — not at the proposal layer where they can be ignored.

## Summary

| Concept | Definition | Why It Matters |
|---|---|---|
| Transition system | (S, A, T) — states, actions, transitions | Defines what the system *can* do |
| Reachable state space | All states reachable from start | Defines actual system behaviour |
| Constraint kernel | G(s, a) → verdict | Controls which transitions execute |
| Admissible actions | A*(s) = actions where G = ALLOW | Restricts reachable state space |
| Drift | Actions not covered by kernel | Governance gap — system can escape constraints |
