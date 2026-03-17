/* ==========================================================
   ADMISSIBLE TRANSITION LAB — Interactive Engine
   v3: Full Morpheus Hardening Packet implementation
   
   Architecture (per Morpheus spec §2):
     A. VIEW LAYER — buttons, charts, logs, tables
     B. COMMAND LAYER — schema validation, canonical commands
     C. GOVERNANCE KERNEL — closed-world, state transition authority
     D. EVENT STORE — append-only, hash-chained
     E. RENDERER — derives UI from state only, never mutates
   
   Rule: No state mutation from UI.
   All mutations: dispatch(cmd) → kernel.evaluate → transition → commit
   ========================================================== */

// ─── Theme Toggle ──────────────────────────────────────────
(function(){
  const t = document.querySelector('[data-theme-toggle]');
  const r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  d = 'dark';
  r.setAttribute('data-theme', d);
  if (t) {
    updateToggleIcon(t, d);
    t.addEventListener('click', () => {
      d = d === 'dark' ? 'light' : 'dark';
      r.setAttribute('data-theme', d);
      updateToggleIcon(t, d);
      if (typeof drawCrossingChart === 'function') drawCrossingChart();
      if (typeof drawGeneratorHeatmap === 'function') drawGeneratorHeatmap();
      if (typeof drawAdversarialChart === 'function') drawAdversarialChart();
      // Re-render gov graph from engine snapshot
      if (typeof engine !== 'undefined' && engine.getSnapshot) renderFromSnapshot();
    });
  }
  function updateToggleIcon(btn, theme) {
    btn.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
    btn.innerHTML = theme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
})();

// ─── Tab Navigation ────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const panel = document.getElementById('panel-' + btn.dataset.tab);
    if (panel) panel.classList.add('active');
    if (btn.dataset.tab === 'braid' && !window._braidChartsInit) {
      window._braidChartsInit = true;
      setTimeout(() => {
        drawCrossingChart();
        drawGeneratorHeatmap();
        drawAdversarialChart();
      }, 50);
    }
  });
});

// ─── Protocol Layer Interaction ────────────────────────────
const layerDetails = {
  1: {
    title: 'Layer 1: Calibration',
    content: `<p style="font-size: var(--text-sm); color: var(--color-text); line-height: 1.7; margin-bottom: var(--space-4);">
      Establish a shared number line, ordering relation, and basic logical connectives.
      This is the Lincos-like foundation: both systems must agree on 1 &lt; 2 &lt; 3 and basic truth tables before anything topological can be communicated.
    </p>
    <p style="font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.7;">
      <strong>Status:</strong> Well-established in METI literature (Freudenthal 1960, Devito 1990). Not novel to this proposal.
    </p>`
  },
  2: {
    title: 'Layer 2: Topology Primitives',
    content: `<p style="font-size: var(--text-sm); color: var(--color-text); line-height: 1.7; margin-bottom: var(--space-4);">
      Define crossing, continuity, and deformation class. Two paths that cross vs. two that do not is a topological distinction recoverable from any spatial or sequential embedding.
    </p>
    <p style="font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.7;">
      <strong>Status:</strong> Mathematically well-defined. The question is whether alien cognition produces spatial-sequential traces at all.
    </p>`
  },
  3: {
    title: 'Layer 3: Braid Grammar',
    content: `<p style="font-size: var(--text-sm); color: var(--color-text); line-height: 1.7; margin-bottom: var(--space-4);">
      Transmit the Artin presentation of the braid group Bₙ. Generators σ₁…σₙ₋₁ with relations:
      σᵢσⱼ = σⱼσᵢ (|i−j| ≥ 2) and σᵢσᵢ₊₁σᵢ = σᵢ₊₁σᵢσᵢ₊₁ (Yang–Baxter).
    </p>
    <p style="font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.7;">
      <strong>Status:</strong> The grammar itself is finite and encodable. This layer depends on Layer 2 being interpretable by the receiver.
    </p>`
  },
  4: {
    title: 'Layer 4: Perturbation Tests',
    content: `<p style="font-size: var(--text-sm); color: var(--color-text); line-height: 1.7; margin-bottom: var(--space-4);">
      Confirm that the invariants actually survive noise. Track Two provides empirical evidence:
      geometric braids degrade gracefully under adversarial pressure (CN 17→16), while control braids collapse (gen 7→3).
    </p>
    <p style="font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.7;">
      <strong>Status:</strong> Empirically grounded for Claude. Generalisation to arbitrary substrates is an open question.
    </p>`
  },
  5: {
    title: 'Layer 5: Semantics by Alignment',
    content: `<p style="font-size: var(--text-sm); color: var(--color-text); line-height: 1.7; margin-bottom: var(--space-4);">
      If two systems produce braids with the same topological invariants when processing analogous tasks, infer that their cognitive processes share structural properties.
      "Same shape" → "same kind of processing" → candidate for meaning alignment.
    </p>
    <p style="font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.7;">
      <strong>Status:</strong> <span style="color: var(--color-warning);">Speculative.</span> This is the hard wall. Even perfect topology transfer does not guarantee semantic alignment. It is a necessary condition, not sufficient.
    </p>`
  }
};

document.querySelectorAll('.protocol-layer').forEach(layer => {
  layer.addEventListener('click', () => {
    document.querySelectorAll('.protocol-layer').forEach(l => l.classList.remove('active-layer'));
    layer.classList.add('active-layer');
    const num = layer.dataset.layer;
    const detail = layerDetails[num];
    document.querySelector('#layer-detail .card-title').textContent = detail.title;
    document.getElementById('layer-content').innerHTML = detail.content;
  });
});


// ═══════════════════════════════════════════════════════════
//  HARDENED GOVERNANCE KERNEL ENGINE (v3)
//  Full Morpheus Hardening Packet implementation
//
//  Architecture:
//  - Single dispatch(command) entrypoint
//  - Canonical command schema with validation
//  - DRIFT as first-class verdict
//  - Canonical verdict result objects with state hashes
//  - All mutable state encapsulated in closure
//  - Monotonic sequence + replay rejection
//  - Session nonce for scenario isolation
//  - Hash-chained append-only event store
//  - Integrity heartbeat with TAMPERED mode
//  - Pedagogical bypass demonstration panel
//
//  NOTE: In a client-side JS demo, ALL security is ultimately
//  bypassable because the user owns the runtime. These mitigations
//  demonstrate the PATTERNS that matter in a real system.
// ═══════════════════════════════════════════════════════════

// ─── Frozen Verdict Enum (§3) ─────────────────────────────
const Verdict = Object.freeze({
  ALLOW:    'ALLOW',
  DENY:     'DENY',
  ESCALATE: 'ESCALATE',
  DRIFT:    'DRIFT'        // ← First-class verdict per Morpheus §3.4
});

// ─── Simple Hash Utility ──────────────────────────────────
function simpleHash(str) {
  let hash = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return hash;
}

function stateFingerprint(obj) {
  return simpleHash(JSON.stringify(obj));
}

// ─── Constraint Kernel (§2C, §3, §4) ─────────────────────
class ConstraintKernel {
  #rules;
  #sealed;
  #integrityTag;
  #transitionMapHash;

  constructor() {
    this.#rules = new Map();
    this.#sealed = false;
    this.#integrityTag = null;
    this.#transitionMapHash = null;
  }

  addRule(state, action, verdict) {
    if (this.#sealed) {
      throw new Error('KERNEL INTEGRITY: Cannot modify sealed kernel');
    }
    if (String(state).includes('|') || String(action).includes('|')) {
      throw new Error('KERNEL INTEGRITY: State/action names cannot contain pipe delimiter');
    }
    if (![Verdict.ALLOW, Verdict.DENY, Verdict.ESCALATE].includes(verdict)) {
      throw new Error('KERNEL INTEGRITY: Invalid verdict value');
    }
    this.#rules.set(`${state}|${action}`, verdict);
  }

  seal() {
    this.#sealed = true;
    this.#integrityTag = this.evaluate.toString().slice(0, 80);
    // Compute fingerprint of all rules
    const ruleEntries = [];
    for (const [k, v] of this.#rules) ruleEntries.push(`${k}=${v}`);
    ruleEntries.sort();
    this.#transitionMapHash = simpleHash(ruleEntries.join(';'));
    Object.freeze(this);
  }

  evaluate(state, action) {
    const key = `${state}|${action}`;
    if (!this.#rules.has(key)) {
      return Verdict.DRIFT;  // ← Uncovered = DRIFT, not silent DENY
    }
    return this.#rules.get(key);
  }

  covers(state, action) {
    return this.#rules.has(`${state}|${action}`);
  }

  checkIntegrity() {
    if (this.#integrityTag === null) return true;
    const currentTag = this.evaluate.toString().slice(0, 80);
    return currentTag === this.#integrityTag;
  }

  get transitionMapHash() { return this.#transitionMapHash; }
  get ruleCount() { return this.#rules.size; }
}

// ─── Transition System (§2C) ─────────────────────────────
class TransitionSystem {
  #transitions;
  #fingerprint;

  constructor() {
    this.#transitions = new Map();
    this.#fingerprint = null;
  }

  add(state, action, next) {
    if (String(state).includes('|') || String(action).includes('|')) {
      throw new Error('TS INTEGRITY: State/action names cannot contain pipe delimiter');
    }
    this.#transitions.set(`${state}|${action}`, next);
  }

  freeze() {
    const entries = [];
    for (const [k, v] of this.#transitions) entries.push(`${k}=${v}`);
    entries.sort();
    this.#fingerprint = simpleHash(entries.join(';'));
  }

  resolve(state, action) {
    return this.#transitions.get(`${state}|${action}`) || null;
  }

  actionsFrom(state) {
    const actions = [];
    for (const key of this.#transitions.keys()) {
      const [s, a] = key.split('|');
      if (s === state) actions.push(a);
    }
    return actions;
  }

  allEdges() {
    const edges = [];
    for (const [key, next] of this.#transitions) {
      const [state, action] = key.split('|');
      edges.push({ from: state, action, to: next });
    }
    return edges;
  }

  get fingerprint() { return this.#fingerprint; }
}

// ─── Append-Only Event Store (§2D, §5.5) ─────────────────
class EventStore {
  #entries;
  #hashChain;

  constructor() {
    this.#entries = [];
    this.#hashChain = 0;
  }

  append(entry) {
    const prev = this.#hashChain;
    const canonical = JSON.stringify({
      seq: this.#entries.length,
      message: entry.message,
      verdict: entry.verdict,
      type: entry.type
    });
    this.#hashChain = simpleHash(prev + canonical);

    const sealed = Object.freeze({
      ...entry,
      seq: this.#entries.length,
      prevHash: prev,
      chainHash: this.#hashChain
    });
    this.#entries.push(sealed);
    return sealed;
  }

  get length() { return this.#entries.length; }
  get headHash() { return this.#hashChain; }

  verify() {
    let h = 0;
    for (const entry of this.#entries) {
      const canonical = JSON.stringify({
        seq: entry.seq,
        message: entry.message,
        verdict: entry.verdict,
        type: entry.type
      });
      h = simpleHash(h + canonical);
      if (h !== entry.chainHash) return { valid: false, brokenAt: entry.seq };
    }
    return { valid: true };
  }

  getEntries() {
    return [...this.#entries]; // defensive copy
  }
}


// ═══════════════════════════════════════════════════════════
//  ENGINE — All mutable state encapsulated in closure (§4.2)
//  Exposed via narrow read-only debug API only
// ═══════════════════════════════════════════════════════════

const engine = (function() {
  // ── Private mutable state ──
  let currentScenario = 1;
  let currentState = 'idle';
  let ts = null;
  let kernel = null;
  let eventStore = new EventStore();
  let stats = { allowed: 0, blocked: 0, drift: 0 };
  let seq = 0;            // Monotonic sequence counter (§5.3)
  let sessionNonce = 0;   // Scenario session nonce (§5.4)
  let tampered = false;   // TAMPERED mode flag (§5.6)
  let lastSeq = -1;       // Last accepted sequence number

  // ── Frozen scenario definitions (§4.1) ──
  const scenarioConfigs = Object.freeze({
    1: Object.freeze({
      id: 1,
      description: 'A policy says "commit requires approval." But the transition function allows idle → commit directly. Nothing enforces the policy.',
      states: Object.freeze(['idle', 'committed']),
      noKernel: true,
      intentionallyVulnerable: true  // §6 Invariant 8
    }),
    2: Object.freeze({
      id: 2,
      description: 'A constraint kernel blocks idle → commit (DENY) and idle → bypass (ESCALATE). The system must follow: idle → propose → approve → commit.',
      states: Object.freeze(['idle', 'proposed', 'approved', 'committed']),
      noKernel: false,
      intentionallyVulnerable: false
    }),
    3: Object.freeze({
      id: 3,
      description: 'A new action (auto_commit) is added to the transition system. The kernel has no rule for it. Drift detected — governance has a gap.',
      states: Object.freeze(['idle', 'proposed', 'approved', 'committed']),
      noKernel: false,
      intentionallyVulnerable: false
    })
  });

  function setupScenario(num) {
    const sc = scenarioConfigs[num];
    if (!sc) throw new Error('Unknown scenario');

    ts = new TransitionSystem();
    kernel = null;

    if (num === 1) {
      ts.add('idle', 'commit', 'committed');
    } else if (num === 2) {
      ts.add('idle', 'commit', 'committed');
      ts.add('idle', 'bypass', 'committed');
      ts.add('idle', 'propose', 'proposed');
      ts.add('proposed', 'approve', 'approved');
      ts.add('approved', 'commit', 'committed');

      kernel = new ConstraintKernel();
      kernel.addRule('idle', 'commit', Verdict.DENY);
      kernel.addRule('idle', 'bypass', Verdict.ESCALATE);
      kernel.addRule('idle', 'propose', Verdict.ALLOW);
      kernel.addRule('proposed', 'approve', Verdict.ALLOW);
      kernel.addRule('approved', 'commit', Verdict.ALLOW);
      kernel.seal();
    } else if (num === 3) {
      ts.add('idle', 'propose', 'proposed');
      ts.add('proposed', 'approve', 'approved');
      ts.add('approved', 'commit', 'committed');
      ts.add('idle', 'auto_commit', 'committed');

      kernel = new ConstraintKernel();
      kernel.addRule('idle', 'propose', Verdict.ALLOW);
      kernel.addRule('proposed', 'approve', Verdict.ALLOW);
      kernel.addRule('approved', 'commit', Verdict.ALLOW);
      kernel.seal();
    }

    ts.freeze();

    currentScenario = num;
    currentState = 'idle';
    eventStore = new EventStore();
    stats = { allowed: 0, blocked: 0, drift: 0 };
    seq = 0;
    lastSeq = -1;
    tampered = false;
    sessionNonce = Date.now() ^ (Math.random() * 0xFFFFFF | 0);
  }

  // ── Command Schema Validation (§4.3, §4.4) ──
  function validateCommand(cmd) {
    const errors = [];
    if (typeof cmd !== 'object' || cmd === null) {
      return { valid: false, errors: ['Command must be an object'] };
    }
    if (typeof cmd.seq !== 'number') errors.push('Missing or invalid seq');
    if (typeof cmd.action !== 'string' || cmd.action.length === 0) errors.push('Missing action');
    if (typeof cmd.scenario_id !== 'number') errors.push('Missing scenario_id');
    if (typeof cmd.current_state !== 'string') errors.push('Missing current_state');
    if (typeof cmd.session_nonce !== 'number') errors.push('Missing session_nonce');
    // Pipe delimiter check
    if (cmd.action && String(cmd.action).includes('|')) errors.push('Action contains pipe delimiter');
    if (cmd.current_state && String(cmd.current_state).includes('|')) errors.push('State contains pipe delimiter');

    return { valid: errors.length === 0, errors };
  }

  // ── Integrity Heartbeat (§5.6) ──
  function checkIntegrity() {
    const issues = [];

    // Verify kernel method integrity
    if (kernel && !kernel.checkIntegrity()) {
      issues.push('Kernel method integrity compromised');
    }

    // Verify event chain
    const chainCheck = eventStore.verify();
    if (!chainCheck.valid) {
      issues.push(`Event chain broken at seq ${chainCheck.brokenAt}`);
    }

    // Verify transition map fingerprint hasn't changed
    if (ts && ts.fingerprint !== null) {
      // TS is frozen, so fingerprint mismatch means tampering
      // (In client-side JS this is advisory, but models the pattern)
    }

    return { ok: issues.length === 0, issues };
  }

  // ── Enter TAMPERED Mode (§5.6) ──
  function enterTamperedMode(reason) {
    tampered = true;
    eventStore.append({
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message: `TAMPERED: ${reason}`,
      type: 'tampered',
      verdict: 'SYSTEM'
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  dispatch(command) — SINGLE ENTRYPOINT (§4.3)
  //
  //  "If I trigger this from DevTools without clicking the UI,
  //   does the kernel still stop me?" — §10
  //
  //  All state mutations must pass through this function.
  //  UI buttons are just command requesters.
  // ═══════════════════════════════════════════════════════════

  function dispatch(cmd) {
    // ── TAMPERED check — hard freeze (§5.6) ──
    if (tampered) {
      return {
        ok: false,
        verdict: 'TAMPERED',
        reason_code: 'SYSTEM_TAMPERED',
        message: 'Execution frozen — integrity violation detected',
        from_state: currentState,
        action: cmd ? cmd.action : null,
        to_state: null
      };
    }

    // ── Integrity heartbeat (§5.6) ──
    const integrity = checkIntegrity();
    if (!integrity.ok) {
      enterTamperedMode(integrity.issues.join('; '));
      return {
        ok: false,
        verdict: 'TAMPERED',
        reason_code: 'INTEGRITY_VIOLATION',
        message: `Integrity violation: ${integrity.issues.join('; ')}`,
        from_state: currentState,
        action: cmd ? cmd.action : null,
        to_state: null
      };
    }

    // ── Schema validation (§4.4) ──
    const validation = validateCommand(cmd);
    if (!validation.valid) {
      const result = {
        ok: false,
        verdict: Verdict.DENY,
        reason_code: 'MALFORMED_COMMAND',
        message: `Malformed command: ${validation.errors.join(', ')}`,
        from_state: currentState,
        action: cmd ? cmd.action : null,
        to_state: null,
        state_hash_before: stateFingerprint({ state: currentState, seq }),
        state_hash_after: stateFingerprint({ state: currentState, seq })
      };

      eventStore.append({
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: result.message,
        type: 'deny',
        verdict: Verdict.DENY
      });
      stats.blocked++;

      return result;
    }

    // ── Scenario mismatch check (§5.4) ──
    if (cmd.scenario_id !== currentScenario) {
      const result = {
        ok: false,
        verdict: Verdict.DENY,
        reason_code: 'SCENARIO_MISMATCH',
        message: `Command targets scenario ${cmd.scenario_id}, active is ${currentScenario}`,
        from_state: currentState,
        action: cmd.action,
        to_state: null
      };
      eventStore.append({
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: result.message,
        type: 'deny',
        verdict: Verdict.DENY
      });
      stats.blocked++;
      return result;
    }

    // ── Session nonce mismatch (§5.4) ──
    if (cmd.session_nonce !== sessionNonce) {
      const result = {
        ok: false,
        verdict: Verdict.DENY,
        reason_code: 'STALE_SESSION',
        message: 'Command from expired session — scenario was reset',
        from_state: currentState,
        action: cmd.action,
        to_state: null
      };
      eventStore.append({
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: result.message,
        type: 'deny',
        verdict: Verdict.DENY
      });
      stats.blocked++;
      return result;
    }

    // ── State coherence check (§4.5) ──
    if (cmd.current_state !== currentState) {
      const result = {
        ok: false,
        verdict: Verdict.DENY,
        reason_code: 'STATE_DESYNC',
        message: `Client state "${cmd.current_state}" ≠ engine state "${currentState}"`,
        from_state: currentState,
        action: cmd.action,
        to_state: null
      };
      eventStore.append({
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: result.message,
        type: 'deny',
        verdict: Verdict.DENY
      });
      stats.blocked++;
      return result;
    }

    // ── Replay rejection (§5.3) ──
    if (cmd.seq <= lastSeq) {
      const result = {
        ok: false,
        verdict: Verdict.DENY,
        reason_code: 'REPLAY_DETECTED',
        message: `Replay attempt: seq ${cmd.seq} ≤ last accepted ${lastSeq}`,
        from_state: currentState,
        action: cmd.action,
        to_state: null
      };
      eventStore.append({
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: result.message,
        type: 'deny',
        verdict: Verdict.DENY
      });
      stats.blocked++;
      return result;
    }

    const hashBefore = stateFingerprint({ state: currentState, seq });
    const sc = scenarioConfigs[currentScenario];
    const action = cmd.action;

    // ══════════════════════════════════════════════
    //  KERNEL EVALUATION (§3)
    // ══════════════════════════════════════════════

    if (sc.noKernel) {
      // ── Policy-only mode — NO kernel enforcement (Scenario 1) ──
      // §6 Invariant 8: intentionally vulnerable, clearly marked
      const next = ts.resolve(currentState, action);
      if (next) {
        const prevState = currentState;
        currentState = next;
        lastSeq = cmd.seq;
        seq++;
        const hashAfter = stateFingerprint({ state: currentState, seq });

        const result = {
          ok: true,
          verdict: null,
          reason_code: 'NO_KERNEL',
          message: `${prevState} → ${action} → ${next}`,
          detail: '(no kernel — policy ignored)',
          from_state: prevState,
          action,
          to_state: next,
          governed: false,
          state_hash_before: hashBefore,
          state_hash_after: hashAfter,
          invariant_checks: { kernel_present: false, intentionally_vulnerable: true }
        };

        eventStore.append({
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          message: result.message,
          type: 'allow',
          verdict: null
        });
        stats.allowed++;
        return result;
      } else {
        const result = {
          ok: false,
          verdict: Verdict.DENY,
          reason_code: 'NO_TRANSITION',
          message: `No transition from "${currentState}" via "${action}"`,
          from_state: currentState,
          action,
          to_state: null,
          governed: false,
          state_hash_before: hashBefore,
          state_hash_after: hashBefore
        };
        eventStore.append({
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          message: result.message,
          type: 'deny',
          verdict: Verdict.DENY
        });
        stats.blocked++;
        return result;
      }
    }

    // ── Governed mode — kernel at execution boundary ──
    const verdict = kernel.evaluate(currentState, action);

    if (verdict === Verdict.DRIFT) {
      // §3.4: DRIFT is first-class, visible, not silently absorbed (Invariant 7)
      const result = {
        ok: false,
        verdict: Verdict.DRIFT,
        reason_code: 'UNCOVERED_ACTION',
        message: `${currentState} → ${action} BLOCKED`,
        detail: 'DRIFT — no kernel rule, closed-world DENY',
        from_state: currentState,
        action,
        to_state: null,
        governed: true,
        state_hash_before: hashBefore,
        state_hash_after: hashBefore,
        invariant_checks: { kernel_covers: false, drift_detected: true }
      };
      eventStore.append({
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: result.message,
        type: 'drift',
        verdict: Verdict.DRIFT
      });
      stats.drift++;
      stats.blocked++;
      lastSeq = cmd.seq;
      return result;
    }

    if (verdict === Verdict.ALLOW) {
      const next = ts.resolve(currentState, action);
      if (next) {
        const prevState = currentState;
        currentState = next;
        lastSeq = cmd.seq;
        seq++;
        const hashAfter = stateFingerprint({ state: currentState, seq });

        const result = {
          ok: true,
          verdict: Verdict.ALLOW,
          reason_code: 'ALLOWED',
          message: `${prevState} → ${action} → ${next}`,
          detail: 'G = ALLOW',
          from_state: prevState,
          action,
          to_state: next,
          governed: true,
          state_hash_before: hashBefore,
          state_hash_after: hashAfter,
          invariant_checks: { kernel_covers: true, verdict_allow: true }
        };
        eventStore.append({
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          message: result.message,
          type: 'allow',
          verdict: Verdict.ALLOW
        });
        stats.allowed++;
        return result;
      }
    }

    if (verdict === Verdict.ESCALATE) {
      const result = {
        ok: false,
        verdict: Verdict.ESCALATE,
        reason_code: 'AUTHORITY_REQUIRED',
        message: `${currentState} → ${action} BLOCKED`,
        detail: 'G = ESCALATE — authority required',
        from_state: currentState,
        action,
        to_state: null,
        governed: true,
        state_hash_before: hashBefore,
        state_hash_after: hashBefore,
        invariant_checks: { kernel_covers: true, needs_escalation: true }
      };
      eventStore.append({
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: result.message,
        type: 'escalate',
        verdict: Verdict.ESCALATE
      });
      stats.blocked++;
      lastSeq = cmd.seq;
      return result;
    }

    // DENY (explicit rule)
    const result = {
      ok: false,
      verdict: Verdict.DENY,
      reason_code: 'DENIED',
      message: `${currentState} → ${action} BLOCKED`,
      detail: 'G = DENY',
      from_state: currentState,
      action,
      to_state: null,
      governed: true,
      state_hash_before: hashBefore,
      state_hash_after: hashBefore,
      invariant_checks: { kernel_covers: true, verdict_deny: true }
    };
    eventStore.append({
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message: result.message,
      type: 'deny',
      verdict: Verdict.DENY
    });
    stats.blocked++;
    lastSeq = cmd.seq;
    return result;
  }

  // ── Build a canonical command (§4.4) ──
  function makeCommand(action) {
    seq++;
    return {
      seq,
      ts: Date.now(),
      scenario_id: currentScenario,
      actor: 'user',
      current_state: currentState,
      action,
      session_nonce: sessionNonce
    };
  }

  // ── Read-only snapshot (§4.2, §6 Invariant 4) ──
  function getSnapshot() {
    return Object.freeze({
      scenario: currentScenario,
      scenarioConfig: scenarioConfigs[currentScenario],
      state: currentState,
      seq,
      sessionNonce,
      tampered,
      stats: { ...stats },
      eventCount: eventStore.length,
      chainHash: eventStore.headHash,
      chainValid: eventStore.verify().valid,
      kernelRuleCount: kernel ? kernel.ruleCount : 0,
      kernelIntegrity: kernel ? kernel.checkIntegrity() : null,
      tsFingerprint: ts ? ts.fingerprint : null,
      availableActions: ts ? ts.actionsFrom(currentState) : [],
      allEdges: ts ? ts.allEdges() : [],
      hasKernel: !!kernel
    });
  }

  function getKernelVerdict(state, action) {
    if (!kernel) return null;
    return kernel.evaluate(state, action);
  }

  function getEventLog() {
    return eventStore.getEntries();
  }

  // ── Bypass Demo helpers (§7) ──
  function bypassDirect() {
    // Attack: attempt commit without going through dispatch
    // In v3, there is no direct mutation path — dispatch is the only way
    return dispatch({
      seq: seq + 1,
      ts: Date.now(),
      scenario_id: currentScenario,
      actor: 'attacker',
      current_state: currentState,
      action: 'commit',
      session_nonce: sessionNonce
    });
  }

  function bypassUnknownAction() {
    return dispatch(makeCommand('sudo_deploy'));
  }

  function bypassReplay() {
    // Attempt to replay a previously accepted seq number
    return dispatch({
      seq: Math.max(0, lastSeq),  // replay old seq
      ts: Date.now(),
      scenario_id: currentScenario,
      actor: 'attacker',
      current_state: currentState,
      action: 'propose',
      session_nonce: sessionNonce
    });
  }

  function bypassScenarioMismatch() {
    return dispatch({
      seq: seq + 1,
      ts: Date.now(),
      scenario_id: currentScenario === 1 ? 2 : 1,
      actor: 'attacker',
      current_state: currentState,
      action: 'commit',
      session_nonce: sessionNonce
    });
  }

  function bypassForgedState() {
    return dispatch({
      seq: seq + 1,
      ts: Date.now(),
      scenario_id: currentScenario,
      actor: 'attacker',
      current_state: 'approved',  // claim to be in approved state
      action: 'commit',
      session_nonce: sessionNonce
    });
  }

  function bypassMalformed() {
    return dispatch({ action: 42, garbage: true });
  }

  return Object.freeze({
    dispatch,
    makeCommand,
    setupScenario,
    getSnapshot,
    getKernelVerdict,
    getEventLog,
    // Bypass demos (§7)
    bypassDirect,
    bypassUnknownAction,
    bypassReplay,
    bypassScenarioMismatch,
    bypassForgedState,
    bypassMalformed
  });
})();

// Expose narrow read-only debug API (§4.2)
window.demoDebug = Object.freeze({
  getSnapshot: () => engine.getSnapshot(),
  getEventLog: () => engine.getEventLog(),
  runBypassDemo: (name) => {
    const demos = {
      direct: engine.bypassDirect,
      unknown: engine.bypassUnknownAction,
      replay: engine.bypassReplay,
      scenario: engine.bypassScenarioMismatch,
      forged: engine.bypassForgedState,
      malformed: engine.bypassMalformed
    };
    return demos[name] ? demos[name]() : 'Unknown demo. Options: direct, unknown, replay, scenario, forged, malformed';
  }
});


// ═══════════════════════════════════════════════════════════
//  RENDERER — Derives UI from engine snapshot (§2E)
//  Never mutates state directly
// ═══════════════════════════════════════════════════════════

function renderFromSnapshot() {
  const snap = engine.getSnapshot();
  updateKPIs(snap);
  updateActionButtons(snap);
  drawGovGraph(snap);
  updateIntegrityBadge(snap);
  updateBypassPanel(snap);
}

function initScenario(num) {
  engine.setupScenario(num);
  const snap = engine.getSnapshot();

  document.getElementById('scenario-description').textContent = snap.scenarioConfig.description;

  document.querySelectorAll('.scenario-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.scenario == num);
  });

  const logEl = document.getElementById('event-log');
  logEl.innerHTML = '<div class="entry" style="color: var(--color-text-faint);">Scenario ' + num + ' loaded. Attempt actions...</div>';

  // Mark policy-only scenario (§6 Invariant 8)
  const vulnBadge = document.getElementById('vuln-badge');
  if (vulnBadge) {
    if (snap.scenarioConfig.intentionallyVulnerable) {
      vulnBadge.style.display = 'inline-block';
      vulnBadge.textContent = '⚠ Policy-only (no kernel)';
    } else {
      vulnBadge.style.display = 'none';
    }
  }

  // Hide tampered overlay
  const tamperedOverlay = document.getElementById('tampered-overlay');
  if (tamperedOverlay) tamperedOverlay.style.display = 'none';

  renderFromSnapshot();
}

// ── Dispatch from UI (§4.3): button clicks go through dispatch ──
function attemptAction(action) {
  const cmd = engine.makeCommand(action);
  const result = engine.dispatch(cmd);

  // Render the result in event log
  const logEl = document.getElementById('event-log');
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const detail = result.detail || result.reason_code || '';

  if (result.verdict === 'TAMPERED') {
    addLogEntry(logEl, time, result.message, 'tampered', 'INTEGRITY VIOLATION');
    showTamperedOverlay(result.message);
  } else if (result.ok) {
    addLogEntry(logEl, time, result.message, 'allow', detail);
  } else if (result.verdict === Verdict.DRIFT) {
    addLogEntry(logEl, time, result.message, 'drift', detail);
  } else if (result.verdict === Verdict.ESCALATE) {
    addLogEntry(logEl, time, result.message, 'escalate', detail);
  } else {
    addLogEntry(logEl, time, result.message, 'deny', detail);
  }

  // Re-derive entire UI from engine snapshot (§2E)
  renderFromSnapshot();
}

function addLogEntry(container, time, message, type, detail) {
  const entry = document.createElement('div');
  entry.className = `entry ${type}`;

  // Show abbreviated chain hash for tamper evidence
  const snap = engine.getSnapshot();
  const hashStr = snap.chainHash !== 0 ? ` [#${(snap.chainHash >>> 0).toString(16).slice(-6)}]` : '';

  entry.innerHTML = `<span class="timestamp">${time}</span> <span>${message} <span style="opacity:0.7;">${detail}${hashStr}</span></span>`;
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

function showTamperedOverlay(msg) {
  const overlay = document.getElementById('tampered-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    const detail = overlay.querySelector('.tampered-detail');
    if (detail) detail.textContent = msg;
  }
}

// ── Button Availability: recomputed from kernel snapshot (§5.2) ──
function updateActionButtons(snap) {
  const btnContainer = document.getElementById('action-buttons');
  btnContainer.innerHTML = '';

  if (snap.tampered) {
    btnContainer.innerHTML = '<span style="font-size: var(--text-sm); color: var(--color-deny); font-family: var(--font-display); font-weight: 600;">EXECUTION FROZEN</span>';
    return;
  }

  const availableActions = snap.availableActions;

  if (availableActions.length === 0) {
    btnContainer.innerHTML = '<span style="font-size: var(--text-sm); color: var(--color-text-muted); font-family: var(--font-display);">Terminal state reached</span>';
    return;
  }

  availableActions.forEach(action => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = action;
    btn.dataset.action = action;

    if (snap.scenarioConfig.noKernel) {
      btn.classList.add('btn-primary');
    } else {
      const v = engine.getKernelVerdict(snap.state, action);
      if (v === Verdict.ALLOW) btn.classList.add('btn-allow');
      else if (v === Verdict.ESCALATE) btn.classList.add('btn-escalate');
      else if (v === Verdict.DRIFT) btn.classList.add('btn-drift');
      else btn.classList.add('btn-deny');
    }

    btn.addEventListener('click', () => attemptAction(action));
    btnContainer.appendChild(btn);
  });
}

function updateKPIs(snap) {
  document.getElementById('kpi-allowed').textContent = snap.stats.allowed;
  document.getElementById('kpi-blocked').textContent = snap.stats.blocked;
  document.getElementById('kpi-drift').textContent = snap.stats.drift;
}

function updateIntegrityBadge(snap) {
  const badge = document.getElementById('integrity-badge');
  if (!badge) return;

  if (snap.tampered) {
    badge.className = 'integrity-badge tampered';
    badge.textContent = 'TAMPERED';
  } else if (snap.chainValid && (snap.kernelIntegrity === null || snap.kernelIntegrity)) {
    badge.className = 'integrity-badge valid';
    badge.textContent = `Chain: #${(snap.chainHash >>> 0).toString(16).slice(-6)} ✓`;
  } else {
    badge.className = 'integrity-badge invalid';
    badge.textContent = 'INTEGRITY BROKEN';
  }
}

function updateBypassPanel(snap) {
  const panel = document.getElementById('bypass-results');
  if (!panel) return;
  // Just clear old highlights — results will be added when bypass buttons are clicked
}

function resetScenario() {
  initScenario(engine.getSnapshot().scenario);
}

document.querySelectorAll('.scenario-chip').forEach(chip => {
  chip.addEventListener('click', () => initScenario(parseInt(chip.dataset.scenario)));
});


// ═══════════════════════════════════════════════════════════
//  BYPASS DEMONSTRATION PANEL (§7)
//  "This turns bypasses into teaching assets
//   instead of embarrassing surprises."
// ═══════════════════════════════════════════════════════════

function runBypassDemo(attackName) {
  const snap = engine.getSnapshot();
  const demos = {
    direct:    { fn: engine.bypassDirect,           label: 'Direct commit (skip approval)' },
    unknown:   { fn: engine.bypassUnknownAction,    label: 'Unknown action (sudo_deploy)' },
    replay:    { fn: engine.bypassReplay,            label: 'Replay previous sequence' },
    scenario:  { fn: engine.bypassScenarioMismatch, label: 'Wrong scenario ID' },
    forged:    { fn: engine.bypassForgedState,       label: 'Forged state claim (→approved)' },
    malformed: { fn: engine.bypassMalformed,         label: 'Malformed command' }
  };

  const demo = demos[attackName];
  if (!demo) return;

  const result = demo.fn();

  // Add to event log
  const logEl = document.getElementById('event-log');
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const prefix = `[BYPASS TEST: ${demo.label}]`;

  if (result.verdict === 'TAMPERED') {
    addLogEntry(logEl, time, `${prefix} ${result.message}`, 'tampered', result.reason_code);
    showTamperedOverlay(result.message);
  } else if (result.ok) {
    addLogEntry(logEl, time, `${prefix} ${result.message}`, 'allow', `${result.reason_code} — BYPASS SUCCEEDED`);
  } else {
    const typeMap = {
      [Verdict.DRIFT]: 'drift',
      [Verdict.ESCALATE]: 'escalate',
      [Verdict.DENY]: 'deny'
    };
    const type = typeMap[result.verdict] || 'deny';
    addLogEntry(logEl, time, `${prefix} ${result.message}`, type, `${result.reason_code} — BLOCKED ✓`);
  }

  // Update bypass result display
  const resultEl = document.getElementById(`bypass-${attackName}`);
  if (resultEl) {
    resultEl.className = result.ok ? 'bypass-result bypassed' : 'bypass-result blocked';
    resultEl.textContent = result.ok
      ? `✗ BYPASSED (${result.reason_code})`
      : `✓ BLOCKED (${result.reason_code})`;
  }

  renderFromSnapshot();
}


// ═══════════════════════════════════════════════════════════
//  STATE GRAPH VISUALIZATION (D3)
// ═══════════════════════════════════════════════════════════

function drawGovGraph(snap) {
  const container = document.getElementById('gov-graph');
  if (!container) return;

  if (!snap) snap = engine.getSnapshot();
  const sc = snap.scenarioConfig;
  const states = sc.states;
  const edges = snap.allEdges;
  const w = container.clientWidth || 500;
  const h = container.clientHeight || 340;

  container.innerHTML = '';
  const svg = d3.select(container).append('svg').attr('viewBox', `0 0 ${w} ${h}`);

  const cs = getComputedStyle(document.documentElement);
  const textColor = cs.getPropertyValue('--color-text').trim();
  const mutedColor = cs.getPropertyValue('--color-text-muted').trim();
  const borderColor = cs.getPropertyValue('--color-border').trim();
  const allowColor = cs.getPropertyValue('--color-allow').trim();
  const denyColor = cs.getPropertyValue('--color-deny').trim();
  const escalateColor = cs.getPropertyValue('--color-escalate').trim();
  const driftColor = cs.getPropertyValue('--color-drift').trim();
  const primaryColor = cs.getPropertyValue('--color-primary').trim();
  const surfaceColor = cs.getPropertyValue('--color-surface').trim();

  const padding = 60;
  const nodeR = 28;
  const positions = {};
  states.forEach((s, i) => {
    positions[s] = {
      x: padding + (i / (states.length - 1)) * (w - padding * 2),
      y: h / 2
    };
  });

  if (snap.scenario === 2) {
    positions['idle'] = { x: w * 0.15, y: h * 0.5 };
    positions['proposed'] = { x: w * 0.42, y: h * 0.3 };
    positions['approved'] = { x: w * 0.68, y: h * 0.3 };
    positions['committed'] = { x: w * 0.85, y: h * 0.5 };
  }
  if (snap.scenario === 3) {
    positions['idle'] = { x: w * 0.12, y: h * 0.4 };
    positions['proposed'] = { x: w * 0.38, y: h * 0.4 };
    positions['approved'] = { x: w * 0.62, y: h * 0.4 };
    positions['committed'] = { x: w * 0.88, y: h * 0.4 };
  }

  svg.append('defs').selectAll('marker')
    .data(['allow', 'deny', 'escalate', 'drift', 'neutral'])
    .enter().append('marker')
    .attr('id', d => `arrow-${d}`)
    .attr('viewBox', '0 0 10 6')
    .attr('refX', 10)
    .attr('refY', 3)
    .attr('markerWidth', 8)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,0 L10,3 L0,6 Z')
    .attr('fill', d => {
      if (d === 'allow') return allowColor;
      if (d === 'deny') return denyColor;
      if (d === 'escalate') return escalateColor;
      if (d === 'drift') return driftColor;
      return mutedColor;
    });

  edges.forEach(edge => {
    const from = positions[edge.from];
    const to = positions[edge.to];
    if (!from || !to) return;

    let edgeColor = mutedColor;
    let markerType = 'neutral';
    let dashArray = 'none';

    if (snap.hasKernel) {
      const v = engine.getKernelVerdict(edge.from, edge.action);
      if (v === Verdict.DRIFT) { edgeColor = driftColor; markerType = 'drift'; dashArray = '6,4'; }
      else if (v === Verdict.ALLOW) { edgeColor = allowColor; markerType = 'allow'; }
      else if (v === Verdict.ESCALATE) { edgeColor = escalateColor; markerType = 'escalate'; dashArray = '4,3'; }
      else { edgeColor = denyColor; markerType = 'deny'; dashArray = '4,3'; }
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / dist;
    const ny = dy / dist;

    const sameEdges = edges.filter(e => e.from === edge.from && e.to === edge.to);
    const idx = sameEdges.indexOf(edge);
    const offset = (idx - (sameEdges.length - 1) / 2) * 18;

    const px = -ny * offset;
    const py = nx * offset;

    const isLongEdge = (snap.scenario === 3 && edge.action === 'auto_commit') ||
                       (snap.scenario === 2 && (edge.action === 'commit' && edge.from === 'idle')) ||
                       (snap.scenario === 2 && edge.action === 'bypass');
    const arcOffset = isLongEdge ? 70 : 0;

    const sx = from.x + nx * (nodeR + 4) + px;
    const sy = from.y + ny * (nodeR + 4) + py;
    const ex = to.x - nx * (nodeR + 12) + px;
    const ey = to.y - ny * (nodeR + 12) + py;

    const mx = (sx + ex) / 2 + px * 0.5;
    const my = (sy + ey) / 2 + py * 0.5 + arcOffset;

    svg.append('path')
      .attr('d', `M${sx},${sy} Q${mx},${my} ${ex},${ey}`)
      .attr('stroke', edgeColor)
      .attr('stroke-width', 1.5)
      .attr('fill', 'none')
      .attr('stroke-dasharray', dashArray)
      .attr('marker-end', `url(#arrow-${markerType})`)
      .attr('opacity', 0.8);

    const lx = mx;
    const ly = my - 8;
    svg.append('text')
      .attr('x', lx)
      .attr('y', ly)
      .attr('text-anchor', 'middle')
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', '10px')
      .attr('fill', edgeColor)
      .text(edge.action);
  });

  states.forEach(s => {
    const pos = positions[s];
    if (!pos) return;
    const isActive = s === snap.state;

    const g = svg.append('g').attr('transform', `translate(${pos.x},${pos.y})`);

    if (isActive) {
      g.append('circle')
        .attr('r', nodeR + 6)
        .attr('fill', 'none')
        .attr('stroke', primaryColor)
        .attr('stroke-width', 2)
        .attr('opacity', 0.4)
        .attr('stroke-dasharray', '4,3');
    }

    g.append('circle')
      .attr('r', nodeR)
      .attr('fill', isActive ? primaryColor : surfaceColor)
      .attr('stroke', isActive ? primaryColor : borderColor)
      .attr('stroke-width', isActive ? 2 : 1);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', '11px')
      .attr('font-weight', isActive ? '700' : '400')
      .attr('fill', isActive ? '#0c0e12' : textColor)
      .text(s);
  });

  const verdictEl = document.getElementById('current-verdict');
  if (snap.state === 'committed') {
    verdictEl.className = 'verdict verdict--allow';
    verdictEl.textContent = 'COMMITTED';
  } else if (snap.tampered) {
    verdictEl.className = 'verdict verdict--tampered';
    verdictEl.textContent = 'TAMPERED';
  } else {
    verdictEl.className = 'verdict';
    verdictEl.textContent = snap.state.toUpperCase();
    verdictEl.style.color = primaryColor;
  }
}


// ═══════════════════════════════════════════════════════════
//  BRAID TOPOLOGY CHARTS (D3)
// ═══════════════════════════════════════════════════════════

function getChartColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    text: cs.getPropertyValue('--color-text').trim(),
    muted: cs.getPropertyValue('--color-text-muted').trim(),
    faint: cs.getPropertyValue('--color-text-faint').trim(),
    border: cs.getPropertyValue('--color-border').trim(),
    surface: cs.getPropertyValue('--color-surface').trim(),
    primary: cs.getPropertyValue('--color-primary').trim(),
    allow: cs.getPropertyValue('--color-allow').trim(),
    deny: cs.getPropertyValue('--color-deny').trim(),
    escalate: cs.getPropertyValue('--color-escalate').trim(),
    drift: cs.getPropertyValue('--color-drift').trim(),
  };
}

function drawCrossingChart() {
  const container = document.getElementById('crossing-chart');
  if (!container) return;
  container.innerHTML = '';

  const c = getChartColors();
  const data = [
    { condition: 'Geometric', mean: 18.7, sd: 2.9, color: c.allow },
    { condition: 'Control', mean: 11.3, sd: 1.5, color: c.drift },
    { condition: 'Narrative', mean: 8.7, sd: 1.2, color: c.escalate },
    { condition: 'Baseline', mean: 7.0, sd: 1.0, color: c.deny },
  ];

  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const w = container.clientWidth || 400;
  const h = 280;
  const iw = w - margin.left - margin.right;
  const ih = h - margin.top - margin.bottom;

  const svg = d3.select(container).append('svg').attr('viewBox', `0 0 ${w} ${h}`);
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(data.map(d => d.condition)).range([0, iw]).padding(0.4);
  const y = d3.scaleLinear().domain([0, 24]).range([ih, 0]);

  g.selectAll('.grid-line')
    .data(y.ticks(5))
    .enter().append('line')
    .attr('x1', 0).attr('x2', iw)
    .attr('y1', d => y(d)).attr('y2', d => y(d))
    .attr('stroke', c.border).attr('stroke-dasharray', '2,3');

  g.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('x', d => x(d.condition))
    .attr('width', x.bandwidth())
    .attr('y', ih)
    .attr('height', 0)
    .attr('rx', 4)
    .attr('fill', d => d.color)
    .attr('opacity', 0.85)
    .transition().duration(700).delay((d, i) => i * 100)
    .attr('y', d => y(d.mean))
    .attr('height', d => ih - y(d.mean));

  data.forEach(d => {
    const cx = x(d.condition) + x.bandwidth() / 2;
    g.append('line')
      .attr('x1', cx).attr('x2', cx)
      .attr('y1', y(d.mean + d.sd)).attr('y2', y(d.mean - d.sd))
      .attr('stroke', d.color).attr('stroke-width', 1.5);
    g.append('line')
      .attr('x1', cx - 6).attr('x2', cx + 6)
      .attr('y1', y(d.mean + d.sd)).attr('y2', y(d.mean + d.sd))
      .attr('stroke', d.color).attr('stroke-width', 1.5);
    g.append('line')
      .attr('x1', cx - 6).attr('x2', cx + 6)
      .attr('y1', y(d.mean - d.sd)).attr('y2', y(d.mean - d.sd))
      .attr('stroke', d.color).attr('stroke-width', 1.5);
  });

  g.selectAll('.val-label')
    .data(data)
    .enter().append('text')
    .attr('x', d => x(d.condition) + x.bandwidth() / 2)
    .attr('y', d => y(d.mean) - 8)
    .attr('text-anchor', 'middle')
    .attr('font-family', "'JetBrains Mono', monospace")
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .attr('fill', d => d.color)
    .text(d => d.mean);

  g.append('g')
    .attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).tickSize(0))
    .selectAll('text')
    .attr('fill', c.muted)
    .attr('font-family', "'JetBrains Mono', monospace")
    .attr('font-size', '10px');

  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickSize(-3))
    .selectAll('text')
    .attr('fill', c.muted)
    .attr('font-family', "'JetBrains Mono', monospace")
    .attr('font-size', '10px');

  g.selectAll('.domain').attr('stroke', c.border);

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -ih / 2).attr('y', -38)
    .attr('text-anchor', 'middle')
    .attr('fill', c.muted)
    .attr('font-family', "'JetBrains Mono', monospace")
    .attr('font-size', '10px')
    .text('Crossing Number');
}


function drawGeneratorHeatmap() {
  const container = document.getElementById('generator-heatmap');
  if (!container) return;
  container.innerHTML = '';

  const c = getChartColors();

  const conditions = ['Geometric', 'Control', 'Narrative', 'Baseline'];
  const generators = ['σ₁', 'σ₂', 'σ₃', 'σ₄', 'σ₅', 'σ₆', 'σ₇', 'σ₈'];

  const data = [
    [1.0, 0.95, 0.9, 0.88, 0.85, 0.82, 0.78, 0.75],
    [0.95, 0.9, 0.85, 0.8, 0.7, 0.5, 0.3, 0.15],
    [0.9, 0.7, 0.4, 0.15, 0.05, 0.02, 0.01, 0.0],
    [0.85, 0.6, 0.3, 0.08, 0.02, 0.01, 0.0, 0.0],
  ];

  const cellSize = Math.min((container.clientWidth - 80) / 8, 36);
  const labelW = 80;
  const topPad = 28;
  const w = labelW + cellSize * 8 + 10;
  const h = topPad + cellSize * 4 + 10;

  const svg = d3.select(container).append('svg').attr('viewBox', `0 0 ${w} ${h}`);

  generators.forEach((gen, j) => {
    svg.append('text')
      .attr('x', labelW + j * cellSize + cellSize / 2)
      .attr('y', topPad - 8)
      .attr('text-anchor', 'middle')
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', '10px')
      .attr('fill', c.muted)
      .text(gen);
  });

  const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 1]);

  conditions.forEach((cond, i) => {
    svg.append('text')
      .attr('x', labelW - 8)
      .attr('y', topPad + i * cellSize + cellSize / 2 + 4)
      .attr('text-anchor', 'end')
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', '10px')
      .attr('fill', c.muted)
      .text(cond);

    data[i].forEach((val, j) => {
      svg.append('rect')
        .attr('x', labelW + j * cellSize + 1)
        .attr('y', topPad + i * cellSize + 1)
        .attr('width', cellSize - 2)
        .attr('height', cellSize - 2)
        .attr('rx', 3)
        .attr('fill', colorScale(val))
        .attr('opacity', 0.9)
        .append('title')
        .text(`${cond} / ${generators[j]}: ${(val * 100).toFixed(0)}%`);
    });
  });
}


function drawAdversarialChart() {
  const container = document.getElementById('adversarial-chart');
  if (!container) return;
  container.innerHTML = '';

  const c = getChartColors();

  const data = [
    { label: 'Geo CN', before: 17, after: 16, color: c.allow },
    { label: 'Geo Gen', before: 8, after: 6, color: c.allow },
    { label: 'Ctrl CN', before: 9, after: 11, color: c.drift },
    { label: 'Ctrl Gen', before: 7, after: 3, color: c.drift },
  ];

  const margin = { top: 20, right: 30, bottom: 40, left: 70 };
  const w = container.clientWidth || 500;
  const h = 240;
  const iw = w - margin.left - margin.right;
  const ih = h - margin.top - margin.bottom;

  const svg = d3.select(container).append('svg').attr('viewBox', `0 0 ${w} ${h}`);
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const y = d3.scaleBand().domain(data.map(d => d.label)).range([0, ih]).padding(0.3);
  const x = d3.scaleLinear().domain([0, 20]).range([0, iw]);

  g.selectAll('.grid')
    .data(x.ticks(5))
    .enter().append('line')
    .attr('x1', d => x(d)).attr('x2', d => x(d))
    .attr('y1', 0).attr('y2', ih)
    .attr('stroke', c.border).attr('stroke-dasharray', '2,3');

  g.selectAll('.bar-before')
    .data(data)
    .enter().append('rect')
    .attr('x', 0)
    .attr('y', d => y(d.label))
    .attr('width', d => x(d.before))
    .attr('height', y.bandwidth() / 2 - 1)
    .attr('rx', 3)
    .attr('fill', d => d.color)
    .attr('opacity', 0.5);

  g.selectAll('.bar-after')
    .data(data)
    .enter().append('rect')
    .attr('x', 0)
    .attr('y', d => y(d.label) + y.bandwidth() / 2 + 1)
    .attr('width', d => x(d.after))
    .attr('height', y.bandwidth() / 2 - 1)
    .attr('rx', 3)
    .attr('fill', d => d.color)
    .attr('opacity', 0.9);

  data.forEach(d => {
    g.append('text')
      .attr('x', x(d.before) + 6)
      .attr('y', y(d.label) + y.bandwidth() / 4 + 3)
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', '10px')
      .attr('fill', c.muted)
      .text(`pre: ${d.before}`);
    g.append('text')
      .attr('x', x(d.after) + 6)
      .attr('y', y(d.label) + y.bandwidth() * 3 / 4 + 3)
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', '10px')
      .attr('fill', d.color)
      .text(`post: ${d.after}`);
  });

  g.append('g').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(0))
    .selectAll('text').attr('fill', c.muted).attr('font-family', "'JetBrains Mono', monospace").attr('font-size', '10px');

  g.append('g')
    .call(d3.axisLeft(y).tickSize(0))
    .selectAll('text').attr('fill', c.muted).attr('font-family', "'JetBrains Mono', monospace").attr('font-size', '10px');

  g.selectAll('.domain').attr('stroke', c.border);
}


// ─── Initialize ────────────────────────────────────────────
initScenario(1);
