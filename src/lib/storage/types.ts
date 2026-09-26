// Vendor-agnostic storage interface (spec §10). Domain/feature code must
// depend on this, never on a specific storage SDK directly.

export interface UploadInput {
  /** Bytes to store. */
  data: Buffer;
  /** Destination key/path within the household's storage namespace. */
  key: string;
  /** Original MIME type of the file. */
  contentType: string;
}

export interface UploadResult {
  key: string;
  sizeBytes: number;
}

export interface SignedUrlOptions {
  /** How long the signed URL should remain valid, in seconds. */
  expiresInSeconds: number;
}

export interface StorageService {
  upload(input: UploadInput): Promise<UploadResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, options: SignedUrlOptions): Promise<string>;
}
