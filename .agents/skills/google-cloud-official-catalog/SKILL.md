---
name: google-cloud-official-catalog
description: Router to the official google/skills catalog (GKE, Cloud Run, BigQuery, Spanner, Vertex AI, AlloyDB, IAM, Firebase) vendored in third_party/google-skills, plus guarded gcloud use. Use for any Google Cloud task.
---

# Google Cloud official skills

The catalog is the `google-skills` fork (`src.lock.json`, `third_party/google-skills/skills/`). One folder per product area, each holding one folder per skill with a `SKILL.md`:

- `third_party/google-skills/skills/cloud/<skill>/SKILL.md`: Google Cloud products (agent platform, API Gateway, BigQuery, Bigtable, Cloud Build, Cloud Logging, ...).
- Other areas next to it: `ads`, `analytics`, `developers`, `identity`, `platform-devices`.

Find a skill with `fd -t d <product> third_party/google-skills/skills`, then read its `SKILL.md`. Do not rely on a copied list here: the catalog moves with upstream.

gcloud: use the `env-kit accounts` principals (`env-kit accounts status`) and `env-kit billing` rather than ad hoc `gcloud auth`; read-only fleet and gcloud queries are also available through the relay (skill `ai-os-orchestrator`, tool `fleet_status`).
