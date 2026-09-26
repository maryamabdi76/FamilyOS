// Provider-agnostic AI interface (spec §11). Domain/feature code must
// depend on this, never on a specific LLM SDK directly.

export type DocumentType =
  | "RECEIPT"
  | "WARRANTY"
  | "CONTRACT"
  | "INSURANCE"
  | "REPAIR"
  | "PURCHASE"
  | "UTILITY"
  | "VEHICLE"
  | "HOME"
  | "OTHER";

export interface ClassifyDocumentInput {
  extractedText: string;
}

export interface ClassifyDocumentResult {
  documentType: DocumentType;
  confidence: number;
  usage?: TokenUsage;
}

export interface ExtractDocumentInput {
  extractedText: string;
  documentType: DocumentType;
}

/**
 * Raw extraction result before Zod validation/normalization (spec §12).
 * Callers must validate this against a Zod schema before trusting it.
 */
export type ExtractDocumentResult = Record<string, unknown>;

export interface ExtractDocumentOutput {
  raw: ExtractDocumentResult;
  usage?: TokenUsage;
}

export interface AnswerQuestionInput {
  question: string;
  /** Pre-retrieved context relevant to the question — never the whole DB (spec §16). */
  context: string[];
}

export interface AnswerQuestionResult {
  answer: string;
  sourceIds: string[];
}

export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  model: string;
}

export interface ExtractTextInput {
  mimeType: string;
  data: Buffer;
}

export interface ExtractTextResult {
  text: string;
  usage?: TokenUsage;
}

export interface AIService {
  extractTextFromDocument(input: ExtractTextInput): Promise<ExtractTextResult>;
  classifyDocument(input: ClassifyDocumentInput): Promise<ClassifyDocumentResult>;
  extractDocument(input: ExtractDocumentInput): Promise<ExtractDocumentOutput>;
  answerQuestion(input: AnswerQuestionInput): Promise<AnswerQuestionResult>;
  generateEmbedding(text: string): Promise<number[]>;
}
