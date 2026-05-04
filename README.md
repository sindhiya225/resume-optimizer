# Resume Optimizer and Builder

A React + TypeScript application that helps users either optimize an existing resume for a job description or build a resume from scratch using structured details. The app calculates ATS-style alignment, suggests improvements, asks for approval before every change, and exports the final approved resume as PDF or DOCX.

## Key Features

- Two workflows: optimize an existing resume or build a new resume from structured inputs.
- Resume builder fields for name, contact details, target role, summary, skills, projects, experience, education, and certifications.
- Live ATS-style score with keyword match, impact, formatting, and project relevance.
- Keyword extraction from the job description.
- One-by-one approval queue with before/after previews.
- Apply or skip each recommendation; the app never changes the resume without user approval.
- AI Assistant panel with prioritized improvement insights.
- AI integration design layer showing how a real LLM backend would be added safely.
- Original vs optimized resume comparison.
- Final approval gate before downloads.
- Export optimized resume as PDF or DOCX.

## Tech Stack

- **React**: Component-based frontend UI.
- **TypeScript**: Strong typing for resume data, scoring, suggestions, and builder state.
- **Vite**: Fast development server and optimized production build.
- **Lucide React**: Clean icon system for buttons and panels.
- **jsPDF**: Browser-side PDF generation.
- **docx**: Browser-side Word document generation.
- **Custom ATS analyzer**: Local scoring and recommendation engine.
- **AI adapter design**: A separate `aiAssistant` module that can later be connected to a backend LLM API.

## Main Workflow

1. User selects either **Optimize** or **Build** mode.
2. In Optimize mode, the user pastes or uploads a resume and job description.
3. In Build mode, the user enters structured profile data and generates a resume.
4. The generated or uploaded resume is compared with the job description.
5. The analyzer extracts important keywords and calculates score categories.
6. The app creates suggestions for keywords, summary, impact bullets, formatting, and project relevance.
7. Each suggestion is shown with reason, before text, and after text.
8. User clicks **Apply** or **Skip** for each change.
9. The optimized resume updates only after approval.
10. User compares the original and updated resume.
11. User approves the final resume.
12. PDF and DOCX download buttons are enabled.

## Important Concepts Used

- **State management with React hooks**: `useState` stores resume text, builder data, approvals, skips, and final approval state.
- **Derived data with `useMemo`**: ATS analysis is recalculated when resume or job description changes.
- **Type-safe domain models**: `Suggestion`, `AnalysisResult`, and `ResumeBuilderData` define predictable data structures.
- **Approval-based mutation**: Suggested changes are generated first; actual resume text changes only after the user clicks Apply.
- **Separation of concerns**: Analyzer, resume builder, AI insights, and exporters are separate modules.
- **Client-side export**: PDF and DOCX are generated in the browser without a backend.
- **Human-in-the-loop AI design**: AI can recommend changes, but the user remains in control.
- **ATS scoring heuristic**: The score is based on keyword match, measurable impact, formatting sections, and project relevance.

## AI Integration Explanation

The current app includes a local AI-style assistant that generates prioritized insights from the analyzer output. For production, the AI integration should be done through a backend, not directly in React.

Recommended production flow:

1. React sends resume text, job description, and analyzer score to a backend API.
2. Backend stores the LLM API key securely in environment variables.
3. Backend calls an AI model and asks for structured JSON suggestions.
4. Backend validates the response format.
5. Frontend displays AI suggestions in the same approval queue.
6. User approves or skips every AI-generated change.

Why backend is needed:

- API keys should not be exposed in frontend code.
- Backend can validate, rate-limit, log, and sanitize AI responses.
- Sensitive resume data can be handled with stricter privacy controls.
- The frontend remains provider-agnostic.

## Project Structure

```text
src/
  App.tsx                  Main UI and workflow orchestration
  types.ts                 Shared TypeScript models
  data/sampleContent.ts    Demo resume and job description
  lib/analyzer.ts          ATS scoring and suggestions
  lib/resumeBuilder.ts     Structured resume generation
  lib/aiAssistant.ts       AI-style insights and integration plan
  lib/exporters.ts         PDF and DOCX export logic
  styles.css               App styling
```

## Setup

```bash
npm install
npm run dev
```

Open:

```bash
http://127.0.0.1:5173
```

## Production Build

```bash
npm run build
npm run preview
```

## GitHub Push

```bash
git add .
git commit -m "Add resume builder and AI assistant features"
git remote add origin https://github.com/YOUR_USERNAME/resume-optimizer.git
git push -u origin main
```

If the remote already exists:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/resume-optimizer.git
git push -u origin main
```

## Interview Questions and Suggested Answers

### 1. Why did you use React instead of plain HTML/CSS?

React makes the app component-based and state-driven. This project has multiple changing states: resume text, job description, generated suggestions, approval status, builder data, and export readiness. React handles this more cleanly than manual DOM manipulation.

### 2. Why TypeScript?

TypeScript helps define clear models for suggestions, scoring, resume builder data, and AI insights. It reduces runtime bugs and makes the code easier to maintain.

### 3. How does the ATS score work?

The score is a heuristic. It checks keyword match against the job description, whether bullets contain measurable impact, whether standard resume sections exist, and whether projects are relevant to the role.

### 4. Does the app really use AI?

The current version has a local AI-style assistant and a clean integration plan. In production, the AI call should be handled by a backend API so the API key is secure. The frontend is already designed around structured AI suggestions.

### 5. Why ask for approval before every change?

Resume edits are sensitive. The user should control every modification because AI or automated systems may make inaccurate or exaggerated suggestions.

### 6. How would you add real AI?

I would create a backend API route that receives resume and job description text, calls an LLM with a structured prompt, validates the JSON response, and returns suggestions to the frontend approval queue.

### 7. What are the limitations?

The current ATS score is heuristic, not a real ATS vendor algorithm. PDF parsing is not included yet; the app currently imports text or markdown. Real AI integration would need a backend and privacy controls.

### 8. How do PDF and Word downloads work?

PDF export uses `jsPDF`, and Word export uses the `docx` package. Both run in the browser after the user approves the final resume.

### 9. What would you improve next?

- Add backend AI integration.
- Add PDF/DOCX resume upload parsing.
- Add authentication and saved resume versions.
- Add templates for different resume layouts.
- Add grammar checking and tone control.
- Add analytics for score improvement before and after changes.

### 10. What makes this project stronger than a basic frontend project?

It has a real workflow, structured data models, scoring logic, approval-based editing, export functionality, and a clear path to production AI integration.
