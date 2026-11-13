// UI sounds from the asset library (assets/library/audio/ui, CC0): rollover on focus, click on activation.
// The AudioContext is created on the first user gesture; every failure is silent (sound is optional).
export interface Sounds {
  enabled: boolean;
  play(name: "rollover" | "click"): void;
  unlock(): void;
}

const FILES = { rollover: "rollover1.ogg", click: "click1.ogg" } as const;

export function createSounds(base: string): Sounds {
  let ctx: AudioContext | null = null;
  const buffers = new Map<string, AudioBuffer>();
  const load = async (name: keyof typeof FILES) => {
    if (!ctx || buffers.has(name)) return;
    try {
      const data = await (await fetch(`${base}/${FILES[name]}`)).arrayBuffer();
      buffers.set(name, await ctx.decodeAudioData(data));
    } catch {
      /* no sound */
    }
  };
  const s: Sounds = {
    enabled: true,
    unlock() {
      if (ctx) return void ctx.resume().catch(() => {});
      try {
        ctx = new AudioContext({ latencyHint: "interactive" });
        void Promise.all([load("rollover"), load("click")]);
      } catch {
        ctx = null;
      }
    },
    play(name) {
      const b = buffers.get(name);
      if (!s.enabled || !ctx || !b || ctx.state !== "running") return;
      const src = ctx.createBufferSource();
      const g = ctx.createGain();
      g.gain.value = name === "click" ? 0.4 : 0.25;
      src.buffer = b;
      src.connect(g).connect(ctx.destination);
      src.start();
    },
  };
  return s;
}
