import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const port = Number(process.env.PORT || 8787);
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const json = (response, status, payload) => {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end(JSON.stringify(payload));
};

const readBody = (request) =>
  new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });

const extractJson = (text) => {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("AI response did not contain JSON.");
  return JSON.parse(clean.slice(start, end + 1));
};

const fallbackSuggestion = (resume, jobDescription) => ({
  aiProvider: "Local fallback",
  resume,
  suggestions: [
    {
      id: "fallback-summary",
      type: "summary",
      title: "Add job-specific keywords",
      rationale: "Gemini is not configured, so this local fallback suggests adding role keywords from the job description.",
      before: resume.split("\n").find((line) => line.length > 45) || resume.split("\n")[0] || "",
      after: `${resume.split("\n").find((line) => line.length > 45) || "Professional summary"} aligned with ${jobDescription.split(/\s+/).slice(0, 8).join(" ")}.`,
      confidence: 0.62,
    },
  ],
});

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.35,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response.");
  return extractJson(text);
};

const buildPrompt = (payload) => `You are an ATS resume expert.
Return strict JSON only.
Schema:
{
  "resume": "complete optimized resume text",
  "suggestions": [
    {
      "id": "short-id",
      "type": "keyword|impact|project|format|summary",
      "title": "short title",
      "rationale": "why this improves ATS fit",
      "before": "exact old text or empty for new resume",
      "after": "new text",
      "confidence": 0.0
    }
  ]
}
Rules:
- Do not invent fake companies, degrees, awards, or metrics.
- Improve wording, keyword alignment, project relevance, and ATS readability.
- Keep the resume truthful and concise.
- For optimize mode, suggestions must be atomic one-by-one changes.
- For build mode, create a complete resume from the provided fields and include suggestions explaining important choices.

Mode: ${payload.mode}
Job description:
${payload.jobDescription}

Existing resume:
${payload.resume || ""}

Structured profile:
${JSON.stringify(payload.profile || {}, null, 2)}`;

const handleAi = async (request, response) => {
  try {
    const payload = JSON.parse(await readBody(request));
    const prompt = buildPrompt(payload);
    let result;

    try {
      result = await callGemini(prompt);
      result.aiProvider = `Google Gemini (${geminiModel})`;
    } catch (error) {
      if (process.env.GEMINI_API_KEY) throw error;
      result = fallbackSuggestion(payload.resume || "", payload.jobDescription || "");
    }

    json(response, 200, result);
  } catch (error) {
    json(response, 500, { error: error instanceof Error ? error.message : "AI request failed." });
  }
};

const serveStatic = async (request, response) => {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  const requestedPath = requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname.slice(1);
  const filePath = path.join(distDir, requestedPath);
  const safePath = filePath.startsWith(distDir) && existsSync(filePath) ? filePath : path.join(distDir, "index.html");
  const content = await readFile(safePath);
  const ext = path.extname(safePath);
  const type = ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : "text/html";
  response.writeHead(200, { "Content-Type": type });
  response.end(content);
};

export const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return json(response, 204, {});
  if (request.url === "/api/health") return json(response, 200, { ok: true });
  if (request.url === "/api/ai/resume" && request.method === "POST") return handleAi(request, response);

  if (existsSync(distDir)) return serveStatic(request, response);
  json(response, 404, { error: "Build the frontend with npm run build, or run npm run dev:full for development." });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(port, "127.0.0.1", () => {
    console.log(`Resume Optimizer API running at http://127.0.0.1:${port}`);
  });
}
