// One patch = one commit (branch model) or one .patch file (series model). Its upstream status lives in
// git trailers, the Yocto convention (docs.yoctoproject.org, contributor guide, "Patch Upstream Status"):
//   Upstream-Status: Pending | Submitted [where] | Backport [where] | Denied [why] | Inappropriate [why]
// plus `Upstream-PR: <url>` for the review (GitHub PR or Gerrit change). Trailers are ours: they are
// stripped from the commit that goes upstream.

export type Status =
  "pending" | "submitted" | "backport" | "denied" | "inappropriate" | "unknown";

export type Meta = {
  subject: string;
  body: string; // message without subject and without our trailers
  status: Status;
  statusNote: string; // the [..] part
  pr: string | null;
  owner: string | null; // Upstream-Owner: who carries it (agent or person), for coordination
};

const OUR_TRAILERS = /^(Upstream-Status|Upstream-PR|Upstream-Owner):\s*(.*)$/i;

export function parseMessage(message: string): Meta {
  const lines = message.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n");
  const subject = lines[0] ?? "";
  let status: Status = "unknown";
  let statusNote = "";
  let pr: string | null = null;
  let owner: string | null = null;
  const kept: string[] = [];
  for (const line of lines.slice(1)) {
    const m = OUR_TRAILERS.exec(line);
    if (!m) {
      kept.push(line);
      continue;
    }
    const key = m[1]!.toLowerCase();
    const value = m[2]!.trim();
    if (key === "upstream-status") {
      const s = /^(\w[\w-]*)\s*(?:\[(.*)\])?/.exec(value);
      const word = (s?.[1] ?? "").toLowerCase();
      status =
        (
          [
            "pending",
            "submitted",
            "backport",
            "denied",
            "inappropriate",
          ] as const
        ).find((w) => w === word) ?? "unknown";
      statusNote = s?.[2]?.trim() ?? "";
    } else if (key === "upstream-pr") pr = value || null;
    else owner = value || null;
  }
  const body = kept.join("\n").replace(/^\n+/, "").replace(/\n+$/, "");
  return { subject, body, status, statusNote, pr, owner };
}

/** Message with our trailers replaced (status, PR, owner), every other trailer kept in place. */
export function withMeta(
  message: string,
  meta: Pick<Meta, "status" | "statusNote" | "pr" | "owner">,
): string {
  const m = parseMessage(message);
  const trailers: string[] = [];
  if (meta.status !== "unknown") {
    const word = meta.status[0]!.toUpperCase() + meta.status.slice(1);
    trailers.push(
      `Upstream-Status: ${word}${meta.statusNote ? ` [${meta.statusNote}]` : ""}`,
    );
  }
  if (meta.pr) trailers.push(`Upstream-PR: ${meta.pr}`);
  if (meta.owner) trailers.push(`Upstream-Owner: ${meta.owner}`);
  const body = m.body;
  // Our trailers join the existing trailer block when the body already ends with one.
  const lastPara = body.split("\n\n").at(-1) ?? "";
  const endsWithTrailers =
    body !== "" &&
    lastPara.split("\n").every((l) => /^[A-Za-z][\w-]*: /.test(l));
  let out = m.subject + "\n";
  if (body) out += "\n" + body + "\n";
  if (trailers.length)
    out += (endsWithTrailers ? "" : "\n") + trailers.join("\n") + "\n";
  return out;
}

/** The message sent upstream: our trailers removed. */
export function upstreamMessage(message: string): string {
  const m = parseMessage(message);
  return m.subject + "\n" + (m.body ? "\n" + m.body + "\n" : "");
}

/** Electron's munge_subject_to_filename (script/lib/git.py), so names match their convention. */
export function slug(subject: string): string {
  const s = subject.endsWith(".patch") ? subject.slice(0, -6) : subject;
  return s
    .replace(/[^A-Za-z0-9-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
    .slice(0, 72)
    .replace(/_+$/, "");
}

/** Ephemeral PR head name on the fork: up/<slug with dashes>. */
export function headRef(subject: string): string {
  return (
    "up/" + slug(subject).replace(/_/g, "-").slice(0, 60).replace(/-+$/, "")
  );
}

/** What the stack should do with this patch, from its status and the live review state. */
export type Review = {
  state: "open" | "merged" | "closed" | "abandoned" | "new" | "unknown";
  url: string;
  merged_at?: string | null;
};

export function recommendation(meta: Meta, review: Review | null): string {
  if (review?.state === "merged") return "retirer : fusionné en amont";
  if (meta.status === "backport")
    return "retirer au prochain rebase : présent en amont";
  if (
    review?.state === "closed" ||
    review?.state === "abandoned" ||
    meta.status === "denied"
  )
    return "refusé en amont : retravailler ou passer en Inappropriate";
  if (
    meta.status === "submitted" ||
    review?.state === "open" ||
    review?.state === "new"
  )
    return "en revue : suivre";
  if (meta.status === "inappropriate")
    return "propre à Aphrody : garder, minimiser";
  if (meta.status === "pending") return "à proposer";
  return "statut manquant : ajouter Upstream-Status";
}
