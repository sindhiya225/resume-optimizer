import { AnalysisResult, ScoreBreakdown, Suggestion } from "../types";

const STOP_WORDS = new Set([
  "and",
  "are",
  "for",
  "the",
  "with",
  "using",
  "who",
  "can",
  "this",
  "that",
  "role",
  "into",
  "from",
  "will",
  "you",
  "our",
  "intern",
  "internship",
  "software",
  "engineering",
  "about",
  "looking",
  "directly",
  "hands",
  "hands-on",
  "driven",
  "contribute",
  "building",
  "block",
  "team",
  "teams",
  "work",
  "works",
  "this",
  "is",
  "to",
  "of",
  "a",
  "an",
  "in",
  "on",
  "by",
  "as",
  "at",
  "be",
  "we",
  "they",
  "their",
  "candidate",
  "ideal",
  "preferred",
  "required",
  "responsibilities",
  "requirements",
]);

const PRIORITY_TERMS = [
  "ai",
  "artificial intelligence",
  "machine learning",
  "product development",
  "ai product development",
  "technology execution",
  "entrepreneurial mindset",
  "ownership",
  "gtm",
  "go to market",
  "hyper-scaler",
  "hyperscaler",
  "founding team",
  "startup",
  "react",
  "typescript",
  "javascript",
  "api",
  "rest",
  "state management",
  "responsive",
  "accessibility",
  "testing",
  "debugging",
  "git",
  "dashboard",
  "component",
  "collaboration",
];

const ACTION_VERBS = [
  "built",
  "developed",
  "implemented",
  "optimized",
  "integrated",
  "automated",
  "improved",
  "designed",
  "delivered",
  "reduced",
  "increased",
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");

const normalizeTerm = (value: string) => normalize(value).replace(/\s+/g, " ").trim();

const containsTerm = (text: string, term: string) => normalizeTerm(text).includes(normalizeTerm(term));

const unique = (items: string[]) => Array.from(new Set(items));

const extractTerms = (jobDescription: string) => {
  const normalizedJob = normalize(jobDescription);
  const directTerms = PRIORITY_TERMS.filter((term) => normalizedJob.includes(term));
  const wordTerms = normalizedJob
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 4 && !STOP_WORDS.has(word))
    .filter((word) => !/^\d+$/.test(word))
    .filter((word) => !word.includes("www"))
    .filter((word) => !word.includes("@"));

  return unique([...directTerms, ...wordTerms]).slice(0, 18);
};

const extractProjects = (resume: string) => {
  const projectSection = resume.split(/projects/i)[1]?.split(/\n[A-Z][A-Z\s]+\n/)[0] ?? "";
  return projectSection
    .split(/\n(?=[A-Z][^\n]+$)/gm)
    .map((block) => block.trim())
    .filter((block) => block.length > 20);
};

const replaceOnce = (content: string, before: string, after: string) => {
  if (!before) return `${content.trim()}\n\n${after.trim()}`.trim();
  return content.includes(before) ? content.replace(before, after) : content;
};

export const applySuggestion = (resume: string, suggestion: Suggestion) =>
  replaceOnce(resume, suggestion.before, suggestion.after);

export const analyzeResume = (resume: string, jobDescription: string): AnalysisResult => {
  const terms = extractTerms(jobDescription);
  const matchedKeywords = terms.filter((term) => containsTerm(resume, term));
  const missingKeywords = terms.filter((term) => !containsTerm(resume, term)).slice(0, 10);
  const resumeLines = resume.split("\n").map((line) => line.trim()).filter(Boolean);
  const bullets = resumeLines.filter((line) => line.startsWith("-"));
  const quantifiedBullets = bullets.filter((line) => /\d+|%|users|reports|hours|pages|components/i.test(line));
  const actionBullets = bullets.filter((line) => ACTION_VERBS.some((verb) => containsTerm(line, verb)));
  const projects = extractProjects(resume);
  const weakProjects = projects
    .filter((project) => matchedKeywords.filter((term) => containsTerm(project, term)).length < 2)
    .map((project) => project.split("\n")[0])
    .slice(0, 3);

  const suggestions: Suggestion[] = [];
  const summaryLine = resumeLines.find((line) => /student|developer|engineer/i.test(line) && line.length > 55);

  if (summaryLine && missingKeywords.length > 0) {
    suggestions.push({
      id: "summary-keywords",
      type: "summary",
      title: "Align the summary with the target role",
      rationale: `Adds high-value job terms such as ${missingKeywords.slice(0, 3).join(", ")} without changing your core profile.`,
      before: summaryLine,
      after: `${summaryLine.replace(/\.$/, "")}, with hands-on exposure to ${missingKeywords.slice(0, 3).join(", ")}.`,
      confidence: 0.88,
    });
  }

  missingKeywords.slice(0, 5).forEach((keyword, index) => {
    const skillsLine = resumeLines.find((line) => /^HTML|^Skills|React|JavaScript/i.test(line));
    if (skillsLine && !containsTerm(skillsLine, keyword)) {
      suggestions.push({
        id: `keyword-${index}`,
        type: "keyword",
        title: `Add "${keyword}" to the skills section`,
        rationale: "ATS systems heavily weight exact skill matches when ranking resumes against a job description.",
        before: skillsLine,
        after: `${skillsLine}, ${keyword}`,
        keyword,
        confidence: 0.82,
      });
    }
  });

  bullets
    .filter((line) => !/\d+|%/.test(line))
    .slice(0, 3)
    .forEach((line, index) => {
      suggestions.push({
        id: `impact-${index}`,
        type: "impact",
        title: "Make this bullet more outcome-focused",
        rationale: "Stronger bullets show action, technology, and measurable result in one sentence.",
        before: line,
        after: line
          .replace("Built", "Developed")
          .replace("Created", "Designed and shipped")
          .replace(/\.$/, "") + " for 25+ test users while improving workflow clarity.",
        confidence: 0.76,
      });
    });

  weakProjects.forEach((project, index) => {
    const projectBlock = projects.find((item) => item.startsWith(project));
    if (projectBlock) {
      suggestions.push({
        id: `project-${index}`,
        type: "project",
        title: `Consider removing or replacing "${project}"`,
        rationale: "This project has low keyword overlap with the job description, so it may take space from more relevant evidence.",
        before: projectBlock,
        after: `${projectBlock}\n- Reframe or replace this with a React/TypeScript/API project that better matches the role.`,
        confidence: 0.7,
      });
    }
  });

  if (!/github\.com|portfolio|linkedin\.com/i.test(resume)) {
    suggestions.push({
      id: "format-links",
      type: "format",
      title: "Add portfolio or GitHub visibility",
      rationale: "Recruiters and technical reviewers often verify project quality through live links or source code.",
      before: resumeLines[0],
      after: `${resumeLines[0]}\nPortfolio: your-portfolio-link | GitHub: github.com/yourusername`,
      confidence: 0.73,
    });
  }

  const score: ScoreBreakdown = {
    keywordMatch: Math.round((matchedKeywords.length / Math.max(terms.length, 1)) * 100),
    impact: Math.round(((quantifiedBullets.length + actionBullets.length) / Math.max(bullets.length * 2, 1)) * 100),
    formatting: Math.min(100, 55 + (resume.includes("SKILLS") ? 15 : 0) + (resume.includes("PROJECTS") ? 15 : 0) + (resume.includes("EXPERIENCE") ? 15 : 0)),
    projectRelevance: Math.round(((projects.length - weakProjects.length) / Math.max(projects.length, 1)) * 100),
    overall: 0,
  };
  score.overall = Math.round(score.keywordMatch * 0.4 + score.impact * 0.25 + score.formatting * 0.2 + score.projectRelevance * 0.15);

  return {
    score,
    matchedKeywords,
    missingKeywords,
    weakProjects,
    suggestions,
  };
};
