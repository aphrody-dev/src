# Preuve de compatibilité de bout en bout

Règle : chaque build LLVM se compare à une baseline, soit le même commit compilé avec GCC MinGW, soit le paquet CachyOS ou Valve. Une régression bloque la purge concernée (PLAN.md).

## Machines

- fr1 : builds et suites lourdes (winetest complet, rostests, jeux). Présence d'un GPU [NV].
- prd : machine chargée, donc toujours `nice -n 19 ionice -c3`. Smoke tests et benchs noyau courts.
- fr2 (`cdn`) : petites validations (`configure --help`, ntsync, tests unitaires).
- Rien ne tourne sur le PC local.

## Suites et seuils

| Cible                  | Suite                                                                                                                                                                                 | Seuil                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Wine                   | `make test` / winetest en WoW64 (`--enable-archs=x86_64,i386`), sous Xvfb puis Wayland headless                                                                                       | échecs ≤ baseline GCC du même commit, module par module ; aucun nouveau crash ; diff par test publié |
| PE clang vs llvm-mingw | les mêmes suites                                                                                                                                                                      | parité stricte ; un test qui ne passe qu'avec GCC bloque la purge                                    |
| ntsync                 | `tools/testing/selftests/drivers/ntsync` + tests de sync ntdll/server dans winetest                                                                                                   | selftests à 100 %, winetest ≤ baseline                                                               |
| Proton                 | harness de test Proton [NV], tests dxvk (d3d9/10/11), vkd3d-proton (d3d12), dxvk-nvapi, vkcube                                                                                        | 100 % de ce qui passe en baseline                                                                    |
| Jeux / bench           | panel fixe de 10 titres ProtonDB Platinum (D3D9/11/12, Vulkan, .NET/XNA, sans anti-cheat) via umu-launcher, `PROTON_LOG=1` ; benchs intégrés et Unigine Superposition [NV : licences] | 5 min sans crash ; FPS moyen ≥ 98 % de la baseline, 1 % low ≥ 95 % ; médiane sur 3 runs              |
| Noyau clang + BORE     | kselftest (sched, ntsync), hackbench, schbench, cyclictest, frametime sur le panel                                                                                                    | régression ≤ 2 % par rapport au mainline GCC, 5 runs                                                 |
| LiberNT / ReactOS      | rostests + winetests importés (`modules/rostests`), boot QEMU amd64/i386 piloté par testman                                                                                           | échecs ≤ baseline (build Clang RosBE actuel) ; boot jusqu'au bureau                                  |

## Reproductibilité

- Pins : commit de chaque dépôt et CLANG_REVISION dans `conformance/upstreams.toml` ; toolchain posée par `ay toolchain` et vérifiée au b3sum.
- Environnement : version du SLR sniper, Mesa et pilote GPU épinglés ; `WINEPREFIX` neuf à chaque run ; `SOURCE_DATE_EPOCH` fixé.
- Résultats : un JSON par run (commits, toolchain, noyau, GPU, verdict de chaque test, FPS) envoyé sur R2, puis diffé contre la baseline par `test/conformance`.
- Un verdict compte seulement s'il ressort identique sur deux runs.
