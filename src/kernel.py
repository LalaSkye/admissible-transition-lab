"""
Constraint kernel: G(s, a) → {ALLOW, DENY, ESCALATE}

The kernel restricts which transitions may execute.
Admissible actions from state s:

    A*(s) = { a ∈ A | G(s, a) = ALLOW }

A transition may execute only if the action is in A*(s).
"""

from enum import Enum


class Verdict(Enum):
    ALLOW = "ALLOW"
    DENY = "DENY"
    ESCALATE = "ESCALATE"


class ConstraintKernel:
    """Maps (state, action) pairs to governance verdicts."""

    def __init__(self):
        self._rules = {}  # (state, action) -> Verdict

    def add_rule(self, state: str, action: str, verdict: Verdict):
        """Register a constraint rule."""
        self._rules[(state, action)] = verdict

    def evaluate(self, state: str, action: str) -> Verdict:
        """
        G(s, a) → Verdict.

        If no rule exists for (state, action), default is DENY.
        This enforces closed-world: only explicitly allowed transitions execute.
        """
        return self._rules.get((state, action), Verdict.DENY)

    def admissible_actions(self, state: str, all_actions: list[str]) -> list[str]:
        """Return A*(s) — the set of actions allowed from state s."""
        return [a for a in all_actions if self.evaluate(state, a) == Verdict.ALLOW]

    def covers(self, state: str, action: str) -> bool:
        """Check whether the kernel has an explicit rule for (state, action)."""
        return (state, action) in self._rules
