import { Document, Packer, Paragraph, TextRun } from "docx";
import jsPDF from "jspdf";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const exportPdf = (content: string) => {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const maxWidth = 500;
  const lines = pdf.splitTextToSize(content, maxWidth);
  let y = margin;

  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  lines.forEach((line: string) => {
    if (y > 780) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 16;
  });

  pdf.save("optimized-resume.pdf");
};

export const exportDocx = async (content: string) => {
  const paragraphs = content.split("\n").map(
    (line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line || " ",
            bold: /^[A-Z][A-Z\s]+$/.test(line),
          }),
        ],
        spacing: { after: 100 },
      }),
  );

  const document = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, "optimized-resume.docx");
};
