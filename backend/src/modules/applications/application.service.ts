import { randomUUID } from "node:crypto";
import {
  deleteApplicationUploadDirectory,
  deleteStoredApplicationDocuments,
  storeUploadedApplicationDocuments,
  type UploadedApplicationDocument,
} from "./application-document.service.js";
import { prisma } from "../../db/prisma.js";
import { resolveAdminPortalRoleByEmail } from "../admin-portal/admin-portal.service.js";
import type {
  AccountApplicationRecord,
  CreateAccountApplicationInput,
  ResubmitAccountApplicationInput,
  ReviewAccountApplicationInput,
  UpdateAccountProfileInput,
} from "./application.types.js";

type AccountApplicationModel = {
  create: (args: unknown) => Promise<unknown>;
  findMany: (args: unknown) => Promise<unknown>;
  findFirst: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
};

type AccountApplicationDocumentModel = {
  findFirst: (args: unknown) => Promise<unknown>;
};

function normalizeOptionalString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function generateInitialAccountNumber() {
  return String(100000 + Math.floor(Math.random() * 900000));
}

async function allocateNextAccountNumber() {
  const latestAccount = await getAccountApplicationModel().findFirst({
    where: {
      accountNumber: {
        not: null,
      },
    },
    orderBy: [{ accountNumber: "desc" }],
    select: {
      accountNumber: true,
    },
  }) as { accountNumber: string | null } | null;

  if (!latestAccount?.accountNumber) {
    return generateInitialAccountNumber();
  }

  const nextValue = Number.parseInt(latestAccount.accountNumber, 10) + 1;

  if (!Number.isFinite(nextValue) || nextValue > 999999) {
    throw new Error("Unable to allocate the next account number");
  }

  return String(nextValue).padStart(6, "0");
}

function getAccountApplicationModel() {
  return (prisma as typeof prisma & { accountApplication: AccountApplicationModel }).accountApplication;
}

function getAccountApplicationDocumentModel() {
  return (prisma as typeof prisma & { accountApplicationDocument: AccountApplicationDocumentModel })
    .accountApplicationDocument;
}

function buildApplicationWriteData(
  input: CreateAccountApplicationInput | ResubmitAccountApplicationInput,
) {
  return {
    contactName: input.contactName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    businessName: input.businessName.trim(),
    businessType: input.businessType.trim(),
    companyAddress: input.companyAddress.trim(),
    city: input.city.trim(),
    stateProvince: input.stateProvince.trim(),
    zipPostalCode: input.zipPostalCode.trim(),
    country: input.country.trim(),
    website: normalizeOptionalString(input.website),
    storeMarketplaceLink: normalizeOptionalString(input.storeMarketplaceLink),
    businessModel: input.businessModel.trim(),
    salesChannels: input.salesChannels,
    physicalStoreAddress: normalizeOptionalString(input.physicalStoreAddress),
    onlineChannelNotes: normalizeOptionalString(input.onlineChannelNotes),
    productInterests: input.productInterests,
    expectedPurchaseVolume: input.expectedPurchaseVolume.trim(),
    hasResellerPermitOrTaxId: input.hasResellerPermitOrTaxId,
    uploadedDocumentNames: input.uploadedDocumentNames,
  };
}

export async function createAccountApplication(input: CreateAccountApplicationInput) {
  return createAccountApplicationWithDocuments(input, []);
}

export async function createAccountApplicationWithDocuments(
  input: CreateAccountApplicationInput,
  uploadedDocuments: UploadedApplicationDocument[],
) {
  const applicationId = randomUUID();
  const storedDocuments = await storeUploadedApplicationDocuments(applicationId, uploadedDocuments);

  try {
    const createdApplication = await getAccountApplicationModel().create({
      data: {
        id: applicationId,
        ...buildApplicationWriteData({
          ...input,
          uploadedDocumentNames: storedDocuments.length
            ? storedDocuments.map((document) => document.originalFilename)
            : input.uploadedDocumentNames,
        }),
        documents: {
          create: storedDocuments.map((document) => ({
            id: document.id,
            originalFilename: document.originalFilename,
            storedFilename: document.storedFilename,
            mimeType: document.mimeType,
            fileSizeBytes: document.fileSizeBytes,
          })),
        },
      },
      include: {
        documents: {
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });

    return createdApplication as unknown as AccountApplicationRecord;
  } catch (error) {
    await deleteApplicationUploadDirectory(applicationId);
    throw error;
  }
}

export async function fetchAccountApplications() {
  return (getAccountApplicationModel().findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      documents: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  }) as unknown) as Promise<AccountApplicationRecord[]>;
}

export async function fetchApprovedRegisteredApplicationByEmail(email: string) {
  return (getAccountApplicationModel().findFirst({
    where: {
      email: email.trim().toLowerCase(),
      status: "APPROVED",
    },
    include: {
      documents: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  }) as unknown) as Promise<AccountApplicationRecord | null>;
}

export async function updateApprovedRegisteredApplicationProfileByEmail(
  email: string,
  input: UpdateAccountProfileInput,
  uploadedDocuments: UploadedApplicationDocument[] = [],
) {
  const existingApplication = await fetchApprovedRegisteredApplicationByEmail(email);

  if (!existingApplication) {
    return null;
  }

  const shouldReplaceDocuments = uploadedDocuments.length > 0;
  const newlyStoredDocuments = shouldReplaceDocuments
    ? await storeUploadedApplicationDocuments(existingApplication.id, uploadedDocuments)
    : [];

  try {
    const updatedApplication = await getAccountApplicationModel().update({
      where: {
        id: existingApplication.id,
      },
      data: {
        contactName: input.contactName.trim(),
        phone: input.phone.trim(),
        businessName: input.businessName.trim(),
        businessType: input.businessType.trim(),
        companyAddress: input.companyAddress.trim(),
        city: input.city.trim(),
        stateProvince: input.stateProvince.trim(),
        zipPostalCode: input.zipPostalCode.trim(),
        country: input.country.trim(),
        website: normalizeOptionalString(input.website),
        storeMarketplaceLink: normalizeOptionalString(input.storeMarketplaceLink),
        businessModel: input.businessModel.trim(),
        physicalStoreAddress: normalizeOptionalString(input.physicalStoreAddress),
        onlineChannelNotes: normalizeOptionalString(input.onlineChannelNotes),
        expectedPurchaseVolume: input.expectedPurchaseVolume.trim(),
        ...(shouldReplaceDocuments
          ? {
              uploadedDocumentNames: newlyStoredDocuments.map((document) => document.originalFilename),
              documents: {
                deleteMany: {},
                create: newlyStoredDocuments.map((document) => ({
                  id: document.id,
                  originalFilename: document.originalFilename,
                  storedFilename: document.storedFilename,
                  mimeType: document.mimeType,
                  fileSizeBytes: document.fileSizeBytes,
                })),
              },
            }
          : {}),
      },
      include: {
        documents: {
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });

    if (shouldReplaceDocuments) {
      await deleteStoredApplicationDocuments(existingApplication.id, existingApplication.documents);
    }

    return updatedApplication as unknown as AccountApplicationRecord;
  } catch (error) {
    if (shouldReplaceDocuments) {
      await deleteStoredApplicationDocuments(existingApplication.id, newlyStoredDocuments);
    }

    throw error;
  }
}

export async function fetchAccountApplicationByPublicToken(publicEditToken: string) {
  return (getAccountApplicationModel().findFirst({
    where: {
      publicEditToken,
    },
    include: {
      documents: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  }) as unknown) as Promise<AccountApplicationRecord | null>;
}

export async function fetchAccountApplicationByRegistrationToken(publicRegistrationToken: string) {
  return (getAccountApplicationModel().findFirst({
    where: {
      publicRegistrationToken,
    },
    include: {
      documents: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  }) as unknown) as Promise<AccountApplicationRecord | null>;
}

export async function fetchApplicationDocumentById(documentId: string) {
  return getAccountApplicationDocumentModel().findFirst({
    where: {
      id: documentId,
    },
    include: {
      application: {
        select: {
          id: true,
        },
      },
    },
  }) as Promise<
    | {
        id: string;
        originalFilename: string;
        storedFilename: string;
        mimeType: string | null;
        fileSizeBytes: number;
        application: {
          id: string;
        };
      }
    | null
  >;
}

export async function reviewAccountApplication(
  applicationId: string,
  input: ReviewAccountApplicationInput,
) {
  const reviewerEmail = input.reviewedByEmail.trim().toLowerCase();
  const reviewerRole = await resolveAdminPortalRoleByEmail(reviewerEmail);
  const assignedSalesRepEmail =
    input.status !== "APPROVED"
      ? null
      : reviewerRole === "sales_rep"
        ? reviewerEmail
        : normalizeOptionalString(input.assignedSalesRepEmail);
  const existingApplication = await getAccountApplicationModel().findFirst({
    where: {
      id: applicationId,
    },
    include: {
      documents: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  }) as AccountApplicationRecord | null;

  if (!existingApplication) {
    throw new Error("Application not found");
  }

  const accountNumber =
    input.status === "APPROVED"
      ? existingApplication.accountNumber ?? await allocateNextAccountNumber()
      : existingApplication.accountNumber;

  return (getAccountApplicationModel().update({
    where: {
      id: applicationId,
    },
    data: {
      accountNumber,
      status: input.status,
      deniedReason: input.status === "DENIED" ? normalizeOptionalString(input.deniedReason) : null,
      reviewedByEmail: reviewerEmail,
      assignedSalesRepEmail,
      reviewedAt: new Date(),
      publicEditToken: input.status === "DENIED" ? randomUUID() : null,
      publicRegistrationToken: input.status === "APPROVED" ? randomUUID() : null,
      approvedInviteSentAt: input.status === "APPROVED" ? new Date() : null,
    },
    include: {
      documents: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  }) as unknown) as Promise<AccountApplicationRecord>;
}

export async function completeApprovedRegistration(
  publicRegistrationToken: string,
  email: string,
) {
  return (getAccountApplicationModel().update({
    where: {
      publicRegistrationToken,
    },
    data: {
      accountRegisteredAt: new Date(),
      publicRegistrationToken: null,
      email: email.trim().toLowerCase(),
    },
    include: {
      documents: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  }) as unknown) as Promise<AccountApplicationRecord>;
}

export async function resubmitAccountApplication(
  publicEditToken: string,
  input: ResubmitAccountApplicationInput,
  uploadedDocuments: UploadedApplicationDocument[] = [],
) {
  const existingApplication = await fetchAccountApplicationByPublicToken(publicEditToken);

  if (!existingApplication) {
    return null;
  }

  const shouldReplaceDocuments = uploadedDocuments.length > 0;
  const newlyStoredDocuments = shouldReplaceDocuments
    ? await storeUploadedApplicationDocuments(existingApplication.id, uploadedDocuments)
    : [];

  try {
    const updatedApplication = await getAccountApplicationModel().update({
      where: {
        publicEditToken,
      },
      data: {
        ...buildApplicationWriteData({
          ...input,
          uploadedDocumentNames: shouldReplaceDocuments
            ? newlyStoredDocuments.map((document) => document.originalFilename)
            : existingApplication.uploadedDocumentNames,
        }),
        status: "PENDING",
        deniedReason: null,
        reviewedByEmail: null,
        assignedSalesRepEmail: null,
        reviewedAt: null,
        publicEditToken: null,
        ...(shouldReplaceDocuments
          ? {
              documents: {
                deleteMany: {},
                create: newlyStoredDocuments.map((document) => ({
                  id: document.id,
                  originalFilename: document.originalFilename,
                  storedFilename: document.storedFilename,
                  mimeType: document.mimeType,
                  fileSizeBytes: document.fileSizeBytes,
                })),
              },
            }
          : {}),
      },
      include: {
        documents: {
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });

    if (shouldReplaceDocuments) {
      await deleteStoredApplicationDocuments(existingApplication.id, existingApplication.documents);
    }

    return updatedApplication as unknown as AccountApplicationRecord;
  } catch (error) {
    if (shouldReplaceDocuments) {
      await deleteStoredApplicationDocuments(existingApplication.id, newlyStoredDocuments);
    }

    throw error;
  }
}

export async function deleteAccountApplicationById(applicationId: string) {
  const existingApplication = await (getAccountApplicationModel().findFirst({
    where: {
      id: applicationId,
    },
    include: {
      documents: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  }) as unknown as Promise<AccountApplicationRecord | null>);

  if (!existingApplication) {
    return null;
  }

  await getAccountApplicationModel().delete({
    where: {
      id: applicationId,
    },
  });

  await deleteApplicationUploadDirectory(applicationId).catch(() => undefined);

  return existingApplication;
}
