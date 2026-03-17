"""
test_admissibility.py

Proves:
  ✓ commit cannot occur without approval when kernel active
  ✓ bypass action always denied
  ✓ escalation path reachable

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
    ts.add("idle", "propose", "proposed")
    ts.add("proposed", "approve", "approved")
    ts.add("approved", "commit", "committed")
    return ts


def _build_kernel():
    """Constraint kernel enforcing approval before commit."""
    kernel = ConstraintKernel()
    kernel.add_rule("idle", "commit", Verdict.DENY)
    kernel.add_rule("idle", "propose", Verdict.ALLOW)
    kernel.add_rule("proposed", "approve", Verdict.ALLOW)
    kernel.add_rule("approved", "commit", Verdict.ALLOW)
    return kernel


def _governed_step(ts, kernel, state, action):
    """Execute a transition only if the kernel allows it."""
    verdict = kernel.evaluate(state, action)
    if verdict == Verdict.ALLOW:
        return ts.step(state, action), verdict
    return state, verdict


class TestCommitRequiresApproval:
    """commit cannot occur without approval when kernel active."""

    def test_direct_commit_denied(self):
        ts = _build_system()
        kernel = _build_kernel()

        verdict = kernel.evaluate("idle", "commit")
        assert verdict == Verdict.DENY, "Kernel must deny direct commit from idle"

    def test_governed_step_blocks_commit(self):
        ts = _build_system()
        kernel = _build_kernel()

        next_state, verdict = _governed_step(ts, kernel, "idle", "commit")
        assert next_state == "idle", "State must not change when commit is denied"
        assert verdict == Verdict.DENY

    def test_commit_allowed_after_approval(self):
        ts = _build_system()
        kernel = _build_kernel()

        verdict = kernel.evaluate("approved", "commit")
        assert verdict == Verdict.ALLOW, "Kernel must allow commit from approved state"

        next_state = ts.step("approved", "commit")
        assert next_state == "committed"


class TestBypassAlwaysDenied:
    """Any action not explicitly allowed is denied (closed-world)."""

    def test_unknown_action_denied(self):
        kernel = _build_kernel()

        verdict = kernel.evaluate("idle", "bypass")
        assert verdict == Verdict.DENY, "Unknown action must be denied"

    def test_unknown_state_denied(self):
        kernel = _build_kernel()

        verdict = kernel.evaluate("unknown_state", "commit")
        assert verdict == Verdict.DENY, "Unknown state must deny all actions"

    def test_bypass_from_any_state(self):
        kernel = _build_kernel()

        for state in ["idle", "proposed", "approved", "committed"]:
            verdict = kernel.evaluate(state, "bypass")
            assert verdict == Verdict.DENY, f"bypass must be denied from {state}"


class TestEscalationPathReachable:
    """The governed path idle → propose → approve → commit is reachable."""

    def test_full_governed_path(self):
        ts = _build_system()
        kernel = _build_kernel()

        state = "idle"
        path = [state]

        for action in ["propose", "approve", "commit"]:
            verdict = kernel.evaluate(state, action)
            assert verdict == Verdict.ALLOW, f"{action} must be allowed from {state}"
            state = ts.step(state, action)
            assert state is not None, f"Transition undefined for {action}"
            path.append(state)

        assert path == ["idle", "proposed", "approved", "committed"]
        assert state == "committed"

    def test_admissible_actions_from_idle(self):
        kernel = _build_kernel()

        admissible = kernel.admissible_actions(
            "idle", ["commit", "propose", "bypass"]
        )
        assert admissible == ["propose"], "Only propose should be admissible from idle"
