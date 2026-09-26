import "server-only";
import { createClient } from "@supabase/supabase-js";
import type {
  SignedUrlOptions,
  StorageService,
  UploadInput,
  UploadResult,
} from "./types";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. Copy .env.example to .env.local and fill it in.",
    );
  }

  // Service-role key: server-side only, never sent to the client (spec §26).
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export const supabaseStorageService: StorageService = {
  async upload({ data, key, contentType }: UploadInput): Promise<UploadResult> {
    const client = getClient();
    const { error } = await client.storage
      .from(BUCKET)
      .upload(key, data, { contentType, upsert: false });

    if (error) {
      throw new Error(`Storage upload failed for key "${key}": ${error.message}`);
    }

    return { key, sizeBytes: data.byteLength };
  },

  async download(key: string): Promise<Buffer> {
    const client = getClient();
    const { data, error } = await client.storage.from(BUCKET).download(key);

    if (error || !data) {
      throw new Error(`Storage download failed for key "${key}": ${error?.message ?? "no data"}`);
    }

    return Buffer.from(await data.arrayBuffer());
  },

  async delete(key: string): Promise<void> {
    const client = getClient();
    const { error } = await client.storage.from(BUCKET).remove([key]);

    if (error) {
      throw new Error(`Storage delete failed for key "${key}": ${error.message}`);
    }
  },

  async getSignedUrl(key: string, { expiresInSeconds }: SignedUrlOptions): Promise<string> {
    const client = getClient();
    const { data, error } = await client.storage
      .from(BUCKET)
      .createSignedUrl(key, expiresInSeconds);

    if (error || !data) {
      throw new Error(`Signed URL failed for key "${key}": ${error?.message ?? "no data"}`);
    }

    return data.signedUrl;
  },
};
