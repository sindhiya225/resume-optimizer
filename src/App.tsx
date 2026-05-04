import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Download,
  FileCheck2,
  FileText,
  Hammer,
  Plus,
  RotateCcw,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { sampleJobDescription, sampleResume } from "./data/sampleContent";
import { createLocalAiInsights, aiIntegrationPlan } from "./lib/aiAssistant";
import { analyzeResume, applySuggestion } from "./lib/analyzer";
import { exportDocx, exportPdf } from "./lib/exporters";
import { buildResumeFromData, emptyBuilderData } from "./lib/resumeBuilder";
import { ResumeBuilderData, Suggestion } from "./types";

type Mode = "optimize" | "build";

const suggestionLabels: Record<Suggestion["type"], string> = {
  keyword: "Keyword",
  impact: "Impact",
  project: "Project",
  format: "Format",
  summary: "Summary",
};

const readTextFile = (file: File, onLoad: (value: string) => void) => {
  const reader = new FileReader();
  reader.onload = () => onLoad(String(reader.result ?? ""));
  reader.readAsText(file);
};

function App() {
  const [mode, setMode] = useState<Mode>("optimize");
  const [resume, setResume] = useState(sampleResume);
  const [jobDescription, setJobDescription] = useState(sampleJobDescription);
  const [optimizedResume, setOptimizedResume] = useState(sampleResume);
  const [builderData, setBuilderData] = useState<ResumeBuilderData>(emptyBuilderData);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [isApproved, setIsApproved] = useState(false);

  const analysis = useMemo(
    () => analyzeResume(optimizedResume, jobDescription),
    [optimizedResume, jobDescription],
  );
  const pendingSuggestions = analysis.suggestions.filter(
    (suggestion) => !appliedIds.includes(suggestion.id) && !skippedIds.includes(suggestion.id),
  );
  const activeSuggestion = pendingSuggestions[0];
  const aiInsights = useMemo(
    () => createLocalAiInsights(optimizedResume, jobDescription, analysis),
    [analysis, jobDescription, optimizedResume],
  );

  const resetWorkflow = () => {
    setOptimizedResume(resume);
    setAppliedIds([]);
    setSkippedIds([]);
    setIsApproved(false);
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

  const updateBuilder = <K extends keyof ResumeBuilderData>(
    key: K,
    value: ResumeBuilderData[K],
  ) => setBuilderData((current) => ({ ...current, [key]: value }));

  const generateResume = () => {
    const builtResume = buildResumeFromData(builderData);
    setResume(builtResume);
    setOptimizedResume(builtResume);
    setMode("optimize");
    setAppliedIds([]);
    setSkippedIds([]);
    setIsApproved(false);
  };

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">ATS Resume Studio</p>
            <h1>Build or optimize a resume for a target internship role</h1>
          </div>
          <div className="topbar-actions">
            <button
              className={mode === "optimize" ? "primary-button" : "ghost-button"}
              onClick={() => setMode("optimize")}
            >
              <Wand2 size={18} />
              Optimize
            </button>
            <button
              className={mode === "build" ? "primary-button" : "ghost-button"}
              onClick={() => setMode("build")}
            >
              <Hammer size={18} />
              Build
            </button>
            <button className="ghost-button" onClick={resetWorkflow}>
              <RotateCcw size={18} />
              Reset
            </button>
            <button className="primary-button" onClick={() => setIsApproved(true)}>
              <BadgeCheck size={18} />
              Approve
            </button>
          </div>
        </header>

        <section className="score-grid" aria-label="ATS score breakdown">
          <article className="score-panel main-score">
            <span>ATS Score</span>
            <strong>{analysis.score.overall}</strong>
            <small>Updated live as changes are applied</small>
          </article>
          <article className="score-panel">
            <span>Keywords</span>
            <strong>{analysis.score.keywordMatch}%</strong>
          </article>
          <article className="score-panel">
            <span>Impact</span>
            <strong>{analysis.score.impact}%</strong>
          </article>
          <article className="score-panel">
            <span>Projects</span>
            <strong>{analysis.score.projectRelevance}%</strong>
          </article>
        </section>

        {mode === "build" ? (
          <section className="builder-grid">
            <div className="builder-panel">
              <div className="panel-heading spacious">
                <Hammer size={19} />
                <div>
                  <h2>Resume Builder</h2>
                  <p>Enter structured details, generate a resume, then optimize it against the job description.</p>
                </div>
              </div>
              <div className="form-grid">
                <input value={builderData.name} onChange={(event) => updateBuilder("name", event.target.value)} placeholder="Full name" />
                <input value={builderData.targetRole} onChange={(event) => updateBuilder("targetRole", event.target.value)} placeholder="Target role" />
                <input value={builderData.email} onChange={(event) => updateBuilder("email", event.target.value)} placeholder="Email" />
                <input value={builderData.phone} onChange={(event) => updateBuilder("phone", event.target.value)} placeholder="Phone" />
                <input value={builderData.location} onChange={(event) => updateBuilder("location", event.target.value)} placeholder="Location" />
                <input value={builderData.linkedin} onChange={(event) => updateBuilder("linkedin", event.target.value)} placeholder="LinkedIn" />
                <input value={builderData.github} onChange={(event) => updateBuilder("github", event.target.value)} placeholder="GitHub" />
                <textarea value={builderData.summary} onChange={(event) => updateBuilder("summary", event.target.value)} placeholder="Professional summary" />
                <textarea value={builderData.skills} onChange={(event) => updateBuilder("skills", event.target.value)} placeholder="Skills" />
                <textarea value={builderData.education} onChange={(event) => updateBuilder("education", event.target.value)} placeholder="Education" />
                <textarea value={builderData.certifications} onChange={(event) => updateBuilder("certifications", event.target.value)} placeholder="Certifications" />
              </div>

              <div className="dynamic-section">
                <h2>Projects</h2>
                {builderData.projects.map((project, index) => (
                  <div className="mini-form" key={index}>
                    <input value={project.name} onChange={(event) => {
                      const projects = [...builderData.projects];
                      projects[index] = { ...project, name: event.target.value };
                      updateBuilder("projects", projects);
                    }} placeholder="Project name" />
                    <input value={project.tech} onChange={(event) => {
                      const projects = [...builderData.projects];
                      projects[index] = { ...project, tech: event.target.value };
                      updateBuilder("projects", projects);
                    }} placeholder="Tech stack" />
                    <textarea value={project.description} onChange={(event) => {
                      const projects = [...builderData.projects];
                      projects[index] = { ...project, description: event.target.value };
                      updateBuilder("projects", projects);
                    }} placeholder="What you built" />
                    <textarea value={project.impact} onChange={(event) => {
                      const projects = [...builderData.projects];
                      projects[index] = { ...project, impact: event.target.value };
                      updateBuilder("projects", projects);
                    }} placeholder="Impact or result" />
                  </div>
                ))}
                <button className="ghost-button" onClick={() => updateBuilder("projects", [...builderData.projects, { name: "", tech: "", description: "", impact: "" }])}>
                  <Plus size={18} />
                  Add Project
                </button>
              </div>

              <div className="approval-actions">
                <button className="primary-button" onClick={generateResume}>
                  <Sparkles size={18} />
                  Generate Resume
                </button>
              </div>
            </div>
            <div className="resume-preview emphasized">
              <h2>Generated Preview</h2>
              <pre>{buildResumeFromData(builderData)}</pre>
            </div>
          </section>
        ) : (
          <>
            <section className="input-grid">
              <div className="editor-panel">
                <div className="panel-heading">
                  <FileText size={19} />
                  <h2>Resume</h2>
                  <label className="icon-upload" title="Upload resume text">
                    <Upload size={17} />
                    <input
                      type="file"
                      accept=".txt,.md"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          readTextFile(file, (value) => {
                            setResume(value);
                            setOptimizedResume(value);
                            setAppliedIds([]);
                            setSkippedIds([]);
                          });
                        }
                      }}
                    />
                  </label>
                </div>
                <textarea value={resume} onChange={(event) => setResume(event.target.value)} />
              </div>

              <div className="editor-panel">
                <div className="panel-heading">
                  <FileCheck2 size={19} />
                  <h2>Job Description</h2>
                  <label className="icon-upload" title="Upload job description text">
                    <Upload size={17} />
                    <input
                      type="file"
                      accept=".txt,.md"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) readTextFile(file, setJobDescription);
                      }}
                    />
                  </label>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                />
              </div>
            </section>

            <section className="review-flow">
              <div className="suggestion-panel">
                <div className="panel-heading spacious">
                  <Sparkles size={19} />
                  <div>
                    <h2>Approval Queue</h2>
                    <p>{pendingSuggestions.length} pending changes, {appliedIds.length} applied, {skippedIds.length} skipped</p>
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
                        <pre>{activeSuggestion.before}</pre>
                      </div>
                      <ArrowRight size={20} />
                      <div>
                        <span>After</span>
                        <pre>{activeSuggestion.after}</pre>
                      </div>
                    </div>
                    <div className="approval-actions">
                      <button className="danger-button" onClick={skipCurrentSuggestion}>
                        <X size={18} />
                        Skip
                      </button>
                      <button className="primary-button" onClick={applyCurrentSuggestion}>
                        <BadgeCheck size={18} />
                        Apply
                      </button>
                    </div>
                  </article>
                ) : (
                  <div className="empty-state">
                    <BadgeCheck size={28} />
                    <h3>Review complete</h3>
                    <p>Every generated change has been applied or skipped. Approve the final version to enable downloads.</p>
                  </div>
                )}
              </div>

              <aside className="insights-panel">
                <h2>Keyword Coverage</h2>
                <div className="chip-group">
                  {analysis.matchedKeywords.slice(0, 10).map((keyword) => (
                    <span className="chip matched" key={keyword}>{keyword}</span>
                  ))}
                  {analysis.missingKeywords.slice(0, 10).map((keyword) => (
                    <span className="chip missing" key={keyword}>{keyword}</span>
                  ))}
                </div>
                <h2>AI Assistant</h2>
                <div className="ai-list">
                  {aiInsights.map((insight) => (
                    <article key={insight.title}>
                      <span>{insight.priority}</span>
                      <strong>{insight.title}</strong>
                      <p>{insight.detail}</p>
                    </article>
                  ))}
                </div>
              </aside>
            </section>
          </>
        )}

        <section className="ai-architecture">
          <div className="panel-heading spacious">
            <Bot size={19} />
            <div>
              <h2>AI Integration Design</h2>
              <p>{aiIntegrationPlan}</p>
            </div>
          </div>
        </section>

        <section className="comparison-grid">
          <div className="resume-preview">
            <h2>Original Resume</h2>
            <pre>{resume}</pre>
          </div>
          <div className="resume-preview emphasized">
            <div className="preview-title-row">
              <h2>Updated Resume</h2>
              <div className="download-actions">
                <button disabled={!isApproved} onClick={() => exportPdf(optimizedResume)}>
                  <Download size={17} />
                  PDF
                </button>
                <button disabled={!isApproved} onClick={() => exportDocx(optimizedResume)}>
                  <Download size={17} />
                  DOCX
                </button>
              </div>
            </div>
            <pre>{optimizedResume}</pre>
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
