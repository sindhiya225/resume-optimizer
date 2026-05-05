export type SuggestionType =
  | "keyword"
  | "impact"
  | "project"
  | "format"
  | "summary";

export type Suggestion = {
  id: string;
  type: SuggestionType;
  title: string;
  rationale: string;
  before: string;
  after: string;
  keyword?: string;
  confidence: number;
};

export type ScoreBreakdown = {
  overall: number;
  keywordMatch: number;
  impact: number;
  formatting: number;
  projectRelevance: number;
};

export type AnalysisResult = {
  score: ScoreBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  weakProjects: string[];
  suggestions: Suggestion[];
};

export type ResumeProject = {
  name: string;
  tech: string;
  description: string;
  impact: string;
};

export type ResumeExperience = {
  role: string;
  company: string;
  duration: string;
  bullets: string;
};

export type ResumeBuilderData = {
  name: string;
  age: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  targetRole: string;
  summary: string;
  skills: string;
  projects: ResumeProject[];
  experience: ResumeExperience[];
  education: string;
  certifications: string;
};

export type AiInsight = {
  title: string;
  detail: string;
  priority: "High" | "Medium" | "Low";
};
