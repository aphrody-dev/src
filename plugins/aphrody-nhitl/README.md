# aphrody-nhitl

No human in the loop for Claude Code, through supported extension points only (plugin hooks,
user settings, headless CLI). claude.exe is never patched.

| Piece | File | Behavior |
| :- | :- | :- |
| PreToolUse, PermissionRequest | `src/hook.ts` + `src/policy.ts` | Allow every call (PermissionRequest `allow` also covers `-p` runs and critical-path `rm`). Deny: `git push --force`/`+refspec`/`--mirror`, history rewrite (`filter-branch`, `filter-repo`, `rebase --root`, `reflog expire`, `update-ref -d`); deletion outside `C:\src`, `C:\msys`, temp unless git holds a clean tracked copy; printing secret files (`/etc/aphrody/secrets.env`, `.env*` except examples, DPAPI `Protect`/`Credentials`/`Vault`, `ProtectedData::Unprotect`, `.credentials.json`, `.git-credentials`, private SSH keys), including through `ssh host cmd`; publishing Epic/Unreal or MSVC SDK/CRT content (`git push` outgoing files, `gh release`, `rclone`, `scp`, `rsync`, `npm/bun/cargo publish`...); `AskUserQuestion` (decide alone). Plan mode is left alone. |
| Notification | `src/hook.ts` | Async, log only. |
| Stop, SubagentStop | `src/hook.ts` | `decision: "block"` while a goal (`--goal` of the launcher) or TodoWrite items stay open, unless the last message names a blocker, background tasks are running, or `NHITL_MAX_CONTINUE` (default 3) continuations were used. `NHITL_DONE` in the reply closes the goal. Claude Code's own 8-in-a-row cap still applies. |
| SubagentStart/Stop | `src/hook.ts` | Running-agent registry in `~/.claude/state/nhitl/agents-all.json`. |
| SessionStart | `src/hook.ts`, `src/learn-auto.ts` | Local digest (busy sessions, running agents, goal, open todos on resume, learn journal, nhitl denies in 24 h), no network, about 45 ms wall. Detached `/learn` at most once per 24 h. |
| Stop, SessionEnd | `src/learn-capture.ts` | Lesson capture to `~/.claude/learning/journal.jsonl` (moved from `~/.claude/hooks`). |
| Status line | `src/statusline.ts` | `nhitl · mode · model · agents n[/total] · ctx %`, wired in `~/.claude/settings.json`. |
| Launcher | `bin/claude-nhitl.ts` | `claude -p` with `--permission-mode bypassPermissions --permission-prompts none --output-format stream-json --verbose`, `--session-id`/`--resume`/`--continue`, stream teed to `~/.claude/learning/runs/<sid>.jsonl`. `--help` for the runner contract. |

Decisions: `~/.claude/learning/nhitl.jsonl` (commands redacted, allows carry no command text).
Tests: `bun test` here. Install: `claude plugin marketplace add C:/src/plugins` then
`claude plugin install aphrody-nhitl@aphrody --scope user`; after edits bump `version` and run
`claude plugin marketplace update aphrody && claude plugin update aphrody-nhitl@aphrody`.

## Sources read (2026-11-13, Claude Code 2.1.322 installed)

- https://code.claude.com/docs/llms.txt (index)
- https://code.claude.com/docs/en/hooks.md: common input, exec form `command`+`args`, `onFailure`, PreToolUse `permissionDecision`, PermissionRequest `decision.behavior`, Stop `decision: "block"` and 8-continuation cap, SubagentStop input, SessionStart `additionalContext`, Notification types
- https://code.claude.com/docs/en/permission-modes.md: actions no mode auto-approves, critical-path `rm` in `-p` runs
- https://code.claude.com/docs/en/permissions.md, https://code.claude.com/docs/en/settings-reference.md
- https://code.claude.com/docs/en/plugins/manifest-reference.md, https://code.claude.com/docs/en/plugins/marketplace-reference.md (`directory` source, relative `./` plugin source), https://code.claude.com/docs/en/plugins/cli-reference.md (`claude plugin validate`)
- https://code.claude.com/docs/en/statusline.md, https://code.claude.com/docs/en/headless.md (`--permission-prompts none`), https://code.claude.com/docs/en/cli-reference.md (`--session-id`, `--resume`), https://code.claude.com/docs/en/output-styles.md
- GitHub anthropics/claude-code@89eb88e335 (CHANGELOG 2.1.323), anthropics/skills@2c5958ecac (skills list)
