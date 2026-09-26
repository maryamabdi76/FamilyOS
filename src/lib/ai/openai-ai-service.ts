import "server-only";
import OpenAI from "openai";
import type {
  AIService,
  AnswerQuestionInput,
  AnswerQuestionResult,
  ClassifyDocumentInput,
  ClassifyDocumentResult,
  DocumentType,
  ExtractDocumentInput,
  ExtractDocumentOutput,
  ExtractTextInput,
  ExtractTextResult,
  TokenUsage,
} from "./types";

const DOCUMENT_TYPES: DocumentType[] = [
  "RECEIPT",
  "WARRANTY",
  "CONTRACT",
  "INSURANCE",
  "REPAIR",
  "PURCHASE",
  "UTILITY",
  "VEHICLE",
  "HOME",
  "OTHER",
];

function getModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o";
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  return new OpenAI({ apiKey });
}

function toUsage(response: { usage?: { prompt_tokens?: number; completion_tokens?: number } | null }, model: string): TokenUsage {
  return {
    model,
    inputTokens: response.usage?.prompt_tokens,
    outputTokens: response.usage?.completion_tokens,
  };
}

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI response was not a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

function mimeToDataUrl(mimeType: string, data: Buffer): string {
  return `data:${mimeType};base64,${data.toString("base64")}`;
}

export function createOpenAIService(): AIService {
  const model = getModel();

  return {
    async extractTextFromDocument({ mimeType, data }: ExtractTextInput): Promise<ExtractTextResult> {
      if (mimeType === "text/plain") {
        return { text: data.toString("utf8") };
      }

      const client = getClient();
      const isPdf = mimeType === "application/pdf";
      const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = isPdf
        ? [
            {
              type: "file",
              file: {
                filename: "document.pdf",
                file_data: mimeToDataUrl(mimeType, data),
              },
            },
            {
              type: "text",
              text: "Extract all readable text from this document. Preserve numbers, dates, product names, and amounts. Return plain text only, no markdown.",
            },
          ]
        : [
            {
              type: "image_url",
              image_url: { url: mimeToDataUrl(mimeType, data) },
            },
            {
              type: "text",
              text: "Extract all readable text from this image (OCR). Preserve numbers, dates, product names, and amounts. Return plain text only, no markdown.",
            },
          ];

      try {
        const response = await client.chat.completions.create({
          model,
          temperature: 0,
          messages: [
            {
              role: "system",
              content:
                "You are an OCR assistant for a Persian family document app. Extract text accurately. Do not invent content that is not visible.",
            },
            { role: "user", content: userContent },
          ],
        });

        const text = response.choices[0]?.message?.content?.trim() ?? "";
        if (!text) {
          throw new Error("OCR returned empty text.");
        }
        return { text, usage: toUsage(response, model) };
      } catch (error) {
        // PDF file parts are not supported on all models/accounts — fall back to a text note.
        if (isPdf) {
          throw new Error(
            error instanceof Error
              ? `PDF text extraction failed: ${error.message}`
              : "PDF text extraction failed.",
          );
        }
        throw error;
      }
    },

    async classifyDocument({ extractedText }: ClassifyDocumentInput): Promise<ClassifyDocumentResult> {
      const client = getClient();
      const response = await client.chat.completions.create({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Classify the document into exactly one type from: ${DOCUMENT_TYPES.join(", ")}.
Return JSON: {"documentType":"...","confidence":0.0-1.0}
Use OTHER when confidence is low. Never invent a forced type.`,
          },
          {
            role: "user",
            content: extractedText.slice(0, 12_000),
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Classification returned empty content.");
      }
      const parsed = parseJsonObject(content);
      const documentType = String(parsed.documentType ?? "OTHER").toUpperCase() as DocumentType;
      const confidence = typeof parsed.confidence === "number" ? parsed.confidence : Number(parsed.confidence);
      return {
        documentType: DOCUMENT_TYPES.includes(documentType) ? documentType : "OTHER",
        confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0,
        usage: toUsage(response, model),
      };
    },

    async extractDocument({ extractedText, documentType }: ExtractDocumentInput): Promise<ExtractDocumentOutput> {
      const client = getClient();
      const response = await client.chat.completions.create({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Extract structured life-admin data from a ${documentType} document for an Iranian family app.
Return JSON with this shape:
{
  "documentType": "${documentType}",
  "confidence": 0.0-1.0,
  "entities": {
    "product": { "name": "string" },
    "purchase": { "date": "YYYY-MM-DD or Jalali YYYY-MM-DD", "price": number, "currency": "IRR"|"IRT", "seller": "string" },
    "warranty": { "durationMonths": number, "expiresAt": "YYYY-MM-DD or Jalali YYYY-MM-DD" }
  }
}
Omit unknown fields. Prefer IRR (rials) for Iranian currency. price must be a number without separators.
Do not invent values that are not supported by the text.`,
          },
          {
            role: "user",
            content: extractedText.slice(0, 12_000),
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Extraction returned empty content.");
      }
      return {
        raw: parseJsonObject(content),
        usage: toUsage(response, model),
      };
    },

    async answerQuestion(_input: AnswerQuestionInput): Promise<AnswerQuestionResult> {
      throw new Error("answerQuestion is not implemented until Phase 5.");
    },

    async generateEmbedding(_text: string): Promise<number[]> {
      throw new Error("generateEmbedding is not implemented until vector search is needed.");
    },
  };
}
