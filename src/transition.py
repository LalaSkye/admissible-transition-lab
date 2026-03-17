"""
Transition system: S × A → S

A transition system is a triple (S, A, T) where:
  S = finite set of states
  A = finite set of actions
  T : S × A → S is a (partial) transition function
"""


class TransitionSystem:
    """Deterministic transition system with explicit state and action sets."""

    def __init__(self):
        self._transitions = {}  # (state, action) -> next_state

    def add(self, state: str, action: str, next_state: str):
        """Register a transition: T(state, action) = next_state."""
        self._transitions[(state, action)] = next_state

    def step(self, state: str, action: str) -> str | None:
        """Execute T(state, action). Returns next state or None if undefined."""
        return self._transitions.get((state, action))

    def reachable(self, start: str) -> set[str]:
        """Compute the reachable state space from a start state."""
        visited = set()
        frontier = [start]
        while frontier:
            s = frontier.pop()
            if s in visited:
                continue
            visited.add(s)
            for (src, _act), dst in self._transitions.items():
                if src == s and dst not in visited:
                    frontier.append(dst)
        return visited

    def actions_from(self, state: str) -> list[str]:
        """Return all actions defined from a given state."""
        return [a for (s, a) in self._transitions if s == state]
