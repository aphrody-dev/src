use crate::auth::{
    ApiKeyCreateRequest, AuthEngine, OAuthAuthorizeRequest, OAuthTokenRequest,
    PasskeyChallengeRequest, SignInEmailRequest, SignUpEmailRequest, unix_now,
};
use crate::shadcn_rs::{REGISTRY_COMPONENTS, RenderTarget, default_primitive_for_slug};
use crate::webui::{
    AppendMessageRequest, CreateConversationRequest, PROMPT_LIBRARY, WebUiStore,
    render_workspace_html,
};
use axum::{
    Json, Router,
    body::Body,
    extract::{Path as AxumPath, Query, State},
    http::{HeaderMap, HeaderValue, StatusCode, header},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::HashMap;
use std::sync::{
    Arc, RwLock,
    atomic::{AtomicU64, Ordering},
};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderEndpoint {
    pub id: &'static str,
    pub base_url: &'static str,
    pub kind: &'static str,
    pub requires_env_key: Option<&'static str>,
}

pub const SOVEREIGN_PROVIDERS: &[ProviderEndpoint] = &[
    ProviderEndpoint {
        id: "ring3-agent",
        base_url: "http://127.0.0.1:8787",
        kind: "openai-compatible",
        requires_env_key: None,
    },
    ProviderEndpoint {
        id: "ai-os",
        base_url: "http://127.0.0.1:4318",
        kind: "openai-compatible",
        requires_env_key: None,
    },
    ProviderEndpoint {
        id: "triad",
        base_url: "http://127.0.0.1:4319",
        kind: "openai-compatible",
        requires_env_key: None,
    },
    ProviderEndpoint {
        id: "ollama",
        base_url: "http://127.0.0.1:11434",
        kind: "ollama-openai",
        requires_env_key: None,
    },
    ProviderEndpoint {
        id: "anthropic",
        base_url: "https://api.anthropic.com",
        kind: "anthropic",
        requires_env_key: Some("ANTHROPIC_API_KEY"),
    },
    ProviderEndpoint {
        id: "gemini",
        base_url: "https://generativelanguage.googleapis.com/v1beta/openai",
        kind: "openai-compatible",
        requires_env_key: Some("GEMINI_API_KEY"),
    },
    ProviderEndpoint {
        id: "openai",
        base_url: "https://api.openai.com",
        kind: "openai-compatible",
        requires_env_key: Some("OPENAI_API_KEY"),
    },
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    #[serde(default)]
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatCompletionRequest {
    #[serde(default = "default_model")]
    pub model: String,
    #[serde(default)]
    pub messages: Vec<ChatMessage>,
    #[serde(default)]
    pub stream: bool,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

fn default_model() -> String {
    "sovereign/ring3-local".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum EmbeddingInput {
    Single(String),
    Batch(Vec<String>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddingRequest {
    #[serde(default = "default_embedding_model")]
    pub model: String,
    pub input: EmbeddingInput,
    pub dimensions: Option<usize>,
}

fn default_embedding_model() -> String {
    "sovereign/blake3-embed-256".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResponsesApiRequest {
    #[serde(default = "default_model")]
    pub model: String,
    #[serde(default)]
    pub input: Value,
    #[serde(default)]
    pub stream: bool,
}

#[derive(Clone)]
pub struct CachedCompletion {
    pub content: String,
    pub provider: String,
    pub digest: String,
}

#[derive(Clone)]
pub struct GatewayState {
    pub auth: AuthEngine,
    pub webui: WebUiStore,
    pub prompt_cache: Arc<RwLock<HashMap<String, CachedCompletion>>>,
    pub cache_hits: Arc<AtomicU64>,
    pub total_requests: Arc<AtomicU64>,
    pub allow_upstream_network: bool,
}

impl GatewayState {
    pub fn new(auth: AuthEngine, webui: WebUiStore, allow_upstream_network: bool) -> Self {
        Self {
            auth,
            webui,
            prompt_cache: Arc::new(RwLock::new(HashMap::with_capacity(256))),
            cache_hits: Arc::new(AtomicU64::new(0)),
            total_requests: Arc::new(AtomicU64::new(0)),
            allow_upstream_network,
        }
    }
}

pub fn build_router(state: GatewayState) -> Router {
    Router::new()
        // Open-WebUI native workspace
        .route("/", get(handle_webui_index))
        .route("/chat", get(handle_webui_index))
        .route(
            "/api/webui/conversations",
            get(handle_webui_list_convs).post(handle_webui_create_conv),
        )
        .route(
            "/api/webui/conversations/{id}",
            get(handle_webui_get_messages),
        )
        .route(
            "/api/webui/conversations/{id}/messages",
            post(handle_webui_append_message),
        )
        .route("/api/webui/prompts", get(handle_webui_prompts))
        // OpenAI / TensorZero Gateway endpoints
        .route("/health", get(handle_health))
        .route("/v1/models", get(handle_models))
        .route("/v1/chat/completions", post(handle_chat_completions))
        .route("/v1/responses", post(handle_responses_api))
        .route("/v1/embeddings", post(handle_embeddings))
        // Better-Auth REST-compatible endpoints
        .route("/api/auth/sign-up/email", post(handle_auth_signup))
        .route("/api/auth/sign-in/email", post(handle_auth_signin))
        .route("/api/auth/get-session", get(handle_auth_get_session))
        .route("/api/auth/sign-out", post(handle_auth_signout))
        .route(
            "/api/auth/oauth2/authorize",
            post(handle_auth_oauth_authorize),
        )
        .route("/api/auth/oauth2/token", post(handle_auth_oauth_token))
        .route("/api/auth/jwks", get(handle_auth_jwks))
        .route("/api/auth/api-key/create", post(handle_auth_apikey_create))
        .route(
            "/api/auth/passkey/challenge",
            post(handle_auth_passkey_challenge),
        )
        // shadcn_rs component registry endpoints
        .route("/api/ui/components", get(handle_ui_components))
        .route("/api/ui/components/{slug}", get(handle_ui_render_component))
        .with_state(state)
}

pub async fn serve_http(bind_addr: &str, state: GatewayState) -> Result<(), String> {
    let listener = tokio::net::TcpListener::bind(bind_addr)
        .await
        .map_err(|e| format!("failed to bind {bind_addr}: {e}"))?;
    let app = build_router(state);
    axum::serve(listener, app)
        .await
        .map_err(|e| format!("gateway server error: {e}"))
}

async fn handle_webui_index() -> Html<String> {
    Html(render_workspace_html())
}

async fn handle_webui_prompts() -> Json<Value> {
    Json(json!({ "prompts": PROMPT_LIBRARY }))
}

async fn handle_webui_list_convs(State(st): State<GatewayState>) -> Response {
    match st.webui.list_conversations() {
        Ok(list) => Json(list).into_response(),
        Err(e) => json_err(StatusCode::INTERNAL_SERVER_ERROR, &e),
    }
}

async fn handle_webui_create_conv(
    State(st): State<GatewayState>,
    Json(req): Json<CreateConversationRequest>,
) -> Response {
    match st
        .webui
        .create_conversation(&req.title, req.model.as_deref())
    {
        Ok(conv) => (StatusCode::CREATED, Json(conv)).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, &e),
    }
}

async fn handle_webui_get_messages(
    State(st): State<GatewayState>,
    AxumPath(id): AxumPath<String>,
) -> Response {
    match st.webui.list_messages(&id) {
        Ok(msgs) => Json(msgs).into_response(),
        Err(e) => json_err(StatusCode::INTERNAL_SERVER_ERROR, &e),
    }
}

async fn handle_webui_append_message(
    State(st): State<GatewayState>,
    AxumPath(id): AxumPath<String>,
    Json(req): Json<AppendMessageRequest>,
) -> Response {
    let model = req.model.as_deref().unwrap_or("sovereign/ring3-local");
    match st.webui.append_message(&id, &req.role, &req.content, model) {
        Ok(msg) => (StatusCode::CREATED, Json(msg)).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, &e),
    }
}

async fn handle_health(State(st): State<GatewayState>) -> Json<Value> {
    let cached_entries = st.prompt_cache.read().map(|c| c.len()).unwrap_or(0);
    Json(json!({
        "status": "ok",
        "stack": "rust-stack",
        "edition": "2024",
        "abi_version": 1,
        "total_requests": st.total_requests.load(Ordering::Relaxed),
        "blake3_cache_hits": st.cache_hits.load(Ordering::Relaxed),
        "blake3_cache_entries": cached_entries,
        "providers": SOVEREIGN_PROVIDERS.iter().map(|p| p.id).collect::<Vec<_>>(),
    }))
}

async fn handle_models() -> Json<Value> {
    let created = 1_762_000_000u64;
    Json(json!({
        "object": "list",
        "data": [
            { "id": "sovereign/ring3-local", "object": "model", "created": created, "owned_by": "ring3-agent:8787" },
            { "id": "sovereign/ai-os", "object": "model", "created": created, "owned_by": "ai-os:4318" },
            { "id": "sovereign/triad", "object": "model", "created": created, "owned_by": "triad:4319" },
            { "id": "ollama/qwen2.5-coder:7b", "object": "model", "created": created, "owned_by": "ollama:11434" },
            { "id": "anthropic/claude-sonnet-4-5", "object": "model", "created": created, "owned_by": "anthropic" },
            { "id": "gemini/gemini-2.5-pro", "object": "model", "created": created, "owned_by": "google" },
            { "id": "openai/gpt-4.1", "object": "model", "created": created, "owned_by": "openai" },
            { "id": "sovereign/blake3-embed-256", "object": "model", "created": created, "owned_by": "rust-stack-simd" }
        ]
    }))
}

async fn handle_chat_completions(
    State(st): State<GatewayState>,
    Json(req): Json<ChatCompletionRequest>,
) -> Response {
    st.total_requests.fetch_add(1, Ordering::Relaxed);
    let cache_key = compute_prompt_blake3(&req);

    let resolved = if let Some(hit) = st
        .prompt_cache
        .read()
        .ok()
        .and_then(|g| g.get(&cache_key).cloned())
    {
        st.cache_hits.fetch_add(1, Ordering::Relaxed);
        (hit.content, hit.provider, true)
    } else {
        let (text, provider) = route_completion(&st, &req).await;
        if let Ok(mut guard) = st.prompt_cache.write() {
            if guard.len() >= 1024 {
                guard.clear();
            }
            guard.insert(
                cache_key.clone(),
                CachedCompletion {
                    content: text.clone(),
                    provider: provider.clone(),
                    digest: cache_key.clone(),
                },
            );
        }
        (text, provider, false)
    };

    let (content, provider, cache_hit) = resolved;
    let completion_id = format!("chatcmpl_{}", &cache_key[..16]);
    let now = unix_now();

    if req.stream {
        let sse_payload = build_sse_stream(&completion_id, &req.model, &content, now);
        let mut resp = Response::new(Body::from(sse_payload));
        let headers = resp.headers_mut();
        headers.insert(
            header::CONTENT_TYPE,
            HeaderValue::from_static("text/event-stream; charset=utf-8"),
        );
        headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-cache"));
        headers.insert(
            "x-rust-stack-blake3",
            HeaderValue::from_str(&cache_key).unwrap_or_else(|_| HeaderValue::from_static("ok")),
        );
        headers.insert(
            "x-rust-stack-cache",
            HeaderValue::from_static(if cache_hit { "HIT" } else { "MISS" }),
        );
        headers.insert(
            "x-rust-stack-provider",
            HeaderValue::from_str(&provider).unwrap_or_else(|_| HeaderValue::from_static("local")),
        );
        return resp;
    }

    let prompt_tokens = estimate_tokens(
        &req.messages
            .iter()
            .map(|m| m.content.as_str())
            .collect::<Vec<_>>()
            .join(" "),
    );
    let completion_tokens = estimate_tokens(&content);

    let mut resp = Json(json!({
        "id": completion_id,
        "object": "chat.completion",
        "created": now,
        "model": req.model,
        "system_fingerprint": format!("b3_{}", &cache_key[..12]),
        "provider": provider,
        "cache_hit": cache_hit,
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": content
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens
        }
    }))
    .into_response();

    resp.headers_mut().insert(
        "x-rust-stack-cache",
        HeaderValue::from_static(if cache_hit { "HIT" } else { "MISS" }),
    );
    resp
}

async fn handle_responses_api(
    State(st): State<GatewayState>,
    Json(req): Json<ResponsesApiRequest>,
) -> Response {
    let prompt_text = match &req.input {
        Value::String(s) => s.clone(),
        other => other.to_string(),
    };
    let chat_req = ChatCompletionRequest {
        model: req.model.clone(),
        messages: vec![ChatMessage {
            role: "user".to_string(),
            content: prompt_text,
        }],
        stream: false,
        temperature: None,
        max_tokens: None,
    };
    let digest = compute_prompt_blake3(&chat_req);
    let (content, provider) = route_completion(&st, &chat_req).await;
    let now = unix_now();

    if req.stream {
        let sse = format!(
            "event: response.output_text.delta\ndata: {}\n\nevent: response.completed\ndata: {}\n\n",
            json!({ "delta": content }),
            json!({ "id": format!("resp_{}", &digest[..16]), "status": "completed" })
        );
        let mut r = Response::new(Body::from(sse));
        r.headers_mut().insert(
            header::CONTENT_TYPE,
            HeaderValue::from_static("text/event-stream"),
        );
        return r;
    }

    Json(json!({
        "id": format!("resp_{}", &digest[..16]),
        "object": "response",
        "created_at": now,
        "model": req.model,
        "provider": provider,
        "status": "completed",
        "output": [{
            "type": "message",
            "role": "assistant",
            "content": [{ "type": "output_text", "text": content }]
        }]
    }))
    .into_response()
}

async fn handle_embeddings(Json(req): Json<EmbeddingRequest>) -> Json<Value> {
    let dims = req.dimensions.unwrap_or(256).clamp(16, 1536);
    let inputs = match req.input {
        EmbeddingInput::Single(s) => vec![s],
        EmbeddingInput::Batch(v) => v,
    };
    let mut data = Vec::with_capacity(inputs.len());
    let mut total_tokens = 0usize;
    for (idx, text) in inputs.iter().enumerate() {
        total_tokens += estimate_tokens(text);
        let vec = deterministic_simd_embedding(text, dims);
        data.push(json!({
            "object": "embedding",
            "index": idx,
            "embedding": vec
        }));
    }
    Json(json!({
        "object": "list",
        "model": req.model,
        "data": data,
        "usage": {
            "prompt_tokens": total_tokens,
            "total_tokens": total_tokens
        }
    }))
}

// --- Better-Auth Compatible Handlers ---

async fn handle_auth_signup(
    State(st): State<GatewayState>,
    headers: HeaderMap,
    Json(req): Json<SignUpEmailRequest>,
) -> Response {
    let ua = header_str(&headers, header::USER_AGENT);
    match st.auth.sign_up_email(req, Some("127.0.0.1".into()), ua) {
        Ok(env) => session_response_with_cookie(StatusCode::CREATED, env),
        Err(e) => json_err(StatusCode::BAD_REQUEST, &e),
    }
}

async fn handle_auth_signin(
    State(st): State<GatewayState>,
    headers: HeaderMap,
    Json(req): Json<SignInEmailRequest>,
) -> Response {
    let ua = header_str(&headers, header::USER_AGENT);
    match st.auth.sign_in_email(req, Some("127.0.0.1".into()), ua) {
        Ok(env) => session_response_with_cookie(StatusCode::OK, env),
        Err(e) => json_err(StatusCode::UNAUTHORIZED, &e),
    }
}

async fn handle_auth_get_session(State(st): State<GatewayState>, headers: HeaderMap) -> Response {
    let Some(token) = extract_session_token(&headers) else {
        return Json(json!({ "session": null, "user": null })).into_response();
    };
    match st.auth.get_session(&token) {
        Ok(Some(env)) => Json(env).into_response(),
        Ok(None) => Json(json!({ "session": null, "user": null })).into_response(),
        Err(e) => json_err(StatusCode::INTERNAL_SERVER_ERROR, &e),
    }
}

async fn handle_auth_signout(
    State(st): State<GatewayState>,
    headers: HeaderMap,
    body: Option<Json<Value>>,
) -> Response {
    let token = extract_session_token(&headers)
        .or_else(|| body.and_then(|b| b.get("token").and_then(Value::as_str).map(str::to_string)));
    let Some(tok) = token else {
        return Json(json!({ "success": false })).into_response();
    };
    match st.auth.sign_out(&tok) {
        Ok(removed) => {
            let mut resp = Json(json!({ "success": removed })).into_response();
            resp.headers_mut().insert(
                header::SET_COOKIE,
                HeaderValue::from_static(
                    "better-auth.session_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
                ),
            );
            resp
        }
        Err(e) => json_err(StatusCode::INTERNAL_SERVER_ERROR, &e),
    }
}

async fn handle_auth_oauth_authorize(
    State(st): State<GatewayState>,
    Json(req): Json<OAuthAuthorizeRequest>,
) -> Response {
    match st.auth.oauth2_authorize(req) {
        Ok(res) => Json(res).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, &e),
    }
}

async fn handle_auth_oauth_token(
    State(st): State<GatewayState>,
    Json(req): Json<OAuthTokenRequest>,
) -> Response {
    match st.auth.oauth2_token(req) {
        Ok(res) => Json(res).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, &e),
    }
}

async fn handle_auth_jwks(State(st): State<GatewayState>) -> Json<crate::auth::JwksDocument> {
    Json(st.auth.jwks())
}

async fn handle_auth_apikey_create(
    State(st): State<GatewayState>,
    Json(req): Json<ApiKeyCreateRequest>,
) -> Response {
    match st.auth.create_api_key(req) {
        Ok(issued) => (StatusCode::CREATED, Json(issued)).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, &e),
    }
}

async fn handle_auth_passkey_challenge(
    State(st): State<GatewayState>,
    Json(req): Json<PasskeyChallengeRequest>,
) -> Response {
    match st.auth.generate_passkey_challenge(req) {
        Ok(ch) => Json(ch).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, &e),
    }
}

// --- shadcn_rs Registry Handlers ---

#[derive(Deserialize)]
struct UiQuery {
    target: Option<String>,
}

async fn handle_ui_components() -> Json<Value> {
    Json(json!({
        "registry": "shadcn_rs",
        "theme": "aphrody-oklch-m3-fluent2",
        "targets": ["html", "dioxus", "gpui"],
        "components": REGISTRY_COMPONENTS
    }))
}

async fn handle_ui_render_component(
    AxumPath(slug): AxumPath<String>,
    Query(q): Query<UiQuery>,
) -> Response {
    let target_str = q.target.as_deref().unwrap_or("html");
    let target = match RenderTarget::parse(target_str) {
        Ok(t) => t,
        Err(e) => return json_err(StatusCode::BAD_REQUEST, &e),
    };
    match default_primitive_for_slug(&slug) {
        Ok(prim) => Json(json!({
            "slug": slug,
            "target": target_str,
            "code": prim.render(target)
        }))
        .into_response(),
        Err(e) => json_err(StatusCode::NOT_FOUND, &e),
    }
}

// --- Provider Routing + SIMD Embeddings + Helpers ---

async fn route_completion(st: &GatewayState, req: &ChatCompletionRequest) -> (String, String) {
    if st.allow_upstream_network {
        let model_clone = req.model.clone();
        let msgs_clone = req.messages.clone();
        let temp = req.temperature;
        let max_tok = req.max_tokens;
        if let Ok(Some((text, provider))) = tokio::task::spawn_blocking(move || {
            try_upstream_failover(&model_clone, &msgs_clone, temp, max_tok)
        })
        .await
        {
            return (text, provider);
        }
    }

    let last_user = req
        .messages
        .iter()
        .rev()
        .find(|m| m.role == "user")
        .map(|m| m.content.as_str())
        .unwrap_or("ping");
    let digest = blake3::hash(last_user.as_bytes()).to_hex();
    let reply = format!(
        "[rust-stack deterministic local engine | model={} | blake3={}] Processed {} message(s): {}",
        req.model,
        &digest[..12],
        req.messages.len(),
        last_user.chars().take(240).collect::<String>()
    );
    (reply, "rust-stack-deterministic-local".to_string())
}

fn try_upstream_failover(
    model: &str,
    messages: &[ChatMessage],
    temperature: Option<f32>,
    max_tokens: Option<u32>,
) -> Option<(String, String)> {
    // Prioritize matching provider first, then local sovereign mesh failover (:8787 -> :4318 -> :4319 -> :11434)
    let mut ordered: Vec<&ProviderEndpoint> = Vec::with_capacity(SOVEREIGN_PROVIDERS.len());
    for p in SOVEREIGN_PROVIDERS {
        if model.starts_with(p.id)
            || (p.id == "ring3-agent" && model.contains("ring3"))
            || (p.id == "ai-os" && model.contains("ai-os"))
            || (p.id == "triad" && model.contains("triad"))
        {
            ordered.push(p);
        }
    }
    for p in SOVEREIGN_PROVIDERS {
        if !ordered.iter().any(|x| x.id == p.id) {
            ordered.push(p);
        }
    }

    for provider in ordered {
        let bearer = if let Some(env_name) = provider.requires_env_key {
            match std::env::var(env_name) {
                Ok(val) if !val.trim().is_empty() => Some(val),
                _ => continue, // Skip cloud provider cleanly if key not configured in environment
            }
        } else {
            None
        };

        if provider.kind == "anthropic" {
            let Some(api_key) = bearer else { continue };
            let url = format!("{}/v1/messages", provider.base_url);
            let payload = json!({
                "model": model.strip_prefix("anthropic/").unwrap_or("claude-sonnet-4-5"),
                "max_tokens": max_tokens.unwrap_or(512),
                "messages": messages,
            });
            if let Ok(resp) = ureq::post(&url)
                .config()
                .timeout_global(Some(Duration::from_millis(900)))
                .build()
                .header("x-api-key", &api_key)
                .header("anthropic-version", "2023-06-01")
                .send_json(payload)
                && let Ok(v) = resp.into_body().read_json::<Value>()
                && let Some(txt) = v.pointer("/content/0/text").and_then(Value::as_str)
            {
                return Some((txt.to_string(), provider.id.to_string()));
            }
            continue;
        }

        let url = format!("{}/v1/chat/completions", provider.base_url);
        let upstream_model = model.split_once('/').map(|(_, m)| m).unwrap_or(model);
        let mut payload = json!({
            "model": upstream_model,
            "messages": messages,
            "stream": false
        });
        if let Some(t) = temperature {
            payload["temperature"] = json!(t);
        }
        if let Some(m) = max_tokens {
            payload["max_tokens"] = json!(m);
        }

        let mut req_builder = ureq::post(&url)
            .config()
            .timeout_global(Some(Duration::from_millis(350)))
            .build();
        if let Some(key) = bearer {
            req_builder = req_builder.header("Authorization", &format!("Bearer {key}"));
        }
        if let Ok(resp) = req_builder.send_json(payload)
            && let Ok(v) = resp.into_body().read_json::<Value>()
            && let Some(txt) = v
                .pointer("/choices/0/message/content")
                .and_then(Value::as_str)
        {
            return Some((txt.to_string(), provider.id.to_string()));
        }
    }
    None
}

pub fn compute_prompt_blake3(req: &ChatCompletionRequest) -> String {
    let mut hasher = blake3::Hasher::new();
    hasher.update(req.model.as_bytes());
    hasher.update(&[0x1f]);
    for m in &req.messages {
        hasher.update(m.role.as_bytes());
        hasher.update(&[0x1e]);
        hasher.update(m.content.as_bytes());
        hasher.update(&[0x1d]);
    }
    hasher.finalize().to_hex().to_string()
}

pub fn deterministic_simd_embedding(text: &str, dims: usize) -> Vec<f32> {
    let mut raw = vec![0.0f32; dims];
    let mut xof = blake3::Hasher::new();
    xof.update(b"rust-stack-embed-v1:");
    xof.update(text.as_bytes());
    let mut reader = xof.finalize_xof();
    let mut bytes = vec![0u8; dims * 4];
    reader.fill(&mut bytes);

    // 4-wide unrolled loop friendly to LLVM auto-vectorization (AVX2 / NEON)
    let mut norm_sq = 0.0f32;
    for (i, chunk) in bytes.chunks_exact(4).enumerate() {
        let u = u32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]);
        let centered = ((u as f64 / u32::MAX as f64) * 2.0 - 1.0) as f32;
        raw[i] = centered;
        norm_sq += centered * centered;
    }

    let inv_norm = if norm_sq > 0.0 {
        1.0 / norm_sq.sqrt()
    } else {
        1.0
    };
    for v in &mut raw {
        *v *= inv_norm;
    }
    raw
}

fn build_sse_stream(id: &str, model: &str, content: &str, created: u64) -> String {
    let mut out = String::with_capacity(content.len() * 3 + 256);
    let first_chunk = json!({
        "id": id,
        "object": "chat.completion.chunk",
        "created": created,
        "model": model,
        "choices": [{ "index": 0, "delta": { "role": "assistant" }, "finish_reason": null }]
    });
    out.push_str("data: ");
    out.push_str(&first_chunk.to_string());
    out.push_str("\n\n");

    for word in content.split_inclusive(' ') {
        let chunk = json!({
            "id": id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": model,
            "choices": [{ "index": 0, "delta": { "content": word }, "finish_reason": null }]
        });
        out.push_str("data: ");
        out.push_str(&chunk.to_string());
        out.push_str("\n\n");
    }

    let stop_chunk = json!({
        "id": id,
        "object": "chat.completion.chunk",
        "created": created,
        "model": model,
        "choices": [{ "index": 0, "delta": {}, "finish_reason": "stop" }]
    });
    out.push_str("data: ");
    out.push_str(&stop_chunk.to_string());
    out.push_str("\n\ndata: [DONE]\n\n");
    out
}

fn estimate_tokens(s: &str) -> usize {
    (s.len() / 4).max(1)
}

fn session_response_with_cookie(
    status: StatusCode,
    env: crate::auth::AuthSessionEnvelope,
) -> Response {
    let cookie = format!(
        "better-auth.session_token={}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800",
        env.token
    );
    let mut resp = (status, Json(env)).into_response();
    if let Ok(hv) = HeaderValue::from_str(&cookie) {
        resp.headers_mut().insert(header::SET_COOKIE, hv);
    }
    resp
}

fn extract_session_token(headers: &HeaderMap) -> Option<String> {
    if let Some(authz) = header_str(headers, header::AUTHORIZATION) {
        if let Some(b) = authz.strip_prefix("Bearer ") {
            return Some(b.trim().to_string());
        }
    }
    if let Some(cookie_hdr) = header_str(headers, header::COOKIE) {
        for part in cookie_hdr.split(';') {
            let kv = part.trim();
            if let Some(val) = kv.strip_prefix("better-auth.session_token=")
                && !val.is_empty()
            {
                return Some(val.to_string());
            }
        }
    }
    None
}

fn header_str(headers: &HeaderMap, name: header::HeaderName) -> Option<String> {
    headers
        .get(name)
        .and_then(|v| v.to_str().ok())
        .map(str::to_string)
}

fn json_err(status: StatusCode, msg: &str) -> Response {
    (status, Json(json!({ "error": { "message": msg } }))).into_response()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn gateway_end_to_end_http_test() {
        let auth = AuthEngine::open_in_memory(b"gateway-test-hmac-secret-32bytes").unwrap();
        let webui = WebUiStore::open_in_memory().unwrap();
        let state = GatewayState::new(auth, webui, false);

        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let app = build_router(state);
        tokio::spawn(async move {
            let _ = axum::serve(listener, app).await;
        });

        let base = format!("http://{addr}");

        // 1. Health + Models
        let health: Value = tokio::task::spawn_blocking({
            let b = base.clone();
            move || {
                ureq::get(&format!("{b}/health"))
                    .call()
                    .unwrap()
                    .into_body()
                    .read_json()
                    .unwrap()
            }
        })
        .await
        .unwrap();
        assert_eq!(health["status"], "ok");

        // 2. Chat completions + Blake3 cache HIT on second call
        let (first_cache, second_cache) = tokio::task::spawn_blocking({
            let b = base.clone();
            move || {
                let payload = json!({
                    "model": "sovereign/ring3-local",
                    "messages": [{ "role": "user", "content": "Verify Blake3 cache" }]
                });
                let r1 = ureq::post(&format!("{b}/v1/chat/completions"))
                    .send_json(payload.clone())
                    .unwrap();
                let c1 = r1
                    .headers()
                    .get("x-rust-stack-cache")
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("")
                    .to_string();
                let r2 = ureq::post(&format!("{b}/v1/chat/completions"))
                    .send_json(payload)
                    .unwrap();
                let c2 = r2
                    .headers()
                    .get("x-rust-stack-cache")
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("")
                    .to_string();
                (c1, c2)
            }
        })
        .await
        .unwrap();
        assert_eq!(first_cache, "MISS");
        assert_eq!(second_cache, "HIT");

        // 3. Streaming SSE + Embeddings + Better-Auth SignUp + WebUI
        tokio::task::spawn_blocking(move || {
            let sse_resp = ureq::post(&format!("{base}/v1/chat/completions"))
                .send_json(json!({
                    "model": "sovereign/ring3-local",
                    "stream": true,
                    "messages": [{ "role": "user", "content": "Stream tokens" }]
                }))
                .unwrap();
            let sse_text = sse_resp.into_body().read_to_string().unwrap();
            assert!(sse_text.contains("data: [DONE]"));

            let emb: Value = ureq::post(&format!("{base}/v1/embeddings"))
                .send_json(json!({ "input": "SIMD normalized vector", "dimensions": 64 }))
                .unwrap()
                .into_body()
                .read_json()
                .unwrap();
            let vec = emb["data"][0]["embedding"].as_array().unwrap();
            assert_eq!(vec.len(), 64);
            let norm: f64 = vec
                .iter()
                .map(|x| x.as_f64().unwrap().powi(2))
                .sum::<f64>()
                .sqrt();
            assert!((norm - 1.0).abs() < 1e-4);

            let signup: Value = ureq::post(&format!("{base}/api/auth/sign-up/email"))
                .send_json(json!({
                    "email": "ada@sovereign.local",
                    "password": "ada-lovelace-rust-2024"
                }))
                .unwrap()
                .into_body()
                .read_json()
                .unwrap();
            let tok = signup["token"].as_str().unwrap();
            let sess: Value = ureq::get(&format!("{base}/api/auth/get-session"))
                .header("Authorization", &format!("Bearer {tok}"))
                .call()
                .unwrap()
                .into_body()
                .read_json()
                .unwrap();
            assert_eq!(sess["user"]["email"], "ada@sovereign.local");

            let html = ureq::get(&format!("{base}/"))
                .call()
                .unwrap()
                .into_body()
                .read_to_string()
                .unwrap();
            assert!(html.contains("rust-stack | Aphrody AI Workspace"));
        })
        .await
        .unwrap();
    }
}
