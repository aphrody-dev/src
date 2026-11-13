# Profil PowerShell canonique (pwsh 7.7 + Windows PowerShell 5.1). Source : C:\src\packages\machine\shells\pwsh\profile.ps1.
# Déployé en copie par packages/machine (shells/manifest.toml) vers $PROFILE.CurrentUserCurrentHost des deux éditions.
# Réglages, versions et sources : docs/shell/pwsh-setup.md. Code compatible 5.1 (ni ??, ni ternaire, ni &&).
# Aucun réseau, aucun module importé au démarrage ; tout l'interactif est différé après le premier prompt.

# Le chemin de démarrage n'appelle aucune cmdlet : la première (Select-Object, Remove-Variable…) charge
# Microsoft.PowerShell.Utility, soit ~20 ms mesurés. Seuls des appels .NET et des affectations.

# 1. Environnement partagé (généré : bun packages/machine/src/shells.ts --gen ; $env:* uniquement, zéro sous-processus).
$global:__ay_src = $env:AY_SRC
if (-not $global:__ay_src) { $global:__ay_src = 'C:\src' }
if ([IO.File]::Exists("$global:__ay_src\packages\machine\shells\env.ps1")) { . "$global:__ay_src\packages\machine\shells\env.ps1" }

# 2. UTF-8 sans BOM pour la console et les programmes natifs (about_Character_Encoding).
$OutputEncoding = [Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $OutputEncoding
if ($PSVersionTable.PSVersion.Major -ge 7) {
    [Console]::InputEncoding = $OutputEncoding
    $PSDefaultParameterValues['*:Encoding'] = 'utf8NoBOM'
}

# 3. Hôtes non interactifs (-c / -File / -NonInteractive / -EncodedCommand, sauf avec -NoExit) : arrêt ici.
# Comparaisons de chaînes insensibles à la casse : pas de regex sur le chemin de démarrage. Les arguments qui
# suivent -Command/-File appartiennent au script : on s'arrête au premier.
$__ay_batch = -not [Environment]::UserInteractive
$__ay_noexit = $false
foreach ($__ay_a in [Environment]::GetCommandLineArgs()) {
    $__ay_a = $__ay_a.Replace('/', '-')
    if ($__ay_a -in '-noe', '-noex', '-noexi', '-noexit') { $__ay_noexit = $true }
    elseif ($__ay_a -in '-noni', '-nonin', '-nonint', '-noninteractive') { $__ay_batch = $true }
    elseif ($__ay_a -in '-c', '-co', '-com', '-comm', '-comma', '-comman', '-command', '-f', '-fi', '-fil', '-file',
        '-e', '-ec', '-en', '-enc', '-encodedcommand') { $__ay_batch = $true; break }
}
if ($__ay_batch -and -not $__ay_noexit) { $__ay_batch = $null; $__ay_noexit = $null; $__ay_a = $null; return }
$__ay_batch = $null; $__ay_noexit = $null; $__ay_a = $null

# 4. Raccourcis vers les outils natifs (cat reste Get-Content ; bat par son nom).
function ll { eza -la --git --icons=auto @args }
function gs { git status -sb @args }
function gd { git diff @args }
function gl { git log --oneline --graph -20 @args }

# Environnement Visual Studio à la demande (vswhere, aucun coût au démarrage).
function global:vs-env {
    $vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if ([IO.File]::Exists($vsWhere)) {
        $vsInstall = & $vsWhere -latest -prerelease -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath | Select-Object -First 1
        $dev = if ($vsInstall) { Join-Path $vsInstall 'Common7\Tools\Launch-VsDevShell.ps1' }
        if ($dev -and [IO.File]::Exists($dev)) { & $dev -Arch amd64 -HostArch amd64 -SkipAutomaticLocation; return }
    }
    Write-Warning 'Visual Studio build tools not found.'
}

# 5. Complétions en cache : $env:AY_SHELL_CACHE\pwsh\<nom>.ps1. Ligne 1 = « # ay-src: <exe> » ; régénération seulement
# si cet exécutable est plus récent que le cache (ou absent du disque), donc aucun sous-processus quand rien n'a changé.
# Générateurs natifs d'abord (just, rustup, gh, zoxide) ; carapace pour cargo/bun/git (pas de sortie PowerShell native)
# et pour ay (spec partagée {appdata}\carapace\specs\ay.yaml, déployée par shells/manifest.toml).
$global:__ay_comp_dir = $env:AY_SHELL_CACHE
if (-not $global:__ay_comp_dir) { $global:__ay_comp_dir = "$HOME\.cache\shell" }
$global:__ay_comp_dir += '\pwsh'
$global:__ay_generators = [ordered]@{
    zoxide = @('zoxide', { zoxide init powershell })
    just   = @('just', { $env:JUST_COMPLETE = 'powershell'; try { just } finally { $env:JUST_COMPLETE = $null } })
    rustup = @('rustup', { rustup completions powershell rustup })
    # cobra : « 2>&1 » posé sur Invoke-Expression ne capte pas le stderr natif de `gh __complete`
    # (« Completion ended with directive… » s'imprime sur la ligne) ; la redirection est déplacée dans la commande.
    gh     = @('gh', { (gh completion -s powershell) -replace '"\$RequestComp" 2>&1', '"$$RequestComp 2>`$$null"' })
    cargo  = @('carapace', { carapace cargo powershell })
    bun    = @('carapace', { carapace bun powershell })
    git    = @('carapace', { carapace git powershell })
    ay     = @('carapace', { if ([IO.File]::Exists("$env:APPDATA\carapace\specs\ay.yaml")) { carapace ay powershell } })
}

function global:Update-AyCompletions {
    # -Force : tout régénérer (outil mis à jour sans changement de date, nouvelle spec ay…).
    param([switch]$Force)
    [void][IO.Directory]::CreateDirectory($global:__ay_comp_dir)
    foreach ($name in $global:__ay_generators.Keys) {
        $file = "$global:__ay_comp_dir\$name.ps1"
        if (-not $Force -and [IO.File]::Exists($file)) {
            $r = [IO.StreamReader]::new($file); $first = $r.ReadLine(); $r.Dispose()
            if ($first -match '^# ay-src: (.+)$' -and [IO.File]::Exists($Matches[1])) {
                if ([IO.File]::GetLastWriteTimeUtc($Matches[1]) -le [IO.File]::GetLastWriteTimeUtc($file)) { continue }
            }
        }
        $cmd = Get-Command $global:__ay_generators[$name][0] -CommandType Application -TotalCount 1 -ErrorAction Ignore
        if (-not $cmd) { continue }
        $text = (& $global:__ay_generators[$name][1] 2>$null) -join "`n"
        if ($text) { [IO.File]::WriteAllText($file, "# ay-src: $($cmd.Source)`n$text`n", [Text.UTF8Encoding]::new($false)) }
    }
}

# 6. Différé : PSReadLine émet PowerShell.OnIdle dès qu'il attend une touche, donc après l'affichage du premier prompt.
# Le bloc est lié à l'état de session global et dot-sourcé depuis l'action : ses définitions restent globales.
$global:__ay_idle = {
    Set-PSReadLineOption -EditMode Windows -BellStyle None -HistoryNoDuplicates -MaximumHistoryCount 50000 `
        -HistorySearchCursorMovesToEnd -HistorySaveStyle SaveIncrementally
    # Prédiction (PSReadLine >= 2.1 ; refusée si la sortie n'est pas un terminal VT ou est redirigée).
    if ((Get-Command Set-PSReadLineOption).Parameters.ContainsKey('PredictionSource')) {
        try { Set-PSReadLineOption -PredictionSource History -PredictionViewStyle ListView } catch { }
    }
    Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
    Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward
    Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete
    Set-PSReadLineKeyHandler -Chord 'Ctrl+RightArrow' -Function ForwardWord
    # fzf sans PSFzf : Ctrl+t fichiers (fd), Ctrl+r historique.
    Set-PSReadLineKeyHandler -Chord 'Ctrl+t' -ScriptBlock {
        $f = fd --type f --hidden --exclude .git | fzf --height 40% --reverse
        if ($f) { [Microsoft.PowerShell.PSConsoleReadLine]::Insert($f) }
    }
    Set-PSReadLineKeyHandler -Chord 'Ctrl+r' -ScriptBlock {
        $h = [IO.File]::ReadAllLines((Get-PSReadLineOption).HistorySavePath)
        [array]::Reverse($h)
        $s = $h | Select-Object -Unique | fzf --height 40% --reverse --scheme=history
        if ($s) { [Microsoft.PowerShell.PSConsoleReadLine]::RevertLine(); [Microsoft.PowerShell.PSConsoleReadLine]::Insert($s) }
    }
    Update-AyCompletions
    foreach ($name in $global:__ay_generators.Keys) {
        $file = "$global:__ay_comp_dir\$name.ps1"
        if ([IO.File]::Exists($file)) { . $file }
    }
}
$null = $ExecutionContext.Events.SubscribeEvent($null, $null, 'PowerShell.OnIdle', $null, { . $global:__ay_idle; $global:__ay_idle = $null }, $false, $false, 1)

if ($PSVersionTable.PSVersion.Major -ge 7) {
# 7. Bloc géré par l'installeur Coreutils for Windows (2026.9.3) : conservé tel quel, son marqueur évite qu'il le réécrive.
# DO NOT MODIFY -- coreutils -- 60b36fc6-2d59-49df-be51-28dd2f4c3c9a
# vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
# Inlining the template into the profile shaves off ~10ms (25%).
$script:__COREUTILS__ = [System.Collections.Generic.HashSet[string]]::new(
    [string[]]@('arch','b2sum','base32','base64','basename','basenc','cat','cksum','comm','cp','csplit','cut','date','df','dirname','du','echo','env','expr','factor','false','find','fmt','fold','grep','head','hostname','join','la','link','ln','ls','md5sum','mkdir','mktemp','mv','nl','nproc','numfmt','od','paste','pathchk','pr','printenv','printf','ptx','pwd','readlink','realpath','rm','rmdir','seq','sha1sum','sha224sum','sha256sum','sha384sum','sha512sum','shuf','sleep','sort','split','stat','sum','tac','tail','tee','test','touch','tr','true','truncate','tsort','unexpand','uniq','unlink','uptime','wc','xargs','yes'),
    [System.StringComparer]::OrdinalIgnoreCase
)

$script:__COREUTILS_FAST_SKIP__ = [regex]::new(
    '\b(?:' + ($script:__COREUTILS__ -join '|') + ')\b',
    [System.Text.RegularExpressions.RegexOptions]::Compiled -bor `
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

# Casting the scriptblock to Func<Ast,bool> once and reusing it avoids the
# per-FindAll scriptblock-to-delegate wrapping overhead (~1.7x faster).
$script:__COREUTILS_CMD_PREDICATE__ = [System.Func[System.Management.Automation.Language.Ast, bool]] {
    param($n) $n -is [System.Management.Automation.Language.CommandAst]
}

$script:__COREUTILS_ARG_SPECIAL__ = [char[]] @("'", '"', '`', '$')

# Wrap arguments into quotes. By being a function we can properly handle $variables.
# As per MSVCRT, any `\` before `"` must be doubled to escape them.
function global:__coreutils_q {
    param($s)
    '"' + (([string]$s) -replace '(\\*)"', '$1$1\"' -replace '(\\+)$', '$1$1') + '"'
}

# PowerShell tokenizes `*"a"*` as [BareWord] instead of the expected [DoubleQuoted, BareWord, DoubleQuoted].
# To work around that we use... regex. Group 1 = 'single', 2 = "double", 3 = `escape, 4 = bare run.
$script:__COREUTILS_ARG_RX__ = [regex]::new(
    "'((?:[^']|'')*)'|""((?:[^""``]|""""|``.)*)""|``(.)|([^'""``]+)",
    [System.Text.RegularExpressions.RegexOptions]::Compiled
)
$script:__COREUTILS_ARG_EVAL__ = [System.Text.RegularExpressions.MatchEvaluator] {
    param($m)
    if ($m.Groups[1].Success) {
        # Single-quoted: literal. PS '' -> ', then MSVCRT-quote.
        $body = $m.Groups[1].Value.Replace("''", "'")
        if ($body -match '^(.*?)(\\+)$') {
            return '"' + ($matches[1] -replace '(\\*)"', '$1$1\"') + '"' + $matches[2]
        }
        return '"' + ($body -replace '(\\*)"', '$1$1\"') + '"'
    }
    if ($m.Groups[2].Success) {
        # Double-quoted: collapse PS quote-escapes to raw " / ', let ExpandString
        # resolve `n / `t / $var, then MSVCRT-quote.
        $body = $m.Groups[2].Value.
        Replace('`"', '"').
        Replace("``'", "'").
        Replace('""', '"')
        $body = $ExecutionContext.InvokeCommand.ExpandString($body)
        if ($body -match '^(.*?)(\\+)$') {
            return '"' + ($matches[1] -replace '(\\*)"', '$1$1\"') + '"' + $matches[2]
        }
        return '"' + ($body -replace '(\\*)"', '$1$1\"') + '"'
    }
    if ($m.Groups[3].Success) {
        # Backtick-escaped char outside a string: " -> \"; everything else
        # becomes a one-char quoted region so glob metas stay literal.
        $c = $m.Groups[3].Value
        if ($c -eq '"') {
            return '\"'
        }
        return '"' + $c + '"'
    }
    # Bare run: passed through unquoted so coreutils can glob it; expand $vars.
    return $ExecutionContext.InvokeCommand.ExpandString($m.Groups[4].Value)
}

# 0: not tested, 1: coreutils not installed, 2: coreutils installed.
$script:__COREUTILS_CMD_DIR_TEST__ = 0

# PSConsoleHostReadLine override that rewrites coreutils command names to their
# .cmd equivalents after PSReadLine returns (history keeps the original).
#
# Why .cmd over .exe: PSNativeCommandArgumentPassing = 'Windows' results in a behavior
# where passing bare quotes to CreateProcess() is impossible. This prevents us from
# passing "*" as "*" to coreutils and instead will be given as a bare *.
# This causes it to treat it as a glob pattern. "*.cmd" files however are automatically
# treated as PSNativeCommandArgumentPassing = 'Legacy', which preserves quotes.
# It is the only possible workaround and the only way coreutils can work at all.
function PSConsoleHostReadLine {
    [System.Diagnostics.DebuggerHidden()]
    param()

    $lastRunStatus = $?
    Microsoft.PowerShell.Core\Set-StrictMode -Off
    $line = [Microsoft.PowerShell.PSConsoleReadLine]::ReadLine($host.Runspace, $ExecutionContext, $lastRunStatus)

    # If the line contains no coreutils name, we don't need to parse the AST at all.
    if (-not $script:__COREUTILS_FAST_SKIP__.IsMatch($line)) {
        return $line
    }

    # Roamed/synced profiles can load this snippet on machines where coreutils is not installed.
    # Test for the existence of the command directory once and remember the result.
    if ($script:__COREUTILS_CMD_DIR_TEST__ -eq 0) {
        $script:__COREUTILS_CMD_DIR_TEST__ = 1
        if (Test-Path -LiteralPath 'C:\Program Files\coreutils\cmd\' -PathType Container -ErrorAction Ignore) {
            $script:__COREUTILS_CMD_DIR_TEST__ = 2
        }
    }
    if ($script:__COREUTILS_CMD_DIR_TEST__ -ne 2) {
        return $line
    }

    $ast = [System.Management.Automation.Language.Parser]::ParseInput($line, [ref]$null, [ref]$null)
    $commands = $ast.FindAll($script:__COREUTILS_CMD_PREDICATE__, $true)

    # Process right-to-left so earlier offsets stay valid after each splice.
    # In-place reverse beats Sort-Object for the typical 1-command line.
    if ($commands.Count -gt 1) {
        $commands = [System.Collections.Generic.List[object]]::new($commands)
        $commands.Reverse()
    }

    foreach ($cmd in $commands) {
        $name = $cmd.GetCommandName()
        if (!$name) {
            continue
        }

        $baseName = $name
        if ($name.EndsWith('.exe') -or $name.EndsWith('.cmd')) {
            $baseName = $name.Substring(0, $name.Length - 4)
        }
        if (!$script:__COREUTILS__.Contains($baseName)) {
            continue
        }

        # ls/la get colour + listing flags injected; la also rewrites to ls.
        $cmdElement = $cmd.CommandElements[0]
        $start = $cmdElement.Extent.StartOffset
        $end = $cmdElement.Extent.EndOffset
        $replacement = "& 'C:\Program Files\coreutils\cmd\"

        switch ($baseName) {
            'la' { $replacement += "ls.cmd' --color=auto -AFhl" }
            'ls' { $replacement += "ls.cmd' --color=auto" }
            default { $replacement += "$baseName.cmd'" }
        }

        # Walk command elements, merging adjacent ones whose extents touch
        # (e.g. `'a'*` parses as [SingleQuoted, BareWord] but is one shell word).
        # The inverse case `*'a'*` parses as a single BareWord whose text
        # contains the embedded quotes, which is why AST-only analysis
        # isn't enough and we still need to re-tokenize the source span.
        $argsStart = $end
        $argsEnd = $cmd.Extent.EndOffset
        $rewrittenArgs = ''
        $elements = $cmd.CommandElements
        $count = $elements.Count
        $i = 1
        while ($i -lt $count) {
            $first = $elements[$i]
            $wordStart = $first.Extent.StartOffset
            $wordEnd = $first.Extent.EndOffset
            $merged = $false
            while ($i + 1 -lt $count -and $elements[$i + 1].Extent.StartOffset -eq $wordEnd) {
                $i++
                $wordEnd = $elements[$i].Extent.EndOffset
                $merged = $true
            }
            $source = $line.Substring($wordStart, $wordEnd - $wordStart)
            $rewrittenArgs += $line.Substring($argsStart, $wordStart - $argsStart)
            $argsStart = $wordEnd
            # IndexOfAny beats running the regex per arg.
            if ($source.IndexOfAny($script:__COREUTILS_ARG_SPECIAL__) -lt 0) {
                $rewrittenArgs += $source
                $i++
                continue
            }
            # A single un-merged PS expression that needs $var resolution
            # (bare $var, "...$var...", $x.Member, $($expr), etc.).
            # Defer evaluation to runtime so the value reaches coreutils as a literal arg.
            # This matches POSIX behaviour where variable expansions don't result in globbing.
            if (-not $merged -and
                ($first -is [System.Management.Automation.Language.VariableExpressionAst] -or
                $first -is [System.Management.Automation.Language.ExpandableStringExpressionAst] -or
                $first -is [System.Management.Automation.Language.MemberExpressionAst])) {
                $rewrittenArgs += '(__coreutils_q ' + $source + ')'
                $i++
                continue
            }
            # Slow path: re-tokenise and re-emit as MSVCRT-style quoting,
            # then wrap in PS single quotes so PS hands the body verbatim.
            $windowsQuoted = $script:__COREUTILS_ARG_RX__.Replace($source, $script:__COREUTILS_ARG_EVAL__)
            $rewrittenArgs += "'" + $windowsQuoted.Replace("'", "''") + "'"
            $i++
        }
        $rewrittenArgs += $line.Substring($argsStart, $argsEnd - $argsStart)

        $line = $line.Substring(0, $start) + $replacement + $rewrittenArgs + $line.Substring($argsEnd)
    }

    return $line
}
# ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# DO NOT MODIFY -- coreutils -- 60b36fc6-2d59-49df-be51-28dd2f4c3c9a
}
