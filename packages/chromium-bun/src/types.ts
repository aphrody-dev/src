export type SovereignLayerId = 1 | 2 | 3 | 4 | 5 | 6;

export interface SovereignLayer {
  id: SovereignLayerId;
  name: string;
  codename: string;
  description: string;
  canonicalSource: string;
  roleInStack: string;
}

export type AuditVerdict = "PURGE_FOR_BUN" | "KEEP_CHROMIUM_NATIVE";

export interface DependencyAudit {
  name: string;
  relPath: string;
  sizeBytes?: number;
  verdict: AuditVerdict;
  rationale: string;
  replacementOrNativePath: string;
  layer: SovereignLayerId;
}

export interface ContestantMetric {
  name: string;
  opsPerSec?: number;
  latencyUs?: number;
  throughputMBs?: number;
  rawDurationMs?: number;
  details?: Record<string, unknown>;
}

export interface BenchmarkRecord {
  id: string;
  category:
    "A_ENGINES" | "B_OS_POSIX" | "C_SHELLS" | "D_BUILD" | "E_COMPRESSION_DB";
  title: string;
  contestants: ContestantMetric[];
  winner: string;
  runnerUp?: string;
  speedupFactor: number;
  primaryMetric: string;
  winnerLayer: SovereignLayerId;
  summary: string;
}

export interface WinnerManifest {
  timestamp: string;
  hostHardware: {
    gpu: string;
    cpu: string;
    ram: string;
    os: string;
  };
  provenance: { commit: string; command: string; host: string };
  totalBenchmarks: number;
  winnersByLayer: Record<SovereignLayerId, number>;
  winners: BenchmarkRecord[];
  auditSummary: {
    totalAudited: number;
    purgedForBun: number;
    keptChromiumNative: number;
  };
}
