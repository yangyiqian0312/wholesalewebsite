import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export type UploadedApplicationDocument = {
  originalFilename: string;
  mimeType: string | null;
  buffer: Buffer;
  fileSizeBytes: number;
};

export type StoredApplicationDocument = {
  id: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string | null;
  fileSizeBytes: number;
};

const uploadsRoot = path.resolve(process.cwd(), "uploads", "account-applications");

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getApplicationUploadDir(applicationId: string) {
  return path.join(uploadsRoot, applicationId);
}

export function getStoredApplicationDocumentPath(applicationId: string, storedFilename: string) {
  return path.join(getApplicationUploadDir(applicationId), storedFilename);
}

export function createStoredApplicationDocumentReadStream(applicationId: string, storedFilename: string) {
  return createReadStream(getStoredApplicationDocumentPath(applicationId, storedFilename));
}

export async function storeUploadedApplicationDocuments(
  applicationId: string,
  documents: UploadedApplicationDocument[],
) {
  if (!documents.length) {
    return [] as StoredApplicationDocument[];
  }

  const uploadDir = getApplicationUploadDir(applicationId);
  await mkdir(uploadDir, { recursive: true });

  const storedDocuments: StoredApplicationDocument[] = [];

  for (const document of documents) {
    const documentId = randomUUID();
    const safeFilename = sanitizeFilename(document.originalFilename || "document");
    const storedFilename = `${documentId}-${safeFilename}`;

    await writeFile(path.join(uploadDir, storedFilename), document.buffer);

    storedDocuments.push({
      id: documentId,
      originalFilename: document.originalFilename || safeFilename,
      storedFilename,
      mimeType: document.mimeType,
      fileSizeBytes: document.fileSizeBytes,
    });
  }

  return storedDocuments;
}

export async function deleteStoredApplicationDocuments(
  applicationId: string,
  storedDocuments: Array<{ storedFilename: string }>,
) {
  await Promise.all(
    storedDocuments.map((document) =>
      unlink(getStoredApplicationDocumentPath(applicationId, document.storedFilename)).catch(() => undefined),
    ),
  );
}

export async function deleteApplicationUploadDirectory(applicationId: string) {
  await rm(getApplicationUploadDir(applicationId), { recursive: true, force: true });
}
