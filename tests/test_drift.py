"""
test_drift.py

Proves:
  1. Architecture changes without kernel updates create detectable drift
  2. New transitions expand the action space beyond kernel coverage
  3. Closed-world default catches uncovered actions but drift is still real

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


def _detect_drift(ts, kernel, state):
    """Return actions from state that the kernel has no explicit rule for."""
    return [a for a in ts.actions_from(state) if not kernel.covers(state, a)]


class TestArchitectureExpansion:
    """New transitions expand action space beyond kernel coverage."""

    def test_new_action_creates_ungoverned_path(self):
        ts_original = _build_original_system()
        ts_drifted = _build_drifted_system()

        assert ts_drifted.step("idle", "auto_commit") == "committed"
        assert ts_original.step("idle", "auto_commit") is None

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
        assert not kernel.covers("idle", "auto_commit")

    def test_uncovered_action_defaults_to_deny(self):
        kernel = _build_kernel()
        assert kernel.evaluate("idle", "auto_commit") == Verdict.DENY
        assert not kernel.may_execute("idle", "auto_commit")

    def test_drift_detected_by_coverage_gap(self):
        ts_drifted = _build_drifted_system()
        kernel = _build_kernel()

        drift = _detect_drift(ts_drifted, kernel, "idle")
        assert len(drift) > 0, "Must detect uncovered actions (drift)"
        assert "auto_commit" in drift

    def test_no_drift_in_original_system(self):
        ts_original = _build_original_system()
        kernel = _build_kernel()

        for state in ["idle", "proposed", "approved"]:
            drift = _detect_drift(ts_original, kernel, state)
            assert len(drift) == 0, f"Original system must have no drift from {state}"
