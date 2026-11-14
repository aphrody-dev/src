use clap::{Parser, Subcommand};
use rust_stack_ffi::{
    auth::{ApiKeyCreateRequest, AuthEngine, issue_hs256_jwt, verify_hs256_jwt},
    coding_agent::CodingAgent,
    gateway::{GatewayState, deterministic_simd_embedding, serve_http},
    shadcn_rs::{
        REGISTRY_COMPONENTS, RenderTarget, ThemeMode, add_component_to_dir,
        default_primitive_for_slug, render_card_fast, theme_css_tokens,
    },
    webui::WebUiStore,
};
use std::path::PathBuf;
use std::time::Instant;

#[derive(Parser)]
#[command(
    name = "rust-stack",
    version = "0.1.0",
    about = "100% Pure-Rust Aphrody Stack: Better-Auth + shadcn_rs + Open-WebUI + OpenCode + OpenAI Gateway"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the unified HTTP server (Gateway + Better-Auth + shadcn_rs Registry + Native WebUI)
    Serve {
        #[arg(long, default_value = "127.0.0.1")]
        host: String,
        #[arg(long, short, default_value_t = 4320)]
        port: u16,
        #[arg(long, default_value_os_t = default_db())]
        db: PathBuf,
        #[arg(long, default_value_t = false)]
        offline_only: bool,
    },
    /// shadcn_rs component & design-token CLI (`rust-stack ui add <component> --target html|dioxus|gpui`)
    Ui {
        #[command(subcommand)]
        action: UiCommands,
    },
    /// Autonomous terminal coding agent (`rust-stack code` / `rsc`)
    #[command(visible_alias = "rsc")]
    Code {
        /// Task prompt to execute in the workspace
        #[arg(default_value = "Inspect workspace structure")]
        prompt: String,
        #[arg(long, default_value = ".")]
        workspace: PathBuf,
        #[arg(long, default_value = "http://127.0.0.1:4320")]
        gateway: String,
        #[arg(long, default_value = "sovereign/ring3-local")]
        model: String,
    },
    /// Better-Auth native IAM utilities (issue scoped API keys, inspect JWKS)
    Auth {
        #[command(subcommand)]
        action: AuthCommands,
    },
    /// Run deterministic microbenchmarks (Blake3, HS256/Ed25519 JWT, SSR Card, SIMD Embeddings)
    Bench {
        #[arg(long, default_value_t = 100_000)]
        iterations: usize,
    },
    /// Print instant version & readiness probe
    Doctor,
}

#[derive(Subcommand)]
enum UiCommands {
    /// Generate or write a component to disk (`html`, `dioxus`, or `gpui` target)
    Add {
        component: String,
        #[arg(long, short, default_value = "html")]
        target: String,
        #[arg(long, short)]
        out_dir: Option<PathBuf>,
    },
    /// List all strongly-typed components in the shadcn_rs registry
    List,
    /// Emit OKLCH/HCT + Fluent 2 CSS design tokens
    Tokens {
        #[arg(long, default_value_t = false)]
        light: bool,
    },
}

#[derive(Subcommand)]
enum AuthCommands {
    /// Issue a Blake3-hashed `sk_sov_...` API key stored in SQLite WAL
    IssueKey {
        #[arg(long, default_value = "cli-key")]
        name: String,
        #[arg(long, default_value = "chat:completions,models:read")]
        scopes: String,
        #[arg(long, default_value_os_t = default_db())]
        db: PathBuf,
    },
    /// Print active Ed25519 OIDC JWKS document
    Jwks {
        #[arg(long, default_value_os_t = default_db())]
        db: PathBuf,
    },
}

/// `~/.rust-stack/sovereign.sqlite3` (`%USERPROFILE%` on Windows, `$HOME` elsewhere).
fn default_db() -> PathBuf {
    let key = if cfg!(windows) { "USERPROFILE" } else { "HOME" };
    std::env::var_os(key)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".rust-stack")
        .join("sovereign.sqlite3")
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();
    if let Err(err) = dispatch(cli).await {
        eprintln!("error: {err}");
        std::process::exit(1);
    }
}

async fn dispatch(cli: Cli) -> Result<(), String> {
    match cli.command {
        Commands::Serve {
            host,
            port,
            db,
            offline_only,
        } => {
            let secret = resolve_hmac_key();
            let auth = AuthEngine::open(&db, &secret)?;
            let webui = WebUiStore::open(&db)?;
            let state = GatewayState::new(auth, webui, !offline_only);
            let bind = format!("{host}:{port}");
            println!("rust-stack v0.1.0 listening on http://{bind}");
            println!("  WebUI Workspace : http://{bind}/");
            println!("  OpenAI Gateway  : http://{bind}/v1/chat/completions");
            println!("  Better-Auth API : http://{bind}/api/auth/jwks");
            println!("  shadcn_rs API   : http://{bind}/api/ui/components");
            serve_http(&bind, state).await
        }
        Commands::Ui { action } => match action {
            UiCommands::Add {
                component,
                target,
                out_dir,
            } => {
                let parsed_target = RenderTarget::parse(&target)?;
                if let Some(dir) = out_dir {
                    let (written, _) = add_component_to_dir(&component, parsed_target, &dir)?;
                    println!("wrote {} ({target})", written.display());
                } else {
                    let prim = default_primitive_for_slug(&component)?;
                    println!("{}", prim.render(parsed_target));
                }
                Ok(())
            }
            UiCommands::List => {
                for spec in REGISTRY_COMPONENTS {
                    println!(
                        "{:<18} | {:<10} | targets={} | {}",
                        spec.slug,
                        spec.category,
                        spec.targets.join(","),
                        spec.description
                    );
                }
                Ok(())
            }
            UiCommands::Tokens { light } => {
                let mode = if light {
                    ThemeMode::AphrodyLight
                } else {
                    ThemeMode::AphrodyDark
                };
                println!("{}", theme_css_tokens(mode));
                Ok(())
            }
        },
        Commands::Code {
            prompt,
            workspace,
            gateway,
            model,
        } => {
            let agent = CodingAgent::new(&workspace, gateway, model)?;
            let report = agent.run_task(&prompt)?;
            println!(
                "[rsc] steps={} model={} tools_executed={}",
                report.steps,
                report.model,
                report.tool_results.len()
            );
            println!("{}", report.final_answer);
            Ok(())
        }
        Commands::Auth { action } => match action {
            AuthCommands::IssueKey { name, scopes, db } => {
                let auth = AuthEngine::open(&db, &resolve_hmac_key())?;
                let scope_vec = scopes
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect();
                let issued = auth.create_api_key(ApiKeyCreateRequest {
                    name,
                    scopes: scope_vec,
                    ttl_secs: None,
                    user_id: None,
                })?;
                println!(
                    "{}",
                    serde_json::to_string_pretty(&issued).unwrap_or_default()
                );
                Ok(())
            }
            AuthCommands::Jwks { db } => {
                let auth = AuthEngine::open(&db, &resolve_hmac_key())?;
                println!(
                    "{}",
                    serde_json::to_string_pretty(&auth.jwks()).unwrap_or_default()
                );
                Ok(())
            }
        },
        Commands::Bench { iterations } => {
            run_benchmarks(iterations)?;
            Ok(())
        }
        Commands::Doctor => {
            println!("rust-stack 0.1.0 | abi_v={} | components={} | status=READY", rust_stack_ffi::rs_abi_version(), REGISTRY_COMPONENTS.len());
            Ok(())
        }
    }
}

fn resolve_hmac_key() -> Vec<u8> {
    if let Ok(v) = std::env::var("RUST_STACK_HMAC_SECRET")
        && !v.trim().is_empty()
    {
        return v.into_bytes();
    }
    b"rust-stack-default-local-dev-key-2024".to_vec()
}

fn run_benchmarks(iters: usize) -> Result<(), String> {
    let n = iters.max(1_000);
    let payload = b"POST /v1/chat/completions sovereign prompt cache benchmark payload 2024";

    let t0 = Instant::now();
    let mut acc = 0u8;
    for _ in 0..n {
        let h = blake3::hash(payload);
        acc ^= h.as_bytes()[0];
    }
    let blake3_secs = t0.elapsed().as_secs_f64();
    let blake3_ops = (n as f64) / blake3_secs;

    let secret = b"bench-hmac-secret-32-bytes-long!";
    let sample_jwt = issue_hs256_jwt("usr_bench", secret, 3600, None)?;
    let t1 = Instant::now();
    let mut valid_count = 0usize;
    for _ in 0..n {
        if verify_hs256_jwt(&sample_jwt, secret).is_ok() {
            valid_count += 1;
        }
    }
    let jwt_secs = t1.elapsed().as_secs_f64();
    let jwt_ops = (n as f64) / jwt_secs;

    let t2 = Instant::now();
    let mut html_bytes = 0usize;
    for _ in 0..n {
        let s = render_card_fast("Aphrody Card", "Zero-JS OKLCH SSR benchmark");
        html_bytes += s.len();
    }
    let card_secs = t2.elapsed().as_secs_f64();
    let card_ops = (n as f64) / card_secs;

    let embed_iters = (n / 10).max(1_000);
    let t3 = Instant::now();
    let mut emb_acc = 0.0f32;
    for _ in 0..embed_iters {
        let v = deterministic_simd_embedding("SIMD normalized 256-d vector", 256);
        emb_acc += v[0];
    }
    let emb_secs = t3.elapsed().as_secs_f64();
    let emb_ops = (embed_iters as f64) / emb_secs;

    println!("=== rust-stack Pure-Rust Benchmark Suite (n={n}) ===");
    println!("blake3_prompt_hash   : {:>12.0} ops/sec (checksum={acc})", blake3_ops);
    println!("jwt_hs256_verify     : {:>12.0} ops/sec (verified={valid_count})", jwt_ops);
    println!("shadcn_rs_card_ssr   : {:>12.0} ops/sec (bytes={html_bytes})", card_ops);
    println!("simd_embed_256d      : {:>12.0} ops/sec (acc={emb_acc:.3})", emb_ops);
    Ok(())
}
