// Agent Skills (SKILL.md) store. Creation semantics follow Hermes skill_manager_tool (MIT, Nous Research):
// after a successful task the agent writes a reusable procedure (self-learning loop).
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

export type Skill = { name: string; description: string; body: string; path: string };

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);

export class Skills {
  constructor(readonly dir: string) {
    mkdirSync(dir, { recursive: true });
  }

  async create(name: string, description: string, body: string): Promise<Skill> {
    const id = slug(name);
    if (!id) throw new Error("invalid skill name");
    mkdirSync(join(this.dir, id), { recursive: true });
    const path = join(this.dir, id, "SKILL.md");
    const desc = description.replace(/\s+/g, " ").trim();
    await Bun.write(path, `---\nname: ${id}\ndescription: ${desc}\n---\n\n${body.trim()}\n`);
    return { name: id, description: desc, body, path };
  }

  async list(): Promise<Skill[]> {
    if (!existsSync(this.dir)) return [];
    const out: Skill[] = [];
    for (const id of readdirSync(this.dir)) {
      const path = join(this.dir, id, "SKILL.md");
      if (!existsSync(path)) continue;
      const text = (await Bun.file(path).text()).replace(/\r\n/g, "\n");
      const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      const description = m?.[1]?.match(/^description:\s*(.*)$/m)?.[1] ?? "";
      out.push({ name: id, description, body: m?.[2] ?? text, path });
    }
    return out;
  }
}
