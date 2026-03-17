"""
test_drift.py

Proves:
  ✓ new transition expands reachable state space (or reachable paths)
  ✓ drift detected when kernel not updated

Tests must FAIL if the kernel is disabled.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from transition import TransitionSystem
from kernel import ConstraintKernel, Verdict


def _build_original_system():
    """Governed transition system without drift."""
    ts = TransitionSystem()
    ts.add("idle", "propose", "proposed")
    ts.add("proposed", "approve", "approved")
    ts.add("approved", "commit", "committed")
    return ts


def _build_drifted_system():
    """Transition system with an ungoverned auto_commit action."""
    ts = _build_original_system()
    ts.add("idle", "auto_commit", "committed")
    return ts


def _build_kernel():
    """Kernel covering only the original governed actions."""
    kernel = ConstraintKernel()
    kernel.add_rule("idle", "propose", Verdict.ALLOW)
    kernel.add_rule("proposed", "approve", Verdict.ALLOW)
    kernel.add_rule("approved", "commit", Verdict.ALLOW)
    return kernel


class TestReachableStateExpansion:
    """New transition expands the reachable state space or paths."""

    def test_new_action_creates_ungoverned_path(self):
        ts_original = _build_original_system()
        ts_drifted = _build_drifted_system()

        # auto_commit creates a direct path from idle to committed
        result = ts_drifted.step("idle", "auto_commit")
        assert result == "committed", "auto_commit must reach committed"

        # This path does not exist in the original system
        original_result = ts_original.step("idle", "auto_commit")
        assert original_result is None, "Original system must not have auto_commit"

    def test_drifted_system_has_more_actions(self):
        ts_original = _build_original_system()
        ts_drifted = _build_drifted_system()

        original_actions = ts_original.actions_from("idle")
        drifted_actions = ts_drifted.actions_from("idle")

        assert "auto_commit" not in original_actions
        assert "auto_commit" in drifted_actions
        assert len(drifted_actions) > len(original_actions)


class TestDriftDetection:
    """Drift detected when kernel not updated for new actions."""

    def test_kernel_does_not_cover_new_action(self):
        kernel = _build_kernel()

        covered = kernel.covers("idle", "auto_commit")
        assert not covered, "Kernel must not cover auto_commit"

    def test_uncovered_action_defaults_to_deny(self):
        kernel = _build_kernel()

        verdict = kernel.evaluate("idle", "auto_commit")
        assert verdict == Verdict.DENY, "Uncovered action must default to DENY"

    def test_drift_detected_by_coverage_check(self):
        """
        Drift = transition system has actions the kernel doesn't cover.
        This is the governance gap.
        """
        ts_drifted = _build_drifted_system()
        kernel = _build_kernel()

        all_actions_from_idle = ts_drifted.actions_from("idle")
        uncovered = [
            a for a in all_actions_from_idle
            if not kernel.covers("idle", a)
        ]

        assert len(uncovered) > 0, "Must detect uncovered actions (drift)"
        assert "auto_commit" in uncovered

    def test_no_drift_in_original_system(self):
        """Original system has no uncovered actions — no drift."""
        ts_original = _build_original_system()
        kernel = _build_kernel()

        for state in ["idle", "proposed", "approved"]:
            actions = ts_original.actions_from(state)
            uncovered = [a for a in actions if not kernel.covers(state, a)]
            assert len(uncovered) == 0, f"Original system must have no drift from {state}"
