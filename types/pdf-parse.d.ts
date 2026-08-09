// Minimal type declaration for pdf-parse, which ships without TypeScript types.
declare module "pdf-parse" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
  }

  function pdfParse(buffer: Buffer, options?: Record<string, unknown>): Promise<PdfParseResult>;

  export default pdfParse;
}
