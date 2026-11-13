// src/index.ts
var index_default = {
  async email(message, env, ctx) {
    const id = `in_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const from = message.from || "unknown";
    const to = message.to || "unknown";
    const subject = message.headers?.get("subject") || "(No Subject)";
    const messageId = message.headers?.get("message-id") || id;
    const spfStatus = message.headers?.get("received-spf") || "unknown";
    const dkimStatus = message.headers?.get("dkim-signature") ? "signed" : "unsigned";
    if (env.DB) {
      try {
        await env.DB.prepare(
          "INSERT INTO inbound_emails (id, messageId, fromAddress, toAddress, subject, spfStatus, dkimStatus, rawHeaders, bodySnippet, receivedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          id,
          messageId,
          from,
          to,
          subject,
          spfStatus,
          dkimStatus,
          "",
          "",
          Date.now()
        ).run();
      } catch (err) {
        console.error("Failed to insert inbound email into D1:", err);
      }
    }
    const destination = env.FORWARD_DESTINATION || "contact@aphrody.com";
    try {
      await message.forward(destination);
    } catch (fwdErr) {
      console.error(`Failed to forward email to ${destination}:`, fwdErr);
    }
  },
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return Response.json({
        status: "healthy",
        worker: "aphrody-email-worker",
        edge: "cloudflare",
        d1_connected: !!env.DB,
        time: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    if (url.pathname === "/api/inbound/latest" && env.DB) {
      try {
        const rows = await env.DB.prepare(
          "SELECT * FROM inbound_emails ORDER BY receivedAt DESC LIMIT 20"
        ).all();
        return Response.json({ emails: rows.results });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
      }
    }
    return new Response("Aphrody Cloudflare Edge Email Worker (2026)", {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
