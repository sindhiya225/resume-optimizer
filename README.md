# AI Resume Builder and Optimizer

A page-based React + TypeScript resume platform with two workflows:

1. **Build Resume From Scratch**
2. **Optimize Existing Resume**

The main feature is AI integration through a backend Gemini API proxy. The frontend never stores the API key. Users provide their own details and job description; there is no preloaded resume, job description, or profile data in the UI.

## Features

- Welcome page with two clear options.
- Scratch resume builder with explicit fields such as Name, Age, Email, Phone, Address, Skills, Projects, Academic Details, Certifications, and Job Description.
- Existing resume optimizer with empty resume and job description inputs.
- PDF, DOCX, TXT, and Markdown upload support for resume and job description attachments.
- Google Gemini AI backend integration.
- AI-generated resume creation for the builder flow.
- AI-generated one-by-one suggestions for the optimizer flow.
- User approval or skip for each AI change.
- ATS score preview after AI output.
- Final approval before download.
- Download as PDF or DOCX.

## AI Platform Used

This project uses **Google Gemini API** because it has a free tier suitable for student projects and prototypes.

The AI key is read from:

```bash
GEMINI_API_KEY
```

The backend automatically loads `.env` before calling Gemini.

The frontend calls:

```text
POST /api/ai/resume
```

The backend then calls Gemini and returns structured JSON to the frontend.

## Why Backend AI Integration?

API keys must not be placed inside React code because browser code is public. This project uses a Node.js backend proxy:

- Keeps `GEMINI_API_KEY` private.
- Sends resume and job description to Gemini.
- Requests structured JSON output.
- Validates and returns suggestions to the frontend.
- Preserves human approval before changes are applied.

## Tech Stack

- **React**: UI development.
- **TypeScript**: Type-safe models and workflow state.
- **Vite**: Fast frontend development and build tooling.
- **Node.js HTTP server**: Backend API proxy for AI integration.
- **Google Gemini API**: Free-tier AI model for resume generation and optimization.
- **Lucide React**: Icons.
- **jsPDF**: PDF export.
- **docx**: Word document export.
- **pdfjs-dist**: Extracts readable text from uploaded PDF resumes and job descriptions.
- **mammoth**: Extracts readable text from uploaded DOCX files.
- **Custom analyzer**: ATS-style score calculation.

## Workflow

### Build From Scratch

1. User opens the welcome page.
2. User selects **Build Resume From Scratch**.
3. User enters personal details, academic details, skills, projects, certifications, and job description.
4. User clicks **Build and Optimize With AI**.
5. Backend sends the structured profile and job description to Gemini.
6. Gemini returns an optimized resume and explanation suggestions.
7. User reviews the generated resume.
8. User approves the final resume.
9. User downloads PDF or DOCX.

### Optimize Existing Resume

1. User opens the welcome page.
2. User selects **Optimize Existing Resume**.
3. User uploads or pastes current resume.
4. User uploads or pastes job description.
5. User clicks **Optimize With AI**.
6. Backend sends resume and job description to Gemini.
7. Gemini returns atomic suggestions.
8. User applies or skips each change.
9. Resume changes only after approval.
10. User approves the final resume.
11. User downloads PDF or DOCX.

## Screenshots

### Build resume from scratch
<img width="1881" height="864" alt="build" src="https://github.com/user-attachments/assets/f29f780a-dd2e-46d4-ac1e-0ec13fc098e2" />
<img width="801" height="789" alt="suggestion" src="https://github.com/user-attachments/assets/0551eaf7-08db-415a-8559-e7d691f7947c" />
<img width="836" height="853" alt="download" src="https://github.com/user-attachments/assets/22530d4b-2d21-469c-854a-b0e1bafa621d" />

### Optimize existing resume
<img width="1894" height="855" alt="optimize" src="https://github.com/user-attachments/assets/66eecb0b-f7be-403e-b9fd-19bda24f9d19" />
<img width="871" height="800" alt="attach" src="https://github.com/user-attachments/assets/55e9867d-5844-441b-b0d2-18ee62749cc9" />
<img width="698" height="425" alt="suggest" src="https://github.com/user-attachments/assets/4f899cae-1887-4ca3-b42f-eb354e477a1b" />

## Setup

Create `.env` from `.env.example`:

```bash
copy .env.example .env
```

Add your Gemini API key:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8787
```

Run the full app:

```bash
npm install
npm run dev:full
```

Open:

```bash
http://127.0.0.1:5173
```

If `5173` is already in use, Vite will print another URL such as:

```bash
http://127.0.0.1:5174
```

You can also run the app in two terminals:

```bash
npm run api
npm run dev
```

## Production

```bash
npm run build
npm start
```

Open:

```bash
http://127.0.0.1:8787
```

## Important Concepts

- **Human-in-the-loop AI**: AI suggests, but user approves.
- **Prompt engineering**: Backend instructs Gemini to return strict JSON.
- **Structured AI response**: Suggestions include id, type, title, rationale, before, after, and confidence.
- **API key security**: Key stays on backend in environment variables.
- **ATS heuristics**: Score checks keywords, impact, formatting, and project relevance.
- **Stateful approval queue**: Applied and skipped suggestions are tracked separately.
- **Client-side export**: PDF and DOCX downloads are generated in the browser.
- **Separation of concerns**: UI, AI backend, analyzer, builder, and exporters are separate.

## Interview Questions

### Why did you add a backend?

Because AI API keys should not be exposed in frontend code. The backend securely calls Gemini and returns only the AI result to React.

### Why Gemini?

Gemini has a free tier, works well for text generation, and is suitable for student prototypes and internship pre-work projects.

### How do you ensure AI does not directly change the resume?

The optimizer flow stores AI suggestions separately. The app applies a change only when the user clicks Apply.

### What is the role of TypeScript?

TypeScript defines safe structures for resume profiles, suggestions, ATS scores, and AI responses. This reduces mistakes in a state-heavy app.

### How does ATS scoring work?

The score is a heuristic based on job keyword overlap, measurable bullet impact, standard sections, and project relevance.

### What are the limitations?

The ATS score is not an actual company ATS algorithm. The app can parse text-based PDFs and DOCX files, but scanned image-only PDFs need OCR, which is not included yet. AI quality depends on the prompt, Gemini response, and accuracy of user-provided details.

### What would you improve next?

- OCR for scanned PDFs.
- Authentication.
- Saved resume versions.
- Multiple resume templates.
- Streaming AI response.
- Stronger JSON schema validation.
- Deployment to Render, Railway, Vercel, or Google Cloud.

## GitHub Push

```bash
git add .
git commit -m "Add Gemini AI page flows"
git push -u origin main
```
