---
name: code-review
description: Reviews the last commit using parallel subagents for correctness and security. Covers Ruby and JavaScript. Use when asked for a code review.
---

Comprehensive review of the last commit (or a specified commit/range) using
parallel subagents. This project uses Ruby and vanilla JS.

## Review Principles

These override the checklists when they conflict.

- **Subtract first.** Before suggesting an addition, ask if something can be
  removed instead. Shorter code that works is better code.
- **Let errors surface.** Don't rescue or catch what you can't meaningfully
  recover from. Raise, crash, let the caller deal with it.
- **Don't duplicate the library.** If HTTParty, WebMock, or the stdlib already
  does it, flag the application code that reimplements it.
- **No speculative code.** Every file and method in the diff should serve the
  stated goal. Flag anything that answers "what if we need this later?"
- **Duplication over the wrong abstraction.** Don't extract until there are
  three similar implementations. Two is not a pattern.
- **Tests ship with behavior.** Code in `lib/` without corresponding `spec/`
  changes is unfinished. Same for JS behavior without test coverage.
- **Code reads like prose.** Ruby is a beautiful language — write it that way.
  If the code needs a comment to explain what it does, the code isn't clear
  enough. Rename, extract, restructure until it speaks for itself.
- **Security upfront.** API keys in ENV, no secrets in fixtures, no `eval` or
  dynamic `send` with external input, no inline scripts that bypass CSP.

## Workflow

1. Get the diff: `git diff HEAD~1..HEAD` (or the specified range).
2. Identify which languages are in the diff (Ruby, JS, HTML, CSS).
3. Launch **two parallel subagents** via the Agent tool:

**Agent 1 — Correctness & Design** reviews:
- Bugs, logic errors, incorrect assumptions
- Edge cases: nils, empty collections, malformed JSON, empty responses,
  network timeouts, missing keys in hashes
- Simplicity: could this be shorter? Unnecessary abstractions? Guard clauses
  that can't trigger? Code the library already handles?
- Test quality: load the `rspec` skill (`.claude/skills/rspec/SKILL.md`) and
  review tests against it. Check for: missing coverage, SUT stubbing (always
  wrong), brittle assertions, happy-path-only specs, use of `let`/`before`/
  `subject` (should be inline setup + private helpers), missing edge case
  contexts (timeout, malformed JSON, empty response, missing keys)
- Ruby beauty: code should read like well-written prose. Prefer `each` over
  `for`, `map`/`select`/`reject` over manual accumulation, guard clauses over
  nested conditionals, `then`/`yield_self` for pipelines, keyword arguments
  for clarity. Use Ruby 3.1+ hash/keyword shorthand (`interval:` instead of
  `interval: interval`) when forwarding keyword arguments. Short methods that
  reveal intent through their name. No metaprogramming unless it genuinely
  simplifies. Flag verbose, procedural, or Java-in-Ruby style code — suggest
  the idiomatic rewrite.
- Ruby conventions: `Argpt::` namespace, domain naming (holding, MEP, CCL,
  CEDEAR, arg_stock, us_stock), `snake_case` everything, `?` for predicates,
  `!` for mutation/danger
- JS: event delegation, no global state leaks, progressive enhancement
  (works without JS), proper error handling in fetch calls
- HTML: semantic elements, accessibility (labels, ARIA, keyboard nav),
  valid structure, no inline event handlers
- Data pipeline: type/precision preservation, currency truncation,
  float comparison with `==`, nil propagation
- Scope discipline: does every file serve the commit's goal?

**Agent 2 — Security & Robustness** reviews:
- Secrets: API keys, tokens, credentials in code or fixtures
- Input handling: injection risks (eval, send, innerHTML, SQL-like
  interpolation), XSS vectors in HTML/JS, unsafe deserialization
- HTTP clients: SSRF potential, response validation, timeout configuration
- Data exposure: sensitive data in error messages, logs, or HTML comments
- Rate limiting: Data912 has 120 req/min — batch operations must respect this
- JS security: no `eval`, no `innerHTML` with untrusted data, no inline
  scripts, CSP-compatible patterns
- Dependencies: known vulnerabilities, unnecessary gems/packages
- File operations: path traversal, unsafe temp files

Both agents must:
- Read changed files in full, not just the diff
- Provide file:line references for every finding
- Include a concrete fix (code snippet or specific action)
- Only flag what they observe — no speculation

4. **Consolidate** the two reports:
   - Deduplicate findings that both agents caught
   - Merge into a single severity-ordered list

## Output format

### Findings

Severity order: Critical, High, Medium, Low. Each finding:
- `file_path:line` reference
- What is wrong or risky
- Why it matters (impact or failing scenario)
- Concrete fix

### Good

Patterns worth repeating.

### Questions

Assumptions or missing context that need clarification.

### Verdict

One line: overall risk level (safe / minor concerns / needs changes).

## Rules

- Only discuss what you observe in the diff
- Use `bundle exec` for Ruby commands
- When a finding conflicts with a review principle, the principle wins
- If the diff is trivial (docs, config, comments only), say so and skip the agents
