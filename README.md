# Resume Optimizer

A React + TypeScript resume optimization app that compares a resume with a job description, estimates ATS alignment, and guides the user through one approval-based change at a time.

## Features

- Live ATS score with keyword, impact, formatting, and project relevance breakdowns.
- Resume and job description text import using `.txt` or `.md` files.
- Keyword extraction from the job description.
- One-by-one approval queue for every suggested resume change.
- Apply or skip each recommendation; no change is made without user permission.
- Original vs optimized resume comparison.
- Final approval gate before exporting.
- Download optimized resume as PDF or DOCX.

## Tech Stack

- **React** for component-based UI development.
- **TypeScript** for safer state, suggestion, and scoring models.
- **Vite** for fast local development and production builds.
- **Lucide React** for professional interface icons.
- **jsPDF** for browser-side PDF export.
- **docx** for browser-side Word document generation.
- **Custom ATS analysis engine** for keyword matching, scoring, weak-project detection, and change suggestions.

## Workflow

1. User pastes or uploads the resume and job description.
2. The analyzer extracts important role keywords and compares them with the resume.
3. The app calculates score categories: keyword match, impact, formatting, and project relevance.
4. The app creates suggested changes with before/after previews and rationale.
5. The user approves or skips each change.
6. Approved changes are applied to the optimized resume.
7. The user compares original and optimized versions.
8. After final approval, the user exports the optimized resume as PDF or DOCX.

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

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
git init
git add .
git commit -m "Build resume optimizer app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/resume-optimizer.git
git push -u origin main
```

Create an empty GitHub repository first, then replace `YOUR_USERNAME` with your GitHub username.
