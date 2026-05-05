import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const loadEnv = async () => {
  const envPath = path.join(rootDir, ".env");
  if (!existsSync(envPath)) return;
  const lines = (await readFile(envPath, "utf8")).split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator === -1) return;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = value;
  });
};

await loadEnv();

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

const topKeywords = (jobDescription) =>
  Array.from(
    new Set(
      jobDescription
        .toLowerCase()
        .replace(/[^a-z0-9+#.\s-]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 4)
        .filter((word) => !["about", "looking", "directly", "intern", "across", "block", "hands"].includes(word)),
    ),
  ).slice(0, 8);

const fallbackSuggestion = (resume, jobDescription, mode, profile = {}) => {
  const keywords = topKeywords(jobDescription);
  const baseResume = mode === "build" ? [
    profile.name,
    profile.targetRole,
    [profile.email, profile.phone, profile.location, profile.linkedin, profile.github].filter(Boolean).join(" | "),
    "SUMMARY",
    profile.summary || `Aspiring ${profile.targetRole || "technology"} professional with interest in ${keywords.slice(0, 4).join(", ")}.`,
    "SKILLS",
    profile.skills || keywords.join(", "),
    "PROJECTS",
    ...(profile.projects || []).flatMap((project) => project.name ? [
      `${project.name} | ${project.tech || "Relevant technologies"}`,
      `- ${project.description || "Built a role-relevant technical project."}`,
      `- ${project.impact || "Focused on practical execution and measurable learning outcomes."}`,
    ] : []),
    "EDUCATION",
    profile.education || "",
    "CERTIFICATIONS",
    profile.certifications || "",
  ].filter(Boolean).join("\n") : resume;

  return {
  aiProvider: "Local fallback",
  resume: baseResume,
  suggestions: [
    {
      id: "fallback-summary",
      type: "summary",
      title: "Use targeted role keywords",
      rationale: "Gemini is not configured, so this local fallback only gives a safe keyword recommendation instead of rewriting personal details.",
      before: "",
      after: `Include relevant terms naturally where truthful: ${keywords.join(", ")}.`,
      confidence: 0.62,
    },
  ],
  };
};

const validateAiResult = (result, mode, originalResume) => {
  if (!result || typeof result !== "object") throw new Error("AI response was not an object.");
  if (typeof result.resume !== "string") result.resume = mode === "optimize" ? originalResume || "" : "";
  if (!Array.isArray(result.suggestions)) result.suggestions = [];

  result.suggestions = result.suggestions
    .filter((suggestion) => suggestion && typeof suggestion === "object")
    .map((suggestion, index) => ({
      id: String(suggestion.id || `ai-${index}`),
      type: ["keyword", "impact", "project", "format", "summary"].includes(suggestion.type) ? suggestion.type : "summary",
      title: String(suggestion.title || "AI suggestion"),
      rationale: String(suggestion.rationale || "Suggested by AI to improve role alignment."),
      before: String(suggestion.before || ""),
      after: String(suggestion.after || ""),
      confidence: Number.isFinite(Number(suggestion.confidence)) ? Number(suggestion.confidence) : 0.75,
    }))
    .filter((suggestion) => suggestion.after.trim());

  return result;
};

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

const buildPrompt = (payload) => `You are a senior technical recruiter and ATS resume writer.
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
- Never append raw job-description sentences to contact links, names, emails, phone numbers, addresses, LinkedIn, or GitHub lines.
- Do not copy the job description verbatim into the resume.
- Convert job description themes into truthful resume keywords, skills, and bullets.
- Use concise ATS-readable sections: SUMMARY, SKILLS, PROJECTS, EXPERIENCE, EDUCATION, CERTIFICATIONS.
- Keep wording truthful. If metrics are not provided, do not fabricate numbers.
- For optimize mode, return the original resume in "resume" and atomic one-by-one changes in "suggestions"; the frontend applies changes after user approval.
- For build mode, return a complete optimized resume in "resume" and suggestions explaining major choices.
- If a section is missing, suggest adding it instead of corrupting unrelated text.

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
      result = validateAiResult(result, payload.mode, payload.resume || "");
      result.aiProvider = `Google Gemini (${geminiModel})`;
    } catch (error) {
      if (process.env.GEMINI_API_KEY) throw error;
      result = fallbackSuggestion(payload.resume || "", payload.jobDescription || "", payload.mode, payload.profile || {});
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
