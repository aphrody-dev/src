# Third-party attribution

r2b merges the full source of two MIT-licensed upstream projects. Their
license texts are kept unchanged next to their code.

| Path        | Upstream                                         | Commit                                   | License                                                        |
| ----------- | ------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------- |
| src/rea     | https://github.com/morluto/rea                   | a01674377f1f2a0fed467035fddc25e90e74d75a | MIT, Copyright (c) 2026 morluto (src/rea/LICENSE)              |
| src/replica | https://github.com/Jakeschincariol/replica-skill | 77c9436fb3d18c3d58169efb8caf4fe906b0dc51 | MIT, Copyright (c) 2026 Jake Schincariol (src/replica/LICENSE) |

REA's own third-party notices are preserved in src/rea/THIRD_PARTY_NOTICES.md
and src/rea/licenses/. Vendored notice material lives in third_party/
(evmole, pwndbg, pwntools, wabt, web-network-captures). The upstream git
submodules binwalk, unblob, wakaru, jadx-headless-mcp and ghidra-nativeaot are
not vendored; they are optional external engines fetched on demand.
