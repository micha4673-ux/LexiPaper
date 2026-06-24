const {
  readBody,
  requireSupabase,
  requireToken,
  sendJson,
  upsertEntries,
} = require("../_supabase");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-LexiPaper-Token");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  if (!requireToken(req, res) || !requireSupabase(res)) return;

  try {
    const body = await readBody(req);
    const saved = await upsertEntries([
      {
        ...body,
        rawPayload: {
          source: "chatgpt_action",
          receivedAt: new Date().toISOString(),
          original: body,
        },
      },
    ]);

    sendJson(res, 200, {
      ok: true,
      entry: saved[0] || null,
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Unexpected server error." });
  }
};
