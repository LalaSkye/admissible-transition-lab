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


def scenario_1():
    """
    SCENARIO 1 — POLICY-ONLY GOVERNANCE

    A policy says "commit requires approval."
    But the transition function allows idle → commit directly.
    Nothing enforces the policy.
    """
    print(SEPARATOR)
    print("SCENARIO 1: POLICY-ONLY GOVERNANCE")
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


def scenario_2():
    """
    SCENARIO 2 — KERNEL-ENFORCED GOVERNANCE

    A constraint kernel blocks idle → commit (DENY).
    A bypass attempt gets ESCALATE — blocked, authority required.
    The system must follow: idle → propose → approve → commit.
    """
    print(SEPARATOR)
    print("SCENARIO 2: KERNEL-ENFORCED GOVERNANCE")
    print(SEPARATOR)
    print()

    # Transition system
    ts = TransitionSystem()
    ts.add("idle", "commit", "committed")       # direct path exists
    ts.add("idle", "bypass", "committed")        # bypass path exists
    ts.add("idle", "propose", "proposed")        # governed path
    ts.add("proposed", "approve", "approved")
    ts.add("approved", "commit", "committed")

    # Constraint kernel
    kernel = ConstraintKernel()
    kernel.add_rule("idle", "commit", Verdict.DENY)        # block direct commit
    kernel.add_rule("idle", "bypass", Verdict.ESCALATE)    # block bypass, require authority
    kernel.add_rule("idle", "propose", Verdict.ALLOW)      # allow propose
    kernel.add_rule("proposed", "approve", Verdict.ALLOW)  # allow approve
    kernel.add_rule("approved", "commit", Verdict.ALLOW)   # allow commit after approval

    # Attempt direct commit from idle
    verdict = kernel.evaluate("idle", "commit")
    print(f"  Attempt 1:    idle → commit")
    print(f"  Kernel says:  G(idle, commit) = {verdict.value}")
    print(f"  Executes:     {kernel.may_execute('idle', 'commit')}")
    print()
    print(f'  Result:       "direct commit denied by kernel"')
    print()

    # Attempt bypass from idle
    verdict = kernel.evaluate("idle", "bypass")
    print(f"  Attempt 2:    idle → bypass")
    print(f"  Kernel says:  G(idle, bypass) = {verdict.value}")
    print(f"  Executes:     {kernel.may_execute('idle', 'bypass')}")
    print()
    print(f'  Result:       "bypass blocked — escalation event emitted, authority required"')
    print()

    # Walk the governed path
    print("  Governed path:")
    state = "idle"
    for action in ["propose", "approve", "commit"]:
        v = kernel.evaluate(state, action)
        if kernel.may_execute(state, action):
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
    print("  Execution semantics:")
    print("    ALLOW    → execute transition")
    print("    DENY     → block transition")
    print("    ESCALATE → block transition, emit escalation event")
    print()
    print("  Both DENY and ESCALATE prevent execution.")
    print("  Only admissible actions (ALLOW) execute.")
    print()


def scenario_3():
    """
    SCENARIO 3 — DRIFT VIA ARCHITECTURE EXPANSION

    A new action (auto_commit) is added to the transition system.
    The kernel is not updated. Governance has a gap.
    """
    print(SEPARATOR)
    print("SCENARIO 3: DRIFT VIA ARCHITECTURE EXPANSION")
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

    # Default DENY catches it — but the gap is the point
    verdict = kernel.evaluate("idle", "auto_commit")
    print(f"  G(idle, auto_commit) = {verdict.value}  (closed-world default)")
    print(f"  Executes:     {kernel.may_execute('idle', 'auto_commit')}")
    print()

    # Detect ungoverned actions
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
    print("  Closed-world default (DENY) catches the action,")
    print("  but the kernel has no explicit rule — drift is real.")
    print()


def main():
    print()
    print("ADMISSIBLE TRANSITION LAB")
    print("Proof of mechanism: governance at the execution boundary")
    print()

    scenario_1()
    scenario_2()
    scenario_3()

    print(SEPARATOR)
    print("SUMMARY")
    print(SEPARATOR)
    print()
    print("  1. Policy-only governance      = advisory (no constraint)")
    print("  2. Kernel-enforced governance   = operational (transitions restricted)")
    print("  3. Drift via architecture expansion = governance gap (kernel stale)")
    print()
    print("  Execution semantics:")
    print("    ALLOW    → execute")
    print("    DENY     → block")
    print("    ESCALATE → block + require authority")
    print()
    print("  Core claim:")
    print("  Governance becomes operational when admissibility is enforced")
    print("  at the execution boundary of a transition system.")
    print()


if __name__ == "__main__":
    main()
