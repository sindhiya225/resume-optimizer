import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bot,
  Download,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { analyzeResume, applySuggestion } from "./lib/analyzer";
import { exportDocx, exportPdf } from "./lib/exporters";
import { buildResumeFromData } from "./lib/resumeBuilder";
import { ResumeBuilderData, Suggestion } from "./types";

type Page = "welcome" | "build" | "optimize";

const emptyProfile: ResumeBuilderData = {
  name: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  targetRole: "",
  summary: "",
  skills: "",
  projects: [{ name: "", tech: "", description: "", impact: "" }],
  experience: [{ role: "", company: "", duration: "", bullets: "" }],
  education: "",
  certifications: "",
};

type AiResponse = {
  aiProvider?: string;
  resume: string;
  suggestions: Suggestion[];
  error?: string;
};

const readTextFile = (file: File, onLoad: (value: string) => void) => {
  const reader = new FileReader();
  reader.onload = () => onLoad(String(reader.result ?? ""));
  reader.readAsText(file);
};

const suggestionLabels: Record<Suggestion["type"], string> = {
  keyword: "Keyword",
  impact: "Impact",
  project: "Project",
  format: "Format",
  summary: "Summary",
};

function App() {
  const [page, setPage] = useState<Page>("welcome");
  const [profile, setProfile] = useState<ResumeBuilderData>(emptyProfile);
  const [jobDescription, setJobDescription] = useState("");
  const [currentResume, setCurrentResume] = useState("");
  const [originalResume, setOriginalResume] = useState("");
  const [optimizedResume, setOptimizedResume] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<Suggestion[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [aiProvider, setAiProvider] = useState("");

  const analysis = useMemo(
    () => analyzeResume(optimizedResume || currentResume, jobDescription),
    [currentResume, jobDescription, optimizedResume],
  );
  const pendingSuggestions = aiSuggestions.filter(
    (suggestion) => !appliedIds.includes(suggestion.id) && !skippedIds.includes(suggestion.id),
  );
  const activeSuggestion = pendingSuggestions[0];

  const resetResult = () => {
    setOptimizedResume("");
    setOriginalResume("");
    setAiSuggestions([]);
    setAppliedIds([]);
    setSkippedIds([]);
    setIsApproved(false);
    setMessage("");
    setAiProvider("");
  };

  const goHome = () => {
    setPage("welcome");
    setProfile(emptyProfile);
    setJobDescription("");
    setCurrentResume("");
    resetResult();
  };

  const updateProfile = <K extends keyof ResumeBuilderData>(key: K, value: ResumeBuilderData[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const callAi = async (mode: "build" | "optimize") => {
    setLoading(true);
    setMessage("");
    setIsApproved(false);

    try {
      const response = await fetch("/api/ai/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          profile,
          resume: mode === "build" ? buildResumeFromData(profile) : currentResume,
          jobDescription,
        }),
      });
      const data = (await response.json()) as AiResponse;
      if (!response.ok || data.error) throw new Error(data.error || "AI request failed.");

      const sourceResume = mode === "build" ? "" : currentResume;
      setOriginalResume(sourceResume);
      setOptimizedResume(mode === "build" ? data.resume || sourceResume : sourceResume);
      setAiSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setAppliedIds([]);
      setSkippedIds([]);
      setAiProvider(data.aiProvider || "AI");
      setMessage("AI generated the resume plan. Review each change before downloading.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong while calling AI.");
    } finally {
      setLoading(false);
    }
  };

  const applyCurrentSuggestion = () => {
    if (!activeSuggestion) return;
    setOptimizedResume((current) => applySuggestion(current, activeSuggestion));
    setAppliedIds((current) => [...current, activeSuggestion.id]);
    setIsApproved(false);
  };

  const skipCurrentSuggestion = () => {
    if (!activeSuggestion) return;
    setSkippedIds((current) => [...current, activeSuggestion.id]);
  };

  return (
    <main className="app-shell">
      <section className="workspace">
        {page === "welcome" && (
          <section className="welcome-page">
            <div>
              <p className="eyebrow">AI Resume Optimizer</p>
              <h1>Build a job-ready resume or improve the one you already have</h1>
            </div>
            <div className="choice-grid">
              <button className="choice-button" onClick={() => setPage("build")}>
                <Sparkles size={28} />
                <strong>Build Resume From Scratch</strong>
                <span>Enter personal, academic, skill, project, and job description details.</span>
              </button>
              <button className="choice-button" onClick={() => setPage("optimize")}>
                <FileText size={28} />
                <strong>Optimize Existing Resume</strong>
                <span>Upload or paste your resume and let AI suggest approved changes one by one.</span>
              </button>
            </div>
          </section>
        )}

        {page !== "welcome" && (
          <header className="topbar">
            <div>
              <p className="eyebrow">{page === "build" ? "Build From Scratch" : "Optimize Existing Resume"}</p>
              <h1>{page === "build" ? "Enter every detail AI needs to create your resume" : "Let AI improve your resume with approval for every change"}</h1>
            </div>
            <div className="topbar-actions">
              <button className="ghost-button" onClick={goHome}>
                <ArrowLeft size={18} />
                Home
              </button>
              <button className="primary-button" disabled={!optimizedResume} onClick={() => setIsApproved(true)}>
                <BadgeCheck size={18} />
                Approve Final Resume
              </button>
            </div>
          </header>
        )}

        {page === "build" && (
          <section className="page-grid">
            <div className="form-panel">
              <div className="panel-heading spacious">
                <Bot size={19} />
                <div>
                  <h2>Required Resume Details</h2>
                  <p>All fields are intentionally empty so the user provides their own information.</p>
                </div>
              </div>
              <div className="form-grid">
                <label>Name : <input value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} /></label>
                <label>Age : <input /></label>
                <label>Email : <input value={profile.email} onChange={(event) => updateProfile("email", event.target.value)} /></label>
                <label>Phone : <input value={profile.phone} onChange={(event) => updateProfile("phone", event.target.value)} /></label>
                <label>Address / Location : <input value={profile.location} onChange={(event) => updateProfile("location", event.target.value)} /></label>
                <label>Target Role : <input value={profile.targetRole} onChange={(event) => updateProfile("targetRole", event.target.value)} /></label>
                <label>LinkedIn : <input value={profile.linkedin} onChange={(event) => updateProfile("linkedin", event.target.value)} /></label>
                <label>GitHub / Portfolio : <input value={profile.github} onChange={(event) => updateProfile("github", event.target.value)} /></label>
                <label>Career Objective / Summary : <textarea value={profile.summary} onChange={(event) => updateProfile("summary", event.target.value)} /></label>
                <label>Skill Set : <textarea value={profile.skills} onChange={(event) => updateProfile("skills", event.target.value)} /></label>
                <label>Academic Details : <textarea value={profile.education} onChange={(event) => updateProfile("education", event.target.value)} /></label>
                <label>Certifications : <textarea value={profile.certifications} onChange={(event) => updateProfile("certifications", event.target.value)} /></label>
              </div>

              <div className="dynamic-section">
                <h2>Projects :</h2>
                {profile.projects.map((project, index) => (
                  <div className="mini-form" key={index}>
                    <label>Project Name : <input value={project.name} onChange={(event) => {
                      const projects = [...profile.projects];
                      projects[index] = { ...project, name: event.target.value };
                      updateProfile("projects", projects);
                    }} /></label>
                    <label>Technologies Used : <input value={project.tech} onChange={(event) => {
                      const projects = [...profile.projects];
                      projects[index] = { ...project, tech: event.target.value };
                      updateProfile("projects", projects);
                    }} /></label>
                    <label>Project Description : <textarea value={project.description} onChange={(event) => {
                      const projects = [...profile.projects];
                      projects[index] = { ...project, description: event.target.value };
                      updateProfile("projects", projects);
                    }} /></label>
                    <label>Project Impact / Result : <textarea value={project.impact} onChange={(event) => {
                      const projects = [...profile.projects];
                      projects[index] = { ...project, impact: event.target.value };
                      updateProfile("projects", projects);
                    }} /></label>
                  </div>
                ))}
                <button className="ghost-button" onClick={() => updateProfile("projects", [...profile.projects, { name: "", tech: "", description: "", impact: "" }])}>
                  <Plus size={18} />
                  Add Project
                </button>
              </div>

              <div className="editor-panel embedded">
                <div className="panel-heading">
                  <h2>Job Description Attachment / Text :</h2>
                  <label className="icon-upload" title="Upload job description text">
                    <Upload size={17} />
                    <input type="file" accept=".txt,.md" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) readTextFile(file, setJobDescription);
                    }} />
                  </label>
                </div>
                <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} />
              </div>

              <div className="approval-actions padded">
                <button className="primary-button" disabled={loading || !jobDescription.trim()} onClick={() => callAi("build")}>
                  {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                  Build and Optimize With AI
                </button>
              </div>
            </div>
            <ResultPanel
              aiProvider={aiProvider}
              analysis={analysis}
              message={message}
              originalResume={originalResume}
              optimizedResume={optimizedResume}
              activeSuggestion={activeSuggestion}
              pendingCount={pendingSuggestions.length}
              appliedCount={appliedIds.length}
              skippedCount={skippedIds.length}
              isApproved={isApproved}
              onApply={applyCurrentSuggestion}
              onSkip={skipCurrentSuggestion}
            />
          </section>
        )}

        {page === "optimize" && (
          <section className="page-grid">
            <div className="form-panel">
              <div className="editor-panel embedded">
                <div className="panel-heading">
                  <h2>Present Resume Attachment / Text :</h2>
                  <label className="icon-upload" title="Upload resume text">
                    <Upload size={17} />
                    <input type="file" accept=".txt,.md" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) readTextFile(file, setCurrentResume);
                    }} />
                  </label>
                </div>
                <textarea value={currentResume} onChange={(event) => setCurrentResume(event.target.value)} />
              </div>

              <div className="editor-panel embedded">
                <div className="panel-heading">
                  <h2>Job Description Attachment / Text :</h2>
                  <label className="icon-upload" title="Upload job description text">
                    <Upload size={17} />
                    <input type="file" accept=".txt,.md" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) readTextFile(file, setJobDescription);
                    }} />
                  </label>
                </div>
                <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} />
              </div>

              <div className="approval-actions padded">
                <button className="primary-button" disabled={loading || !currentResume.trim() || !jobDescription.trim()} onClick={() => callAi("optimize")}>
                  {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                  Optimize With AI
                </button>
              </div>
            </div>
            <ResultPanel
              aiProvider={aiProvider}
              analysis={analysis}
              message={message}
              originalResume={originalResume}
              optimizedResume={optimizedResume}
              activeSuggestion={activeSuggestion}
              pendingCount={pendingSuggestions.length}
              appliedCount={appliedIds.length}
              skippedCount={skippedIds.length}
              isApproved={isApproved}
              onApply={applyCurrentSuggestion}
              onSkip={skipCurrentSuggestion}
            />
          </section>
        )}
      </section>
    </main>
  );
}

type ResultPanelProps = {
  aiProvider: string;
  analysis: ReturnType<typeof analyzeResume>;
  message: string;
  originalResume: string;
  optimizedResume: string;
  activeSuggestion?: Suggestion;
  pendingCount: number;
  appliedCount: number;
  skippedCount: number;
  isApproved: boolean;
  onApply: () => void;
  onSkip: () => void;
};

function ResultPanel({
  aiProvider,
  analysis,
  message,
  originalResume,
  optimizedResume,
  activeSuggestion,
  pendingCount,
  appliedCount,
  skippedCount,
  isApproved,
  onApply,
  onSkip,
}: ResultPanelProps) {
  return (
    <aside className="result-panel">
      <section className="score-grid compact">
        <article className="score-panel main-score">
          <span>ATS Score</span>
          <strong>{optimizedResume ? analysis.score.overall : "-"}</strong>
        </article>
        <article className="score-panel">
          <span>Keywords</span>
          <strong>{optimizedResume ? `${analysis.score.keywordMatch}%` : "-"}</strong>
        </article>
      </section>

      {message && <p className="status-message">{message}</p>}
      {aiProvider && <p className="provider-label">AI Provider: {aiProvider}</p>}

      <section className="suggestion-panel">
        <div className="panel-heading spacious">
          <Sparkles size={19} />
          <div>
            <h2>AI Change Approval Queue</h2>
            <p>{pendingCount} pending, {appliedCount} applied, {skippedCount} skipped</p>
          </div>
        </div>
        {activeSuggestion ? (
          <article className="suggestion-card">
            <div className="suggestion-meta">
              <span>{suggestionLabels[activeSuggestion.type]}</span>
              <small>{Math.round(activeSuggestion.confidence * 100)}% confidence</small>
            </div>
            <h3>{activeSuggestion.title}</h3>
            <p>{activeSuggestion.rationale}</p>
            <div className="diff-grid">
              <div>
                <span>Before</span>
                <pre>{activeSuggestion.before || "New AI-generated resume content"}</pre>
              </div>
              <ArrowRight size={20} />
              <div>
                <span>After</span>
                <pre>{activeSuggestion.after}</pre>
              </div>
            </div>
            <div className="approval-actions">
              <button className="danger-button" onClick={onSkip}>
                <X size={18} />
                Skip
              </button>
              <button className="primary-button" onClick={onApply}>
                <BadgeCheck size={18} />
                Apply
              </button>
            </div>
          </article>
        ) : (
          <div className="empty-state">
            <Bot size={28} />
            <h3>{optimizedResume ? "No pending AI changes" : "AI output will appear here"}</h3>
            <p>{optimizedResume ? "Approve the final resume to enable downloads." : "Upload details and run AI to generate suggestions."}</p>
          </div>
        )}
      </section>

      <section className="comparison-grid stacked">
        <div className="resume-preview">
          <h2>Given Resume</h2>
          <pre>{originalResume || "No resume uploaded for this flow."}</pre>
        </div>
        <div className="resume-preview emphasized">
          <div className="preview-title-row">
            <h2>Updated Resume</h2>
            <div className="download-actions">
              <button disabled={!isApproved || !optimizedResume} onClick={() => exportPdf(optimizedResume)}>
                <Download size={17} />
                PDF
              </button>
              <button disabled={!isApproved || !optimizedResume} onClick={() => exportDocx(optimizedResume)}>
                <Download size={17} />
                DOCX
              </button>
            </div>
          </div>
          <pre>{optimizedResume || "AI-generated resume will appear here."}</pre>
        </div>
      </section>
    </aside>
  );
}

export default App;
