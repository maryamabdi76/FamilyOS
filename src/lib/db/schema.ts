import {
  bigint,
  date,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  index,
} from "drizzle-orm/pg-core";

export const householdRoleEnum = pgEnum("household_role", ["OWNER", "MEMBER"]);

export const documentStatusEnum = pgEnum("document_status", [
  "UPLOADED",
  "PROCESSING",
  "READY",
  "FAILED",
]);

export const documentTypeEnum = pgEnum("document_type", [
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
]);

export const aiJobStatusEnum = pgEnum("ai_job_status", [
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
]);

export const aiUsageOperationEnum = pgEnum("ai_usage_operation", [
  "ocr",
  "classify",
  "extract",
]);

export const currencyEnum = pgEnum("currency_code", ["IRR", "IRT"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const householdMembers = pgTable(
  "household_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: householdRoleEnum("role").notNull().default("MEMBER"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueMembership: uniqueIndex("household_members_household_user_idx").on(table.householdId, table.userId),
  }),
);

export const people = pgTable("people", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  relationship: text("relationship"),
  avatarUrl: text("avatar_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    storageKey: text("storage_key").notNull().unique(),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
    status: documentStatusEnum("status").notNull().default("UPLOADED"),
    documentType: documentTypeEnum("document_type"),
    extractedText: text("extracted_text"),
    extractedMetadata: text("extracted_metadata"),
    processingError: text("processing_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    householdCreatedIndex: index("documents_household_created_idx").on(table.householdId, table.createdAt),
    householdStatusIndex: index("documents_household_status_idx").on(table.householdId, table.status),
  }),
);

export const aiProcessingJobs = pgTable(
  "ai_processing_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    status: aiJobStatusEnum("status").notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lastError: text("last_error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    documentCreatedIndex: index("ai_jobs_document_created_idx").on(table.documentId, table.createdAt),
    statusCreatedIndex: index("ai_jobs_status_created_idx").on(table.status, table.createdAt),
  }),
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    householdNormalizedUnique: uniqueIndex("products_household_normalized_idx").on(
      table.householdId,
      table.normalizedName,
    ),
  }),
);

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sourceDocumentId: uuid("source_document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    purchasedAt: date("purchased_at"),
    amount: bigint("amount", { mode: "number" }),
    currency: currencyEnum("currency"),
    seller: text("seller"),
    confidence: doublePrecision("confidence"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sourceDocumentUnique: uniqueIndex("purchases_source_document_idx").on(table.sourceDocumentId),
  }),
);

export const warranties = pgTable(
  "warranties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sourceDocumentId: uuid("source_document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    durationMonths: integer("duration_months"),
    expiresAt: date("expires_at"),
    confidence: doublePrecision("confidence"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sourceDocumentUnique: uniqueIndex("warranties_source_document_idx").on(table.sourceDocumentId),
  }),
);

export const aiUsageEvents = pgTable(
  "ai_usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
    operation: aiUsageOperationEnum("operation").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    householdCreatedIndex: index("ai_usage_household_created_idx").on(table.householdId, table.createdAt),
  }),
);
