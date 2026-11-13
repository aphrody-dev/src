---
name: humanizer
description: Remove AI writing tics from a text (French or English) without changing what it says - interface text, pages, docs, READMEs, commit messages, release notes. Use before shipping any public text of src and during the anti-slop review of an interface. Absorbs blader/humanizer (MIT); automatic check by `gds audit-slop`.
license: MIT
metadata:
  upstream: "blader/humanizer@b48c832f0f80 (fork aphrody-labs/humanizer)"
---

# humanizer

Rewrite for a specific reader, keep the meaning, the facts and the useful length. Full catalogue of the 26 tics, with before/after examples: `references/patterns.md` (upstream, English). Read it in full before a long rewrite.

## Tools

```bash
bun C:/src/packages/google-design/cli.ts audit-slop <path> [--json]   # exit code 1 if findings
bun C:/src/packages/google-design/cli.ts humanize <file> [--write]    # mechanical rewrites only
```

`gds humanize` only replaces safe phrasings; the rest is rewritten by hand from the catalogue.

## Tics to remove (summary)

- Staging: "not X but Y", one-line dramatic punchline, hollow maxims, preamble ("here is what you need to know"), rebuttal of an absent opponent.
- Mechanical rhythm: forced triads, repeated sentence openings, em dashes everywhere, stacked qualifiers, passive voice without a subject.
- Inflation: AI words (en: delve, seamless, tapestry, unlock, elevate, robust, pivotal; fr: « véritable », « incontournable », « au cœur de », « fluide », « révolutionner », « booster », « sublimer »), inflated importance, sales language, borrowed authority, "positions itself as" instead of "is".
- Reflex formatting: decorative bold, "**Label**: text" lists, decorative headings, mixed typographic quotes.
- Chat leftovers: "Great question", "I hope this helps", knowledge-cutoff disclaimers, title repeated in the first sentence, text that talks about the document instead of the subject.
- Wrong reader: re-explaining what the reader already knows.

## src rules

1. Zero emoji, zero AI attribution, no unmeasured promise (figures only if sourced).
2. French: non-breaking spaces before `; : ! ?` in public pages, « » quotes, no anglicism when a French word exists.
3. Interface: short action verbs on buttons, error messages that say what to do, no final period on labels.
4. Do not rewrite: quotations, legal text, command output, code, proper nouns, text the author intended that way.
5. Output: the rewritten text alone, then one line per possible change of meaning; never a comment on the method.
