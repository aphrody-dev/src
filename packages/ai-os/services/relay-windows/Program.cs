// Service Windows « AphrodyRelay » : supervise `bun <cli.ts> serve`.
// Le relais doit agir avec l'identité de l'utilisateur (sessions agy/Antigravity, Claude Code, gcloud, clés ssh
// protégées par DPAPI ou par ACL) sans qu'aucun mot de passe soit stocké : le service (LocalSystem) lance le relais dans
// la session console active avec le jeton de l'utilisateur (WTSQueryUserToken + CreateProcessAsUserW, procédé documenté
// pour les services : Learn « WTSQueryUserToken »). Sans session ouverte, il attend qu'une session s'ouvre.
// Relance après un arrêt inattendu (attente croissante plafonnée à 60 s) et arrêt de l'enfant avec le service.
// Configuration (HKLM\SYSTEM\CurrentControlSet\Services\AphrodyRelay\Environment, posée par install.ps1) :
//   RELAY_BUN, RELAY_CLI, RELAY_HOME, RELAY_PORT, RELAY_TCP_PORT, SRC_ROOT, et TLS éventuel.
using System.ComponentModel;
using System.Runtime.InteropServices;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddWindowsService(o => o.ServiceName = "AphrodyRelay");
builder.Services.AddHostedService<RelayWorker>();
builder.Build().Run();

sealed partial class RelayWorker(ILogger<RelayWorker> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stop)
    {
        var bun = Environment.GetEnvironmentVariable("RELAY_BUN") ?? "bun.exe";
        var cli = Environment.GetEnvironmentVariable("RELAY_CLI") ?? throw new InvalidOperationException("RELAY_CLI manquant");
        var relayEnv = new[] { "RELAY_HOME", "RELAY_PORT", "RELAY_TCP_PORT", "RELAY_TLS_PORT", "RELAY_TLS_CERT", "RELAY_TLS_KEY", "RELAY_CDP_PORT", "SRC_ROOT", "RELAY_AGY_MODEL" }
            .Select(k => (k, v: Environment.GetEnvironmentVariable(k))).Where(x => x.v is not null).ToArray();
        var delay = TimeSpan.FromSeconds(1);
        while (!stop.IsCancellationRequested)
        {
            var session = Native.WTSGetActiveConsoleSessionId();
            if (session == 0xFFFFFFFF || !Native.WTSQueryUserToken(session, out var token))
            {
                await Task.Delay(TimeSpan.FromSeconds(5), stop).ContinueWith(_ => { });
                continue;
            }
            var started = DateTime.UtcNow;
            uint exit;
            using (token)
            {
                var pi = Native.StartAsUser(token, $"\"{bun}\" \"{cli}\" serve", relayEnv);
                log.LogInformation("relay lancé dans la session {Session} (pid {Pid})", session, pi.dwProcessId);
                using var proc = new Native.SafeKernelHandle(pi.hProcess);
                using var thread = new Native.SafeKernelHandle(pi.hThread);
                try
                {
                    while (Native.WaitForSingleObject(proc, 500) == 0x102) stop.ThrowIfCancellationRequested();
                }
                catch (OperationCanceledException)
                {
                    Native.TerminateProcess(proc, 0);
                    return;
                }
                Native.GetExitCodeProcess(proc, out exit);
            }
            log.LogWarning("relay terminé (code {Code}), relance dans {Delay}", exit, delay);
            if (DateTime.UtcNow - started > TimeSpan.FromMinutes(5)) delay = TimeSpan.FromSeconds(1);
            await Task.Delay(delay, stop).ContinueWith(_ => { });
            delay = TimeSpan.FromSeconds(Math.Min(60, delay.TotalSeconds * 2));
        }
    }
}

static partial class Native
{
    public sealed class SafeKernelHandle : Microsoft.Win32.SafeHandles.SafeHandleZeroOrMinusOneIsInvalid
    {
        public SafeKernelHandle() : base(true) { }
        public SafeKernelHandle(nint h) : base(true) => SetHandle(h);
        protected override bool ReleaseHandle() => CloseHandle(handle);
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct STARTUPINFOW
    {
        public int cb;
        public nint lpReserved, lpDesktop, lpTitle;
        public int dwX, dwY, dwXSize, dwYSize, dwXCountChars, dwYCountChars, dwFillAttribute, dwFlags;
        public short wShowWindow, cbReserved2;
        public nint lpReserved2, hStdInput, hStdOutput, hStdError;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct PROCESS_INFORMATION
    {
        public nint hProcess, hThread;
        public int dwProcessId, dwThreadId;
    }

    const uint CREATE_UNICODE_ENVIRONMENT = 0x400, CREATE_NO_WINDOW = 0x08000000;

    [LibraryImport("kernel32.dll")]
    public static partial uint WTSGetActiveConsoleSessionId();

    [LibraryImport("wtsapi32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static partial bool WTSQueryUserToken(uint session, out SafeKernelHandle token);

    [LibraryImport("userenv.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool CreateEnvironmentBlock(out nint env, SafeKernelHandle token, [MarshalAs(UnmanagedType.Bool)] bool inherit);

    [LibraryImport("userenv.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool DestroyEnvironmentBlock(nint env);

    [LibraryImport("advapi32.dll", EntryPoint = "CreateProcessAsUserW", SetLastError = true, StringMarshalling = StringMarshalling.Utf16)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool CreateProcessAsUser(SafeKernelHandle token, string? app, [MarshalAs(UnmanagedType.LPWStr)] string cmd, nint pa, nint ta,
        [MarshalAs(UnmanagedType.Bool)] bool inherit, uint flags, nint env, string? cwd, ref STARTUPINFOW si, out PROCESS_INFORMATION pi);

    [LibraryImport("kernel32.dll")]
    public static partial uint WaitForSingleObject(SafeKernelHandle h, uint ms);

    [LibraryImport("kernel32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static partial bool GetExitCodeProcess(SafeKernelHandle h, out uint code);

    [LibraryImport("kernel32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static partial bool TerminateProcess(SafeKernelHandle h, uint code);

    [LibraryImport("kernel32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool CloseHandle(nint h);

    /// Lance `cmd` avec le jeton et le bloc d'environnement de l'utilisateur, plus les variables du relais.
    public static PROCESS_INFORMATION StartAsUser(SafeKernelHandle token, string cmd, (string k, string? v)[] extra)
    {
        if (!CreateEnvironmentBlock(out var block, token, false)) throw new Win32Exception();
        try
        {
            // Bloc Unicode : "k=v\0k=v\0\0" ; les variables du relais remplacent celles du profil.
            var vars = new SortedDictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (var p = block; ;)
            {
                var s = Marshal.PtrToStringUni(p)!;
                if (s.Length == 0) break;
                var i = s.IndexOf('=', 1);
                if (i > 0) vars[s[..i]] = s[(i + 1)..];
                p += (s.Length + 1) * 2;
            }
            foreach (var (k, v) in extra) vars[k] = v!;
            var env = Marshal.StringToHGlobalUni(string.Concat(vars.Select(kv => $"{kv.Key}={kv.Value}\0")) + "\0");
            try
            {
                var si = new STARTUPINFOW { cb = Marshal.SizeOf<STARTUPINFOW>() };
                var desktop = Marshal.StringToHGlobalUni(@"winsta0\default");
                si.lpDesktop = desktop;
                try
                {
                    if (!CreateProcessAsUser(token, null, cmd, 0, 0, false, CREATE_UNICODE_ENVIRONMENT | CREATE_NO_WINDOW, env, vars.GetValueOrDefault("USERPROFILE"), ref si, out var pi))
                        throw new Win32Exception();
                    return pi;
                }
                finally { Marshal.FreeHGlobal(desktop); }
            }
            finally { Marshal.FreeHGlobal(env); }
        }
        finally { DestroyEnvironmentBlock(block); }
    }
}
