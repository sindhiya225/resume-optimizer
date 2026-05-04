import { AnalysisResult, AiInsight } from "../types";

export const createLocalAiInsights = (
  resume: string,
  jobDescription: string,
  analysis: AnalysisResult,
): AiInsight[] => {
  const insights: AiInsight[] = [];
  const hasMetrics = /\d+|%|users|reports|hours|reduced|increased/i.test(resume);
  const hasLinks = /github\.com|linkedin\.com|portfolio/i.test(resume);

  if (analysis.missingKeywords.length) {
    insights.push({
      title: "Add exact role keywords naturally",
      detail: `Prioritize ${analysis.missingKeywords.slice(0, 4).join(", ")} in Skills, Summary, and the most relevant project bullets.`,
      priority: "High",
    });
  }

  if (!hasMetrics) {
    insights.push({
      title: "Convert plain duties into measured outcomes",
      detail: "Add numbers such as users, pages, components, API calls, response time, or reports generated so bullets look evidence-based.",
      priority: "High",
    });
  }

  if (analysis.weakProjects.length) {
    insights.push({
      title: "Replace low-match project space",
      detail: `Review ${analysis.weakProjects.join(", ")} and replace one with a project closer to the job description.`,
      priority: "Medium",
    });
  }

  if (!hasLinks) {
    insights.push({
      title: "Make projects verifiable",
      detail: "Add GitHub, portfolio, or live demo links near the header or project names so reviewers can inspect your work.",
      priority: "Medium",
    });
  }

  if (/accessibility|testing|debugging/i.test(jobDescription) && !/accessibility|test|debug/i.test(resume)) {
    insights.push({
      title: "Show engineering maturity",
      detail: "Mention testing, debugging, accessibility, or code quality practices where they are honestly true.",
      priority: "Low",
    });
  }

  return insights;
};

export const aiIntegrationPlan = `Production AI integration:
1. Send resume, job description, and scoring result to a backend API route.
2. Keep the LLM API key only on the server.
3. Ask the model for structured JSON suggestions with id, title, rationale, before, after, and confidence.
4. Validate the JSON response before showing it to the user.
5. Keep the same approval queue so AI never edits the resume without permission.`;
