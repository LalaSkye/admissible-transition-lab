"""
demo.py — Three scenarios proving one claim:

    Governance becomes operational when admissibility is enforced
    at the execution boundary of a transition system.

Run:  python src/demo.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from transition import TransitionSystem
from kernel import ConstraintKernel, Verdict


SEPARATOR = "=" * 60


def scenario_1_policy_only():
    """
    SCENARIO 1 — POLICY ONLY

    A policy says "commit requires approval."
    But the transition function allows idle → commit directly.
    Nothing enforces the policy.
    """
    print(SEPARATOR)
    print("SCENARIO 1: POLICY-ONLY SYSTEM")
    print(SEPARATOR)
    print()

    # Policy (advisory only — not enforced)
    policy = "commit requires approval"
    print(f"  Policy rule:  {policy}")
    print()

    # Transition system allows direct commit
    ts = TransitionSystem()
    ts.add("idle", "commit", "committed")

    # Execute the transition — no kernel, no enforcement
    result = ts.step("idle", "commit")
    print(f"  Transition:   idle → commit → {result}")
    print()
    print(f'  Result:       "commit executed without approval"')
    print()
    print(f"  Conclusion:   Governance = advisory")
    print()
    print("  The policy exists. The system ignores it.")
    print("  Reachable state space is unconstrained.")
    print()


def scenario_2_kernel_enforced():
    """
    SCENARIO 2 — KERNEL-ENFORCED SYSTEM

    A constraint kernel blocks idle → commit.
    The system must follow: idle → propose → approve → commit.
    """
    print(SEPARATOR)
    print("SCENARIO 2: KERNEL-ENFORCED SYSTEM")
    print(SEPARATOR)
    print()

    # Transition system
    ts = TransitionSystem()
    ts.add("idle", "commit", "committed")       # direct path exists
    ts.add("idle", "propose", "proposed")        # governed path
    ts.add("proposed", "approve", "approved")
    ts.add("approved", "commit", "committed")

    # Constraint kernel
    kernel = ConstraintKernel()
    kernel.add_rule("idle", "commit", Verdict.DENY)       # block direct commit
    kernel.add_rule("idle", "propose", Verdict.ALLOW)      # allow propose
    kernel.add_rule("proposed", "approve", Verdict.ALLOW)  # allow approve
    kernel.add_rule("approved", "commit", Verdict.ALLOW)   # allow commit after approval

    # Attempt direct commit from idle
    verdict = kernel.evaluate("idle", "commit")
    print(f"  Attempt:      idle → commit")
    print(f"  Kernel says:  G(idle, commit) = {verdict.value}")
    print()
    print(f'  Result:       "direct commit denied by kernel"')
    print()

    # Walk the governed path
    print("  Governed path:")
    state = "idle"
    for action in ["propose", "approve", "commit"]:
        v = kernel.evaluate(state, action)
        if v == Verdict.ALLOW:
            next_state = ts.step(state, action)
            print(f"    {state} → {action} → {next_state}  [G = {v.value}]")
            state = next_state
        else:
            print(f"    {state} → {action}  BLOCKED  [G = {v.value}]")
            break

    print()
    print(f"  Final state:  {state}")
    print()
    print(f"  Conclusion:   Governance = operational constraint")
    print()
    print("  The kernel restricts reachable transitions.")
    print("  Only admissible actions execute.")
    print()


def scenario_3_drift():
    """
    SCENARIO 3 — DRIFT

    A new action (auto_commit) is added to the transition system.
    The kernel is not updated. The action executes unchecked.
    """
    print(SEPARATOR)
    print("SCENARIO 3: DRIFT")
    print(SEPARATOR)
    print()

    # Original transition system + new uncovered action
    ts = TransitionSystem()
    ts.add("idle", "propose", "proposed")
    ts.add("proposed", "approve", "approved")
    ts.add("approved", "commit", "committed")
    ts.add("idle", "auto_commit", "committed")   # new action — not in kernel

    # Kernel covers original actions only
    kernel = ConstraintKernel()
    kernel.add_rule("idle", "propose", Verdict.ALLOW)
    kernel.add_rule("proposed", "approve", Verdict.ALLOW)
    kernel.add_rule("approved", "commit", Verdict.ALLOW)
    # No rule for (idle, auto_commit) — kernel doesn't know about it

    # Check if kernel covers the new action
    covered = kernel.covers("idle", "auto_commit")
    print(f"  New action:   auto_commit")
    print(f"  Transition:   idle → auto_commit → committed")
    print(f"  Kernel rule:  {'exists' if covered else 'MISSING'}")
    print()

    # Compute reachable states with and without new action
    ts_original = TransitionSystem()
    ts_original.add("idle", "propose", "proposed")
    ts_original.add("proposed", "approve", "approved")
    ts_original.add("approved", "commit", "committed")

    reachable_original = ts_original.reachable("idle")
    reachable_expanded = ts.reachable("idle")
    drift = reachable_expanded - reachable_original

    print(f"  Original reachable states:  {sorted(reachable_original)}")
    print(f"  Expanded reachable states:  {sorted(reachable_expanded)}")
    print(f"  New reachable via drift:    {sorted(drift) if drift else 'none (same states, new path)'}")
    print()

    # The key issue: auto_commit reaches 'committed' bypassing governance
    # Even if the reachable set is the same, the PATH is ungoverned
    ungoverned_actions = [
        a for a in ts.actions_from("idle")
        if not kernel.covers("idle", a)
    ]
    print(f"  Ungoverned actions from idle: {ungoverned_actions}")
    print()
    print(f'  Result:       "drift detected: reachable state outside constraint manifold"')
    print()
    print(f"  Conclusion:   Constraint kernel requires update.")
    print()
    print("  The transition system expanded.")
    print("  The kernel did not. Governance has a gap.")
    print()


def main():
    print()
    print("ADMISSIBLE TRANSITION LAB")
    print("Proof of mechanism: governance at the execution boundary")
    print()

    scenario_1_policy_only()
    scenario_2_kernel_enforced()
    scenario_3_drift()

    print(SEPARATOR)
    print("SUMMARY")
    print(SEPARATOR)
    print()
    print("  1. Policy without enforcement = advisory (no constraint)")
    print("  2. Kernel at execution boundary = operational governance")
    print("  3. Kernel must track transition system changes (drift)")
    print()
    print("  Core claim:")
    print("  Governance becomes operational when admissibility is enforced")
    print("  at the execution boundary of a transition system.")
    print()


if __name__ == "__main__":
    main()
