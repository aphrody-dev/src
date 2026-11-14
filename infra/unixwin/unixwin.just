# Chaîne unixwin (importé par le justfile racine) : forks aphrody-labs -> build prd ou CI du fork -> poste.
# Voir docs/unixwin/BUILD.md.

# Écarts forks / amont unixwin, pins src.lock.json, niu installé
[group('unixwin')]
unixwin-status:
    bun "{{root}}/infra/unixwin/unixwin.ts" status

# Clones unixwin manquants (forks.ts), puis pins dans src.lock.json
[group('unixwin')]
unixwin-sync:
    bun "{{root}}/packages/machine/src/forks.ts" niubash rubash WinuxCmd niu-git ruline oh-my-niu shellbench diffcorpus wpm-source wpm-artifacts winuxcmd-i18n winuxsh-profiles unixwin-github unixwin-apt unixwin.dev wpm-gui
    bun "{{root}}/infra/unixwin/unixwin.ts" lock

# niu (niubash + rubash aux pins) construit sur prd : nice -n 19, 4 tâches, cargo xwin pour Windows
[group('unixwin')]
unixwin-build triple="x86_64-pc-windows-msvc":
    bun "{{root}}/infra/unixwin/unixwin.ts" build {{triple}}

# Artefact de la CI du fork (aphrody-labs/niubash, workflow « aphrody build ») au commit épinglé
[group('unixwin')]
unixwin-fetch-ci triple="x86_64-pc-windows-msvc":
    bun "{{root}}/infra/unixwin/unixwin.ts" fetch-ci {{triple}}

# Installe sur le poste le niu vérifié (source ci ou prd)
[group('unixwin')]
unixwin-install from="ci" triple="x86_64-pc-windows-msvc":
    bun "{{root}}/infra/unixwin/unixwin.ts" install {{from}} {{triple}}

# Test Rust ciblé de rubash sur fr1, l'usine (aphrody-heavy, -j 4) ; la suite complète tourne dans la CI du fork
[group('unixwin')]
unixwin-test-fr1 filter:
    bun "{{root}}/infra/unixwin/unixwin.ts" test-fr1 {{filter}}

# Suite bun de bout en bout (niubash, rubash, WinuxCmd) contre GNU bash et uutils
[group('unixwin')]
unixwin-test:
    bun test "{{root}}/packages/machine/matrix/test/unixwin"
