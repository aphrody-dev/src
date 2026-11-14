# Feature flags machine (2026-11-14)

Chaque entree : etat verifie, commande, retour arriere.

## PC (Windows 11 Insider Dev 28120)

Deja actifs avant migration (verifies par `reg query`, aucune action) :
- Mode developpeur : `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock` AllowDevelopmentWithoutDevLicense=1. Retour : mettre 0.
- sudo Windows inline : `HKLM\...\Sudo` Enabled=3. Retour : `sudo config --enable disableInput` ou 0.
- Chemins longs : `HKLM\SYSTEM\CurrentControlSet\Control\FileSystem` LongPathsEnabled=1.
- HAGS : `HKLM\SYSTEM\CurrentControlSet\Control\GraphicsDrivers` HwSchMode=2. Retour : 1.
- Dossier God Mode present sur le Bureau : `GodMode.{ED7BA470-8E54-465E-825C-99712043E01C}`. Retour : supprimer le dossier.

Appliques :
- Fonctionnalites experimentales pwsh 7 (3 disponibles) : `pwsh -c "Get-ExperimentalFeature | % { Enable-ExperimentalFeature -Name $_.Name -Scope CurrentUser }"`. Verifie : les 3 a True au demarrage suivant. Retour : `Disable-ExperimentalFeature`.
- Cargo (`~/.cargo/config.toml`, cible x86_64-pc-windows-msvc) : ajout `-Zthreads=8 -Zshare-generics=y` aux rustflags. Verifie : `cargo check` sur crate neuve OK (nightly). Retour : retirer les deux drapeaux.
- WSL `~/.wslconfig`, section `[experimental]` : ajout `dnsTunneling=true`, `hostAddressLoopback=true` (cles absentes seulement). Retour : supprimer ces lignes. Note pour l'agent WSL : `networkingMode=mirrored` est une cle `[wsl2]`, non appliquee ici ; `firewall=false` deja present en `[wsl2]` ; `hostAddressLoopback` n'agit qu'en mode mirrored. Prise en compte : `wsl --shutdown` (non execute).

Non appliques, raison :
- Hyper-V, VirtualMachinePlatform, WHPX, Windows Sandbox, Dev Drive, `winget configure --enable`, ViVeTool : exigent un jeton administrateur ; la session n'est pas elevee et `sudo` declenche une invite UAC sur le bureau securise sans reponse possible. Commandes a lancer elevees : `Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All,VirtualMachinePlatform,HypervisorPlatform,Containers-DisposableClientVM -NoRestart` ; `winget configure --enable`. Retour : `Disable-WindowsOptionalFeature`. ViVeTool : aucun ID documente pour 28120 cite, rien active.
- Chrome 157 : Local State non editable Chrome ouvert (regle du skill `chrome`) ; 38 flags dev deja actifs dont WebMCP testing. Aucun changement, Claude in Chrome non touche.

## VPS (ay ssh exec)

Deja en place (verifie) : BBR + fq, io_uring_disabled=0, cgroup v2 (cgroup2fs), zram swap prio 100 (zswap non active : redondant avec zram), systemd-oomd actif sur fr1.

fr1 (build) :
- `infra/fleet/sysctl/aphrody-thp-always.tmpfiles.conf` -> `/etc/tmpfiles.d/aphrody-thp.conf` : THP always + defrag defer+madvise. Verifie : `[always]`. Retour : supprimer le fichier, `echo madvise > /sys/kernel/mm/transparent_hugepage/enabled`.
- `infra/fleet/sysctl/90-aphrody-fr1-god.conf` -> `/etc/sysctl.d/` : swappiness=100 (zram), page-cluster=0, compaction_proactiveness=20. Verifie par `sysctl`. Retour : supprimer, `sysctl --system`.
- GRUB : `sed -i s/transparent_hugepage=madvise/transparent_hugepage=always mitigations=off/` sur `/etc/default/grub.d/90-aphrody-vps.cfg` puis `update-grub` (3 entrees contiennent mitigations=off). Risque documente : mitigations CPU desactivees, hote de build sans service public. Effectif au prochain reboot. Retour : sed inverse + `update-grub`.

fr2 (edge) : deja BBR/fq/io_uring. systemd-oomd absent (`Unit systemd-oomd.service does not exist`), non installe. THP reste madvise.

usa (prod) : THP always -> madvise via `infra/fleet/sysctl/aphrody-thp-madvise.tmpfiles.conf` (`/etc/tmpfiles.d/aphrody-thp.conf`). Verifie : `[madvise]`. BBR/fq/io_uring deja OK. Ni reboot, ni mitigations, ni /srv/shenron, ni conteneurs. Retour : supprimer le fichier, `echo always > .../enabled`.
