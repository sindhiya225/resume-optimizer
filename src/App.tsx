import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Download,
  FileCheck2,
  FileText,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { sampleJobDescription, sampleResume } from "./data/sampleContent";
import { analyzeResume, applySuggestion } from "./lib/analyzer";
import { exportDocx, exportPdf } from "./lib/exporters";
import { Suggestion } from "./types";

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
  const [resume, setResume] = useState(sampleResume);
  const [jobDescription, setJobDescription] = useState(sampleJobDescription);
  const [optimizedResume, setOptimizedResume] = useState(sampleResume);
  const [activeIndex, setActiveIndex] = useState(0);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [isApproved, setIsApproved] = useState(false);

  const analysis = useMemo(
    () => analyzeResume(optimizedResume, jobDescription),
    [optimizedResume, jobDescription],
  );
  const activeSuggestion = analysis.suggestions.filter(
    (suggestion) => !appliedIds.includes(suggestion.id) && !skippedIds.includes(suggestion.id),
  )[activeIndex];
  const pendingCount = analysis.suggestions.filter(
    (suggestion) => !appliedIds.includes(suggestion.id) && !skippedIds.includes(suggestion.id),
  ).length;

  const resetWorkflow = () => {
    setOptimizedResume(resume);
    setAppliedIds([]);
    setSkippedIds([]);
    setActiveIndex(0);
    setIsApproved(false);
  };

  const applyCurrentSuggestion = () => {
    if (!activeSuggestion) return;
    setOptimizedResume((current) => applySuggestion(current, activeSuggestion));
    setAppliedIds((current) => [...current, activeSuggestion.id]);
    setActiveIndex(0);
    setIsApproved(false);
  };

  const skipCurrentSuggestion = () => {
    if (!activeSuggestion) return;
    setSkippedIds((current) => [...current, activeSuggestion.id]);
    setActiveIndex(0);
  };

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">ATS Resume Studio</p>
            <h1>Optimize a resume for a target internship role</h1>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" onClick={resetWorkflow}>
              <RotateCcw size={18} />
              Reset
            </button>
            <button className="primary-button" onClick={() => setIsApproved(true)}>
              <BadgeCheck size={18} />
              Approve Resume
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
                <p>{pendingCount} pending changes, {appliedIds.length} applied, {skippedIds.length} skipped</p>
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
            <h2>Low-Relevance Projects</h2>
            {analysis.weakProjects.length ? (
              <ul>
                {analysis.weakProjects.map((project) => <li key={project}>{project}</li>)}
              </ul>
            ) : (
              <p className="muted">Projects are aligned with the job description.</p>
            )}
          </aside>
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
