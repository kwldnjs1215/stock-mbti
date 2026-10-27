// POST /api/results : 이름 + 테스트 결과를 D1에 저장
const TYPE_RE = /^[AS][TL][DI][OF]$/;
const ANSWERS_RE = /^[AB]{20}$/;
const MAX_BODY = 2048;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function validate(body) {
  if (!body || typeof body !== "object") return null;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 1 || name.length > 12) return null;
  if (!TYPE_RE.test(body.type)) return null;
  const { scores } = body;
  if (!Array.isArray(scores) || scores.length !== 4) return null;
  if (!scores.every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return null;
  if (!ANSWERS_RE.test(body.answers)) return null;
  return { name, type: body.type, scores: JSON.stringify(scores), answers: body.answers };
}

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const row = validate(body);
  if (!row) return json({ error: "invalid_result" }, 400);

  await env.DB.prepare("INSERT INTO results (name, type, scores, answers) VALUES (?, ?, ?, ?)")
    .bind(row.name, row.type, row.scores, row.answers)
    .run();

  return json({ ok: true }, 201);
}
