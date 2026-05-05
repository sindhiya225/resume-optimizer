import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import mammoth from "mammoth/mammoth.browser";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const readAsText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read the file."));
    reader.readAsText(file);
  });

const readAsArrayBuffer = (file: File) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Unable to read the file."));
    reader.readAsArrayBuffer(file);
  });

const parsePdf = async (file: File) => {
  const buffer = await readAsArrayBuffer(file);
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) pages.push(pageText);
  }

  return pages.join("\n\n");
};

const parseDocx = async (file: File) => {
  const buffer = await readAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value.trim();
};

export const parseUploadedFile = async (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  let text = "";

  if (extension === "pdf" || file.type === "application/pdf") {
    text = await parsePdf(file);
  } else if (
    extension === "docx" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    text = await parseDocx(file);
  } else {
    text = await readAsText(file);
  }

  const cleaned = text.replace(/\u0000/g, "").trim();
  if (!cleaned) {
    throw new Error("No readable text was found. If this is a scanned PDF, please upload a text-based PDF or paste the content.");
  }

  return cleaned;
};
