import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as mammoth from 'mammoth';
import { Document as DocxDocument, Paragraph, TextRun, Packer } from 'docx';

export interface DocumentConvertOptions {
  fontSize?: number;
  margins?: number;
}

// Lazy loader for pdfjs-dist
async function getPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    } catch {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }
  }
  return pdfjsLib;
}

export async function convertDocument(
  file: File | Blob,
  sourceFormat: string,
  targetFormat: string,
  options: DocumentConvertOptions = {},
  onProgress?: (progress: number, message: string) => void
): Promise<Blob> {
  const src = sourceFormat.toUpperCase();
  const tgt = targetFormat.toUpperCase();

  onProgress?.(15, `Reading ${src} document into browser RAM...`);
  const arrayBuffer = await file.arrayBuffer();

  // =========================================================================
  // 1. PDF SOURCE CONVERSIONS (PDF to TXT, DOCX, HTML, JPG, PNG)
  // =========================================================================
  if (src === 'PDF') {
    onProgress?.(25, 'Initializing local PDF parser...');
    const pdfjsLib = await getPdfJs();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    // A. PDF to Image (JPG or PNG)
    if (tgt === 'JPG' || tgt === 'JPEG' || tgt === 'PNG') {
      onProgress?.(50, `Rendering PDF page 1 of ${numPages} to high-resolution image...`);
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x retina clarity

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize HTML5 Canvas 2D context for PDF rendering');

      if (tgt === 'JPG' || tgt === 'JPEG') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      await page.render({ canvasContext: ctx, viewport }).promise;

      onProgress?.(90, `Encoding ${tgt} image output...`);
      const mime = (tgt === 'JPG' || tgt === 'JPEG') ? 'image/jpeg' : 'image/png';
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            onProgress?.(100, `PDF to ${tgt} conversion complete!`);
            resolve(blob);
          } else {
            reject(new Error(`Failed to encode rendered PDF to ${tgt}`));
          }
        }, mime, 0.92);
      });
    }

    // B. PDF to TXT, DOCX, or HTML: Extract text across all pages
    onProgress?.(35, `Extracting text content across ${numPages} page${numPages > 1 ? 's' : ''}...`);
    const pageTexts: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (pageStr) {
        pageTexts.push(pageStr);
      }
      onProgress?.(35 + Math.round((i / numPages) * 45), `Analyzed page ${i} of ${numPages}...`);
    }

    let fullText = pageTexts.join('\n\n');
    const isScannedWithoutText = !fullText.trim();
    if (isScannedWithoutText) {
      fullText = 'Note: No digital text layer detected. This PDF appears to be a scanned document or image-only file. For scanned documents, please convert to JPG or PNG to view the pages.';
    }

    if (tgt === 'TXT') {
      onProgress?.(100, 'PDF text extraction complete!');
      return new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    }

    if (tgt === 'HTML') {
      onProgress?.(90, 'Formatting extracted text to HTML structure...');
      const escaped = fullText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');

      const htmlOutput = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Converted Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
    p { margin-bottom: 1.2em; }
  </style>
</head>
<body>
  <p>${escaped}</p>
</body>
</html>`;
      onProgress?.(100, 'PDF to HTML export complete!');
      return new Blob([htmlOutput], { type: 'text/html;charset=utf-8' });
    }

    if (tgt === 'DOCX') {
      onProgress?.(85, 'Assembling Word OpenXML (.docx) paragraphs...');
      const paragraphs = fullText.split('\n\n').map((block) => 
        new Paragraph({
          children: [new TextRun({ text: block.replace(/\n/g, ' '), size: 24 })],
          spacing: { after: 180 },
        })
      );
      const doc = new DocxDocument({
        sections: [{ properties: {}, children: paragraphs }],
      });
      const docxBlob = await Packer.toBlob(doc);
      onProgress?.(100, 'PDF to DOCX export complete!');
      return docxBlob;
    }
  }

  // =========================================================================
  // 2. DOCX SOURCE CONVERSIONS (DOCX to HTML, TXT, PDF)
  // =========================================================================
  if (src === 'DOCX') {
    onProgress?.(45, 'Parsing DOCX structure with Mammoth...');
    if (tgt === 'HTML') {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const htmlOutput = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Converted Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
    p { margin-bottom: 1em; }
    h1, h2, h3 { color: #111; }
  </style>
</head>
<body>
${result.value}
</body>
</html>`;
      onProgress?.(100, 'DOCX to HTML conversion complete!');
      return new Blob([htmlOutput], { type: 'text/html;charset=utf-8' });
    }

    if (tgt === 'TXT') {
      const result = await mammoth.extractRawText({ arrayBuffer });
      onProgress?.(100, 'DOCX to TXT conversion complete!');
      return new Blob([result.value], { type: 'text/plain;charset=utf-8' });
    }

    if (tgt === 'PDF') {
      onProgress?.(60, 'Synthesizing PDF layout...');
      const result = await mammoth.extractRawText({ arrayBuffer });
      return await textToPdf(result.value, onProgress);
    }
  }

  // =========================================================================
  // 3. TXT or HTML to DOCX
  // =========================================================================
  if ((src === 'TXT' || src === 'HTML') && tgt === 'DOCX') {
    onProgress?.(50, 'Assembling Word XML document...');
    const text = new TextDecoder().decode(arrayBuffer);
    const cleanText = src === 'HTML' ? text.replace(/<[^>]*>?/gm, '\n').replace(/\n\s*\n/g, '\n') : text;

    const lines = cleanText.split('\n');
    const paragraphs = lines.map(line => 
      new Paragraph({
        children: [new TextRun({ text: line, size: 24 })], // 12pt
        spacing: { after: 120 },
      })
    );

    const doc = new DocxDocument({
      sections: [{ properties: {}, children: paragraphs }],
    });

    onProgress?.(85, 'Packaging OpenXML DOCX archive...');
    const docxBlob = await Packer.toBlob(doc);
    onProgress?.(100, 'DOCX export complete!');
    return docxBlob;
  }

  // =========================================================================
  // 4. TXT or HTML to PDF
  // =========================================================================
  if ((src === 'TXT' || src === 'HTML') && tgt === 'PDF') {
    const text = new TextDecoder().decode(arrayBuffer);
    const cleanText = src === 'HTML' ? text.replace(/<[^>]*>?/gm, ' ') : text;
    return await textToPdf(cleanText, onProgress);
  }

  // =========================================================================
  // 5. Image (JPG, PNG, WEBP, etc.) to PDF
  // =========================================================================
  if ((src === 'JPG' || src === 'JPEG' || src === 'PNG' || src === 'WEBP' || src === 'HEIC' || src === 'SVG') && tgt === 'PDF') {
    onProgress?.(40, 'Embedding image into vector PDF...');
    const pdfDoc = await PDFDocument.create();
    let embeddedImg;

    if (src === 'PNG') {
      embeddedImg = await pdfDoc.embedPng(arrayBuffer);
    } else if (src === 'JPG' || src === 'JPEG') {
      embeddedImg = await pdfDoc.embedJpg(arrayBuffer);
    } else {
      // For WEBP, SVG, HEIC: render onto an in-memory canvas and embed as PNG
      onProgress?.(50, 'Converting image buffer to standard bitmap...');
      const img = new Image();
      const blobUrl = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to rasterize image for PDF embedding'));
        img.src = blobUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(blobUrl);

      const pngData = await new Promise<ArrayBuffer>((resolve, reject) => {
        canvas.toBlob(async (b) => {
          if (b) resolve(await b.arrayBuffer());
          else reject(new Error('Canvas toBlob failed'));
        }, 'image/png');
      });

      embeddedImg = await pdfDoc.embedPng(pngData);
    }

    const { width, height } = embeddedImg;
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width,
      height,
    });

    onProgress?.(85, 'Writing PDF binary stream...');
    const pdfBytes = await pdfDoc.save();
    onProgress?.(100, 'PDF generation complete!');
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  // =========================================================================
  // 6. TXT <-> HTML Simple Conversion
  // =========================================================================
  if (src === 'TXT' && tgt === 'HTML') {
    const text = new TextDecoder().decode(arrayBuffer);
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>\n');
    const html = `<!DOCTYPE html><html><body><pre>${escaped}</pre></body></html>`;
    onProgress?.(100, 'HTML generated!');
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  if (src === 'HTML' && tgt === 'TXT') {
    const text = new TextDecoder().decode(arrayBuffer);
    const stripped = text.replace(/<[^>]*>?/gm, '');
    onProgress?.(100, 'Text extracted!');
    return new Blob([stripped], { type: 'text/plain;charset=utf-8' });
  }

  throw new Error(`Unsupported document conversion: ${sourceFormat} to ${targetFormat}`);
}

async function textToPdf(
  rawText: string,
  onProgress?: (progress: number, message: string) => void
): Promise<Blob> {
  onProgress?.(65, 'Creating PDF pages in memory...');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const margin = 50;
  const pageWidth = 595.28; // A4 points
  const pageHeight = 841.89; // A4 points
  const usableWidth = pageWidth - margin * 2;
  const lineHeight = fontSize * 1.4;

  const lines = rawText.split('\n');
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  for (const line of lines) {
    const words = line.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > usableWidth) {
        if (y - lineHeight < margin) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        currentPage.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (y - lineHeight < margin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      currentPage.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
    }
  }

  onProgress?.(90, 'Finalizing PDF buffer...');
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, 'PDF creation complete!');
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
