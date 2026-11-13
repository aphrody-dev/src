# Rigor of figures (monorepo rules)

Applies to all docs, commit messages, PRs and agent reports.

1. Every figure is one of two things:
   - a **measurement**: value, method (tool, command, machine, date), n;
   - a **bound or a calculation**: written formula, cited measured inputs, listed assumptions.
2. No estimate without a label. An unverified value carries `[NV]` and says what is missing to verify it. A scenario value ("if L = 30 min") is presented as a scenario, never as a result.
3. Systematic intervals: 95% CI (bootstrap, Wilson for proportions, block bootstrap for autocorrelated series) or min/max when n is too small. For n < 10, give the raw values and say that the sample does not allow a conclusion.
4. Benchmarks: warmup (hyperfine style, ≥ 3 runs discarded), n ≥ 30 when feasible (otherwise give n and the reason), report median + IQR or mean ± CI. State the machine load during the measurement (`uptime`), the tool versions and the commit.
5. Reproducible: the exact script or command is versioned (`tools/…`, `scripts/…`), with its inputs and, if possible, the raw output (`results/`). Fixed seed for any random draw.
6. A model is validated against an independent measurement (hindcast, cross-validation) and its error is published. A circular test is flagged as such.
7. Limits written next to the result: known biases, what is not measured, out-of-domain conditions.
8. Conflicting sources: both values and their sources are cited, without silent arbitration.
9. Heavy work (builds, bootstrap, large parsing) on the servers (`nice`), never on the local PC; temporary files outside the repository.

Application reference: `docs/CHROMIUM-FACTORY.md`, section "Model and bounds", and `tools/build-model/`.
