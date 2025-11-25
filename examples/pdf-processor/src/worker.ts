import { createWorker, TaskResult, TaskError } from '@pipeweave/sdk';

// ============================================================================
// Configuration
// ============================================================================

const worker = createWorker({
  orchestratorUrl: process.env.PIPEWEAVE_ORCHESTRATOR_URL ?? 'http://localhost:3000',
  serviceId: 'pdf-processor',
  secretKey: process.env.PIPEWEAVE_SECRET_KEY ?? 'dev-secret-key',
  tempDir: '/tmp/pipeweave',
});

// ============================================================================
// Types
// ============================================================================

interface DownloadInput {
  pdfUrl: string;
  extractTables?: boolean;
}

interface ExtractTextOutput {
  text: string;
  wordCount: number;
}

interface ExtractTablesOutput {
  tables: Array<{ headers: string[]; rows: string[][] }>;
  count: number;
}

// ============================================================================
// Tasks
// ============================================================================

/**
 * Download task with programmatic next selection
 */
worker.register('download', {
  allowedNext: ['extract-text', 'extract-tables'],
  timeout: 120,
  heartbeatIntervalMs: 30000,
  idempotencyKey: (input: DownloadInput, codeVersion) => 
    `v${codeVersion}-download-${input.pdfUrl}`,
}, async (ctx): Promise<TaskResult<{ sizeBytes: number }>> => {
  const { pdfUrl, extractTables = true } = ctx.input as DownloadInput;
  
  ctx.log.info(`Downloading PDF from ${pdfUrl}`);
  ctx.log.info(`Running with code v${ctx.codeVersion} (${ctx.codeHash})`);
  
  // Check if previous attempt failed due to network
  if (ctx.previousAttempts.some(a => a.errorCode === 'NETWORK_ERROR')) {
    ctx.log.warn('Retrying after network error');
  }
  
  try {
    // Simulate download
    await ctx.progress(10, 'Starting download...');
    
    // In real implementation: const response = await fetch(pdfUrl);
    const mockPdfContent = Buffer.from('Mock PDF content for ' + pdfUrl);
    
    await ctx.progress(50, 'Download complete, saving...');
    await ctx.addAsset('pdf-file', 'binary', mockPdfContent);
    
    await ctx.progress(100, 'Done');
    
    const output = { sizeBytes: mockPdfContent.length };
    
    // Dynamically choose which tasks run next
    if (extractTables) {
      return { output, runNext: ['extract-text', 'extract-tables'] };
    } else {
      return { output, runNext: ['extract-text'] };
    }
  } catch (error: any) {
    throw new TaskError(error.message, {
      code: error.code === 'ENOTFOUND' ? 'NETWORK_ERROR' : 'DOWNLOAD_ERROR',
      retryable: error.code !== 'ENOENT',
    });
  }
});

/**
 * Extract text from PDF
 */
worker.register('extract-text', {
  allowedNext: ['summarize'],
  heartbeatIntervalMs: 60000,
}, async (ctx): Promise<ExtractTextOutput> => {
  ctx.log.info('Extracting text from PDF');
  
  const pdf = await ctx.getAsset('pdf-file') as Buffer;
  
  // In real implementation: use pdf-parse or similar
  const text = `Extracted text from PDF (${pdf.length} bytes)`;
  
  return { 
    text, 
    wordCount: text.split(/\s+/).length 
  };
});

/**
 * Extract tables from PDF
 */
worker.register('extract-tables', {
  allowedNext: ['summarize'],
  concurrency: 2, // Limit concurrent table extraction
  heartbeatIntervalMs: 60000,
}, async (ctx): Promise<ExtractTablesOutput> => {
  ctx.log.info('Extracting tables from PDF');
  
  const pdf = await ctx.getAsset('pdf-file') as Buffer;
  
  // In real implementation: use tabula-js or similar
  const tables = [
    { 
      headers: ['Column A', 'Column B'], 
      rows: [['Value 1', 'Value 2']] 
    }
  ];
  
  return { tables, count: tables.length };
});

/**
 * Summarize extracted content
 */
worker.register('summarize', {
  // No allowedNext = end of pipeline
}, async (ctx) => {
  ctx.log.info('Generating summary');
  
  const textResult = ctx.upstream['extract-text'] as ExtractTextOutput | undefined;
  const tablesResult = ctx.upstream['extract-tables'] as ExtractTablesOutput | undefined;
  
  const summary = {
    hasText: !!textResult,
    wordCount: textResult?.wordCount ?? 0,
    hasTables: !!tablesResult,
    tableCount: tablesResult?.count ?? 0,
    generatedAt: new Date().toISOString(),
  };
  
  ctx.log.info('Summary generated', summary);
  
  return summary;
});

// ============================================================================
// Start Worker
// ============================================================================

const port = parseInt(process.env.PORT ?? '8080', 10);
worker.listen(port).then(() => {
  console.log(`PDF Processor worker ready on port ${port}`);
});