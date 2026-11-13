# Chaîne unixwin (importé par le justfile racine) : forks aphrody-labs -> build prd ou CI du fork -> poste.
# Voir docs/unixwin/BUILD.md.

# Écarts forks / amont unixwin, pins src.lock.json, niu installé
unixwin-status:
    bun "{{root}}/scripts/unixwin/unixwin.ts" status

# Clones unixwin manquants (forks.ts), puis pins dans src.lock.json
unixwin-sync:
    bun "{{root}}/packages/machine/src/forks.ts" niubash rubash WinuxCmd niu-git ruline oh-my-niu shellbench diffcorpus wpm-source wpm-artifacts winuxcmd-i18n winuxsh-profiles unixwin-github unixwin-apt unixwin.dev wpm-gui
    bun "{{root}}/scripts/unixwin/unixwin.ts" lock

# niu (niubash + rubash aux pins) construit sur prd : nice -n 19, 4 tâches, cargo xwin pour Windows
unixwin-build triple="x86_64-pc-windows-msvc":
    bun "{{root}}/scripts/unixwin/unixwin.ts" build {{triple}}

# Artefact de la CI du fork (aphrody-labs/niubash, workflow « aphrody build ») au commit épinglé
unixwin-fetch-ci triple="x86_64-pc-windows-msvc":
    bun "{{root}}/scripts/unixwin/unixwin.ts" fetch-ci {{triple}}

# Installe sur le poste le niu vérifié (source ci ou prd)
unixwin-install from="ci" triple="x86_64-pc-windows-msvc":
    bun "{{root}}/scripts/unixwin/unixwin.ts" install {{from}} {{triple}}

# Tests Rust de rubash (cargo test) sur prd au commit épinglé, nice -n 19, 4 tâches
unixwin-test-prd filter="":
    bun "{{root}}/scripts/unixwin/unixwin.ts" test-prd {{filter}}

# Suite bun de bout en bout (niubash, rubash, WinuxCmd) contre GNU bash et uutils
unixwin-test:
    bun test "{{root}}/apps/unixwin/tests"
