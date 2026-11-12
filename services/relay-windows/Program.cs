// Service Windows « AphrodyRelay » : lance `bun <cli.ts> serve`, relance après un arrêt inattendu (attente croissante,
// plafonnée à 60 s) et arrête l'enfant avec le service. Configuration par variables d'environnement du service
// (clé de registre HKLM\SYSTEM\CurrentControlSet\Services\AphrodyRelay\Environment, posée par install.ps1) :
//   RELAY_BUN (bun.exe), RELAY_CLI (packages/relay/src/cli.ts), RELAY_HOME (dossier du jeton et du profil Chrome),
//   RELAY_PORT, RELAY_TCP_PORT, RELAY_GEMINI (web|cli), RELAY_CDP_PORT (Chrome du relais ouvert dans la session utilisateur).
using System.Diagnostics;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddWindowsService(o => o.ServiceName = "AphrodyRelay");
builder.Services.AddHostedService<RelayWorker>();
builder.Build().Run();

sealed class RelayWorker(ILogger<RelayWorker> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stop)
    {
        var bun = Environment.GetEnvironmentVariable("RELAY_BUN") ?? "bun.exe";
        var cli = Environment.GetEnvironmentVariable("RELAY_CLI") ?? throw new InvalidOperationException("RELAY_CLI manquant");
        var delay = TimeSpan.FromSeconds(1);
        while (!stop.IsCancellationRequested)
        {
            var psi = new ProcessStartInfo(bun) { UseShellExecute = false, RedirectStandardError = true, CreateNoWindow = true };
            psi.ArgumentList.Add(cli);
            psi.ArgumentList.Add("serve");
            using var p = Process.Start(psi)!;
            p.ErrorDataReceived += (_, e) => { if (e.Data is { } line) log.LogInformation("{Line}", line); };
            p.BeginErrorReadLine();
            var started = DateTime.UtcNow;
            try
            {
                await p.WaitForExitAsync(stop);
            }
            catch (OperationCanceledException)
            {
                if (!p.HasExited) p.Kill(entireProcessTree: true);
                return;
            }
            log.LogWarning("relay terminé (code {Code}), relance dans {Delay}", p.ExitCode, delay);
            if (DateTime.UtcNow - started > TimeSpan.FromMinutes(5)) delay = TimeSpan.FromSeconds(1);
            await Task.Delay(delay, stop).ContinueWith(_ => { });
            delay = TimeSpan.FromSeconds(Math.Min(60, delay.TotalSeconds * 2));
        }
    }
}
