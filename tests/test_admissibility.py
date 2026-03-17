"""
test_admissibility.py

Proves:
  1. Forbidden transitions are unreachable under kernel enforcement
  2. Commit transitions require prior admissible authority state
  3. Uncovered actions fail closed
  4. ESCALATE blocks execution and signals authority required

Tests must FAIL if the kernel is disabled.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from transition import TransitionSystem
from kernel import ConstraintKernel, Verdict


def _build_system():
    """Standard transition system with governed commit path."""
    ts = TransitionSystem()
    ts.add("idle", "commit", "committed")
    ts.add("idle", "bypass", "committed")
    ts.add("idle", "propose", "proposed")
    ts.add("proposed", "approve", "approved")
    ts.add("approved", "commit", "committed")
    return ts


def _build_kernel():
    """Constraint kernel enforcing approval before commit."""
    kernel = ConstraintKernel()
    kernel.add_rule("idle", "commit", Verdict.DENY)
    kernel.add_rule("idle", "bypass", Verdict.ESCALATE)
    kernel.add_rule("idle", "propose", Verdict.ALLOW)
    kernel.add_rule("proposed", "approve", Verdict.ALLOW)
    kernel.add_rule("approved", "commit", Verdict.ALLOW)
    return kernel


def _governed_step(ts, kernel, state, action):
    """Execute a transition only if the kernel allows it."""
    if kernel.may_execute(state, action):
        return ts.step(state, action), kernel.evaluate(state, action)
    return state, kernel.evaluate(state, action)


class TestForbiddenTransitionsUnreachable:
    """Forbidden transitions are unreachable under kernel enforcement."""

    def test_direct_commit_denied(self):
        kernel = _build_kernel()
        assert kernel.evaluate("idle", "commit") == Verdict.DENY
        assert not kernel.may_execute("idle", "commit")

    def test_governed_step_blocks_commit(self):
        ts = _build_system()
        kernel = _build_kernel()
        next_state, verdict = _governed_step(ts, kernel, "idle", "commit")
        assert next_state == "idle", "State must not change when commit is denied"
        assert verdict == Verdict.DENY

    def test_bypass_escalated_and_blocked(self):
        ts = _build_system()
        kernel = _build_kernel()
        next_state, verdict = _governed_step(ts, kernel, "idle", "bypass")
        assert next_state == "idle", "State must not change when bypass is escalated"
        assert verdict == Verdict.ESCALATE
        assert not kernel.may_execute("idle", "bypass")


class TestCommitRequiresAuthority:
    """Commit transitions require prior admissible authority state."""

    def test_commit_denied_from_idle(self):
        kernel = _build_kernel()
        assert not kernel.may_execute("idle", "commit")

    def test_commit_allowed_from_approved(self):
        kernel = _build_kernel()
        assert kernel.may_execute("approved", "commit")
        assert kernel.evaluate("approved", "commit") == Verdict.ALLOW

    def test_full_governed_path(self):
        ts = _build_system()
        kernel = _build_kernel()
        state = "idle"
        path = [state]
        for action in ["propose", "approve", "commit"]:
            assert kernel.may_execute(state, action), f"{action} must be allowed from {state}"
            state = ts.step(state, action)
            assert state is not None
            path.append(state)
        assert path == ["idle", "proposed", "approved", "committed"]


class TestUncoveredActionsFailClosed:
    """Uncovered actions fail closed (default DENY)."""

    def test_unknown_action_denied(self):
        kernel = _build_kernel()
        assert kernel.evaluate("idle", "delete_everything") == Verdict.DENY
        assert not kernel.may_execute("idle", "delete_everything")

    def test_unknown_state_denied(self):
        kernel = _build_kernel()
        assert kernel.evaluate("unknown_state", "commit") == Verdict.DENY
        assert not kernel.may_execute("unknown_state", "commit")

    def test_admissible_set_excludes_denied_and_escalated(self):
        kernel = _build_kernel()
        admissible = kernel.admissible_actions(
            "idle", ["commit", "propose", "bypass", "delete_everything"]
        )
        assert admissible == ["propose"]


class TestEscalateBlocksExecution:
    """ESCALATE blocks execution and signals authority required."""

    def test_escalate_verdict_returned(self):
        kernel = _build_kernel()
        assert kernel.evaluate("idle", "bypass") == Verdict.ESCALATE

    def test_escalate_does_not_execute(self):
        kernel = _build_kernel()
        assert not kernel.may_execute("idle", "bypass")

    def test_escalate_not_in_admissible_set(self):
        kernel = _build_kernel()
        admissible = kernel.admissible_actions("idle", ["bypass", "propose"])
        assert "bypass" not in admissible
        assert "propose" in admissible
