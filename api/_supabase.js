const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LEXIPAPER_API_TOKEN = process.env.LEXIPAPER_API_TOKEN;
const TABLE = "lexipaper_entries";
const { randomUUID } = require("crypto");

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function requireToken(req, res) {
  if (!LEXIPAPER_API_TOKEN) {
    sendJson(res, 500, {
      error: "LEXIPAPER_API_TOKEN is not configured.",
    });
    return false;
  }

  const headerToken = req.headers["x-lexipaper-token"];
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const token = Array.isArray(headerToken) ? headerToken[0] : headerToken || bearerToken;

  if (token !== LEXIPAPER_API_TOKEN) {
    sendJson(res, 401, { error: "Unauthorized" });
    return false;
  }

  return true;
}

function requireSupabase(res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    sendJson(res, 500, {
      error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.",
    });
    return false;
  }

  return true;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText;
    throw new Error(message);
  }

  return data;
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map(String).map((tag) => tag.trim()).filter(Boolean);
  }

  if (!tags) return [];

  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function clampImportance(value) {
  const numeric = Number(value || 3);
  if (!Number.isFinite(numeric)) return 3;
  return Math.min(5, Math.max(1, numeric));
}

function entryToRow(entry) {
  const now = new Date().toISOString();
  return {
    id: String(entry.id || randomUUID()),
    word: String(entry.word || "").trim(),
    part_of_speech: String(entry.partOfSpeech || entry.part_of_speech || ""),
    meaning: String(entry.meaning || ""),
    sentence: String(entry.sentence || ""),
    paper_title: String(entry.paperTitle || entry.paper_title || ""),
    page: String(entry.page || ""),
    source: String(entry.source || ""),
    tags: normalizeTags(entry.tags),
    note: String(entry.note || ""),
    importance: clampImportance(entry.importance),
    status: ["new", "review", "mastered"].includes(entry.status) ? entry.status : "new",
    starred: Boolean(entry.starred),
    created_at: entry.createdAt || entry.created_at || now,
    reviewed_at: entry.reviewedAt || entry.reviewed_at || null,
    updated_at: now,
    raw_payload: entry.rawPayload || entry.raw_payload || {},
  };
}

function rowToEntry(row) {
  return {
    id: row.id,
    word: row.word,
    partOfSpeech: row.part_of_speech || "",
    meaning: row.meaning || "",
    sentence: row.sentence || "",
    paperTitle: row.paper_title || "",
    page: row.page || "",
    source: row.source || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    note: row.note || "",
    importance: row.importance || 3,
    status: row.status || "new",
    starred: Boolean(row.starred),
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

async function listEntries() {
  const rows = await supabaseFetch(`${TABLE}?select=*&order=created_at.desc`);
  return rows.map(rowToEntry);
}

async function upsertEntries(entries) {
  const rows = entries.map(entryToRow).filter((row) => row.word);
  if (!rows.length) return [];

  const saved = await supabaseFetch(`${TABLE}?on_conflict=id`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });

  return saved.map(rowToEntry);
}

async function deleteEntry(id) {
  await supabaseFetch(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

module.exports = {
  deleteEntry,
  listEntries,
  readBody,
  requireSupabase,
  requireToken,
  sendJson,
  upsertEntries,
};
