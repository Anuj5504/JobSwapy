import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js to use a bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href;

export async function parseResume(file) {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    // Use AI extractor to parse the text
    const parsed = await extractResumeData(fullText);

    return {
      text: fullText,
      parsed: parsed
    };

  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

async function extractResumeData(text) {
  try {
    const { extractWithAI } = await import('./aiExtractor.js');
    return await extractWithAI(text);
  } catch (error) {
    console.error('Error extracting data:', error);
    throw error;
  }
}
