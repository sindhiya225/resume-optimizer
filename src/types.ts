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
