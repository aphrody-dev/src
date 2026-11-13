// Library: user-supplied files kept in the Origin Private File System (nothing is uploaded, nothing is bundled).
export type Kind = "rom" | "iso" | "swf" | "other";
export interface Entry {
  name: string;
  size: number;
  kind: Kind;
  /** EmulatorJS core id for ROMs. */
  core?: string;
}
const ROM: Record<string, string> = {
  nes: "nes",
  sfc: "snes",
  smc: "snes",
  gb: "gb",
  gbc: "gb",
  gba: "gba",
  md: "segaMD",
  gen: "segaMD",
  smd: "segaMD",
  n64: "n64",
  z64: "n64",
  v64: "n64",
  pce: "pce",
  nds: "nds",
  a26: "atari2600",
  lnx: "lynx",
  ws: "ws",
  wsc: "ws",
};
export const classify = (name: string): { kind: Kind; core?: string } => {
  const ext = name.split(".").pop()!.toLowerCase();
  if (ext === "swf") return { kind: "swf" };
  if (ext === "iso" || ext === "img") return { kind: "iso" };
  if (ROM[ext]) return { kind: "rom", core: ROM[ext] };
  return { kind: "other" };
};
const dir = async () =>
  (await navigator.storage.getDirectory()).getDirectoryHandle("library", {
    create: true,
  });

export async function list(): Promise<Entry[]> {
  const d = await dir();
  const out: Entry[] = [];
  for await (const [name, h] of d as unknown as AsyncIterable<
    [string, FileSystemHandle]
  >) {
    if (h.kind !== "file") continue;
    const f = await (h as FileSystemFileHandle).getFile();
    out.push({ name, size: f.size, ...classify(name) });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
export async function put(file: File): Promise<void> {
  const h = await (await dir()).getFileHandle(file.name, { create: true });
  const w = await h.createWritable();
  await file.stream().pipeTo(w);
}
export const get = async (name: string): Promise<File> =>
  (await (await dir()).getFileHandle(name)).getFile();
export const remove = async (name: string): Promise<void> =>
  (await dir()).removeEntry(name);

/** File System Access picker when present, a plain input otherwise. */
export async function pick(accept = ""): Promise<File[]> {
  const w = window as unknown as {
    showOpenFilePicker?: (o: unknown) => Promise<FileSystemFileHandle[]>;
  };
  if (w.showOpenFilePicker) {
    try {
      return await Promise.all(
        (await w.showOpenFilePicker({ multiple: true })).map((h) =>
          h.getFile(),
        ),
      );
    } catch {
      return [];
    }
  }
  return new Promise((res) => {
    const i = document.createElement("input");
    i.type = "file";
    i.multiple = true;
    if (accept) i.accept = accept;
    i.onchange = () => res([...(i.files ?? [])]);
    i.click();
  });
}
export const fmt = (n: number) =>
  n > 1e6
    ? `${(n / 1e6).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1e3))} kB`;
export const putAll = async (files: File[]): Promise<void> => {
  for (const f of files) await put(f);
};
