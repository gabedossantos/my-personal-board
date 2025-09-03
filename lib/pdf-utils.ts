// Server-side PDF text extraction using pdfjs-dist to avoid bundling pitfalls
// Note: Only import this from Node.js runtime routes.

// Tiny helpers for OCR: create a single worker and reuse across pages
async function createOcrWorker() {
  const { createWorker } = await import('tesseract.js');
  const worker: any = await createWorker();
  if (typeof worker.load === 'function') await worker.load();
  if (typeof worker.loadLanguage === 'function') await worker.loadLanguage('eng');
  if (typeof worker.initialize === 'function') await worker.initialize('eng');
  return worker as any;
}

async function ocrImageBuffer(imgBuffer: Buffer, worker: any): Promise<string> {
  const { data } = await worker.recognize(imgBuffer);
  return (data?.text || '').replace(/\s+/g, ' ').trim();
}

export async function extractPdfTextFromBase64(base64: string, maxChars = 4000): Promise<string> {
  const buffer = Buffer.from(base64, 'base64');
  let extracted = '';

  // First try: pdfjs-dist legacy (no rendering, text only)
  try {
    const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    try {
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = undefined;
    } catch {}
    const loadingTask = (pdfjsLib as any).getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    const limit = Math.max(1000, maxChars);
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (pageText) extracted += (extracted ? '\n' : '') + pageText;
      if (extracted.length >= limit) break;
    }
  } catch (e) {
    // swallow and try fallback
  }

  // Fallback: pdf-parse if pdfjs yielded nothing/very little
  if (!extracted || extracted.length < 100) {
    try {
      // Use deep import to avoid test harness in package root
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js') as any).default || require('pdf-parse/lib/pdf-parse.js');
      const parsed = await pdfParse(buffer);
      const txt = (parsed && parsed.text) ? String(parsed.text) : '';
      extracted = txt.replace(/\s+/g, ' ').trim();
    } catch (e) {
      // give up
    }
  }

  // OCR fallback: If still insufficient text, render first few pages and OCR
  if (!extracted || extracted.length < 100) {
    try {
      const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
      try { (pdfjsLib as any).GlobalWorkerOptions.workerSrc = undefined; } catch {}
      const loadingTask = (pdfjsLib as any).getDocument({ data: buffer });
      const pdf = await loadingTask.promise;

  // Render with @napi-rs/canvas (server-only, dynamic import to avoid bundling)
  const { createCanvas } = (await import('@napi-rs/canvas')) as any;

      class NodeCanvasFactory {
        create(width: number, height: number) {
          const canvas = createCanvas(Math.ceil(width), Math.ceil(height));
          const context = canvas.getContext('2d');
          return { canvas, context } as any;
        }
        reset(canvasAndContext: any, width: number, height: number) {
          canvasAndContext.canvas.width = Math.ceil(width);
          canvasAndContext.canvas.height = Math.ceil(height);
        }
        destroy(canvasAndContext: any) {
          canvasAndContext.canvas.width = 0;
          canvasAndContext.canvas.height = 0;
          (canvasAndContext as any).canvas = null;
          (canvasAndContext as any).context = null;
        }
      }
      const canvasFactory = new NodeCanvasFactory();

  const maxPages = Math.min(pdf.numPages, 15); // increased OCR page limit for better coverage
  let ocrText = '';
  let worker: any | null = null;
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
  const scale = 2.5; // increased upscale for better OCR accuracy
        const viewport = page.getViewport({ scale });
        const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
        const renderContext = {
          canvasContext: canvasAndContext.context,
          viewport,
          canvasFactory,
          intent: 'display' as const,
        };
        await page.render(renderContext as any).promise;
        const imgBuffer = canvasAndContext.canvas.toBuffer('image/png');
        if (!worker) worker = await createOcrWorker();
        const t = await ocrImageBuffer(imgBuffer, worker);
        if (t) ocrText += (ocrText ? '\n' : '') + t;
        if (ocrText.length >= maxChars) break;
        canvasFactory.destroy(canvasAndContext);
      }
      if (ocrText) extracted = ocrText.replace(/\s+/g, ' ').trim();
      if (worker && typeof worker.terminate === 'function') await worker.terminate();
    } catch (e) {
      // OCR failed; leave extracted as-is
    }
  }

  return (extracted || '').slice(0, maxChars);
}
