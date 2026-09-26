import {
  bigint,
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
