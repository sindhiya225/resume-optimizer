import { ResumeBuilderData } from "../types";

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const section = (title: string, content: string[]) =>
  content.length ? `\n${title}\n${content.join("\n")}` : "";

export const emptyBuilderData: ResumeBuilderData = {
  name: "Aarav Mehta",
  age: "",
  email: "aarav.mehta@email.com",
  phone: "+91 98765 43210",
  location: "Coimbatore, India",
  linkedin: "linkedin.com/in/aaravmehta",
  github: "github.com/aaravmehta",
  targetRole: "Software Engineering Intern",
  summary:
    "Computer science student focused on React, TypeScript, API integration, and clean product-focused frontend development.",
  skills: "React, TypeScript, JavaScript, REST APIs, Node.js, MongoDB, Git, Responsive UI, Debugging",
  projects: [
    {
      name: "ATS Resume Optimizer",
      tech: "React, TypeScript, Vite, jsPDF, docx",
      description:
        "Built a resume analysis tool that compares resumes with job descriptions and recommends user-approved edits.",
      impact: "Designed scoring logic for keyword match, impact bullets, formatting, and project relevance.",
    },
    {
      name: "Student Attendance Portal",
      tech: "React, Node.js, MongoDB",
      description: "Created a faculty dashboard to mark attendance and export student reports.",
      impact: "Improved report generation flow and reduced manual record checking.",
    },
  ],
  experience: [
    {
      role: "Web Development Intern",
      company: "Bright Labs",
      duration: "May 2025 - July 2025",
      bullets:
        "Created reusable React components for an internal dashboard.\nImproved mobile responsiveness and fixed UI defects.",
    },
  ],
  education: "B.Tech Computer Science, PSG College of Technology",
  certifications: "JavaScript Algorithms and Data Structures\nReact Basics",
};

export const buildResumeFromData = (data: ResumeBuilderData) => {
  const contact = [data.email, data.phone, data.location, data.linkedin, data.github]
    .filter(Boolean)
    .join(" | ");
  const projects = data.projects
    .filter((project) => project.name.trim())
    .flatMap((project) => [
      `${project.name} | ${project.tech}`,
      `- ${project.description}`,
      `- ${project.impact}`,
    ]);
  const experience = data.experience
    .filter((item) => item.role.trim() || item.company.trim())
    .flatMap((item) => [
      `${item.role}, ${item.company} | ${item.duration}`,
      ...splitLines(item.bullets).map((bullet) => `- ${bullet.replace(/^- /, "")}`),
    ]);

  return [
    data.name,
    data.targetRole,
    contact,
    section("SUMMARY", [data.summary]),
    section("SKILLS", [data.skills]),
    section("PROJECTS", projects),
    section("EXPERIENCE", experience),
    section("EDUCATION", [data.education]),
    section("CERTIFICATIONS", splitLines(data.certifications)),
  ]
    .filter(Boolean)
    .join("\n");
};
