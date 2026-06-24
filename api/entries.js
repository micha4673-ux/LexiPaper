const {
  deleteEntry,
  listEntries,
  readBody,
  requireSupabase,
  requireToken,
  sendJson,
  upsertEntries,
} = require("./_supabase");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-LexiPaper-Token");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (!requireToken(req, res) || !requireSupabase(res)) return;

  try {
    if (req.method === "GET") {
      const entries = await listEntries();
      sendJson(res, 200, { entries });
      return;
    }

    if (req.method === "POST" || req.method === "PUT") {
      const body = await readBody(req);
      const entries = Array.isArray(body.entries) ? body.entries : [body.entry || body];
      const saved = await upsertEntries(entries);
      sendJson(res, 200, {
        entries: saved,
        entry: saved[0] || null,
      });
      return;
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url, "https://lexipaper.local");
      const id = url.searchParams.get("id");
      if (!id) {
        sendJson(res, 400, { error: "Missing entry id." });
        return;
      }
      await deleteEntry(id);
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Unexpected server error." });
  }
};
