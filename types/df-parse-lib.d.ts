declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PDFInfo {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }
  function pdfParse(dataBuffer: Buffer, options?: any): Promise<PDFInfo>;
  export default pdfParse;
}
