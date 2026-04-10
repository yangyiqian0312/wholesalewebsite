import type { FastifyInstance, FastifyRequest } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import { z } from "zod";
import { config } from "../../config.js";
import { createStoredApplicationDocumentReadStream } from "./application-document.service.js";
import {
  sendApprovedApplicationEmail,
  sendDeniedApplicationEmail,
} from "../notifications/email.service.js";
import {
  completeApprovedRegistration,
  createAccountApplication,
  createAccountApplicationWithDocuments,
  deleteAccountApplicationById,
  fetchAccountApplicationByPublicToken,
  fetchAccountApplicationByRegistrationToken,
  fetchApprovedRegisteredApplicationByEmail,
  fetchApplicationDocumentById,
  fetchAccountApplications,
  reviewAccountApplication,
  resubmitAccountApplication,
  updateApprovedRegisteredApplicationProfileByEmail,
} from "./application.service.js";
import {
  createAccountApplicationSchema,
  reviewAccountApplicationSchema,
  updateAccountProfileSchema,
} from "./application.types.js";

async function parseApplicationMultipartRequest(request: FastifyRequest) {
  if (!request.isMultipart()) {
    const parsedBody = createAccountApplicationSchema.safeParse(request.body);

    return {
      parsedBody,
      uploadedDocuments: [] as Array<{
        originalFilename: string;
        mimeType: string | null;
        buffer: Buffer;
        fileSizeBytes: number;
      }>,
    };
  }

  const uploadedDocuments: Array<{
    originalFilename: string;
    mimeType: string | null;
    buffer: Buffer;
    fileSizeBytes: number;
  }> = [];
  let payloadText = "";

  for await (const part of request.parts()) {
    if (part.type === "file") {
      const filePart = part as MultipartFile;

      if (!filePart.filename) {
        continue;
      }

      const buffer = await filePart.toBuffer();

      if (!buffer.length) {
        continue;
      }

      uploadedDocuments.push({
        originalFilename: filePart.filename,
        mimeType: filePart.mimetype ?? null,
        buffer,
        fileSizeBytes: buffer.length,
      });

      continue;
    }

    if (part.fieldname === "payload" && typeof part.value === "string") {
      payloadText = part.value;
    }
  }

  let payload: unknown;

  try {
    payload = payloadText ? JSON.parse(payloadText) : undefined;
  } catch {
    payload = undefined;
  }

  return {
    parsedBody: createAccountApplicationSchema.safeParse(payload),
    uploadedDocuments,
  };
}

async function parseProfileMultipartRequest(request: FastifyRequest) {
  if (!request.isMultipart()) {
    const parsedBody = z.object({
      email: z.string().trim().email(),
      profile: updateAccountProfileSchema,
    }).safeParse(request.body);

    return {
      parsedBody,
      uploadedDocuments: [] as Array<{
        originalFilename: string;
        mimeType: string | null;
        buffer: Buffer;
        fileSizeBytes: number;
      }>,
    };
  }

  const uploadedDocuments: Array<{
    originalFilename: string;
    mimeType: string | null;
    buffer: Buffer;
    fileSizeBytes: number;
  }> = [];
  let payloadText = "";

  for await (const part of request.parts()) {
    if (part.type === "file") {
      const filePart = part as MultipartFile;

      if (!filePart.filename) {
        continue;
      }

      const buffer = await filePart.toBuffer();

      if (!buffer.length) {
        continue;
      }

      uploadedDocuments.push({
        originalFilename: filePart.filename,
        mimeType: filePart.mimetype ?? null,
        buffer,
        fileSizeBytes: buffer.length,
      });

      continue;
    }

    if (part.fieldname === "payload" && typeof part.value === "string") {
      payloadText = part.value;
    }
  }

  let payload: unknown;

  try {
    payload = payloadText ? JSON.parse(payloadText) : undefined;
  } catch {
    payload = undefined;
  }

  return {
    parsedBody: z.object({
      email: z.string().trim().email(),
      profile: updateAccountProfileSchema,
    }).safeParse(payload),
    uploadedDocuments,
  };
}

function isAuthorizedAdminRequest(request: FastifyRequest) {
  const token = request.headers["x-admin-token"];
  return typeof token === "string" && token === config.ADMIN_API_TOKEN;
}

export async function registerApplicationRoutes(app: FastifyInstance) {
  app.get("/api/admin/account-applications/profile", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const email = z.string().trim().email().safeParse((request.query as { email?: string }).email);

    if (!email.success) {
      return reply.status(400).send({
        error: "Invalid email",
      });
    }

    try {
      const application = await fetchApprovedRegisteredApplicationByEmail(email.data);

      if (!application) {
        return reply.status(404).send({
          error: "Profile not found",
        });
      }

      return reply.send(application);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to fetch account profile",
      });
    }
  });

  app.patch("/api/admin/account-applications/profile", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const { parsedBody, uploadedDocuments } = await parseProfileMultipartRequest(request);

    if (!parsedBody.success) {
      return reply.status(400).send({
        error: "Invalid account profile payload",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const application = await updateApprovedRegisteredApplicationProfileByEmail(
        parsedBody.data.email,
        parsedBody.data.profile,
        uploadedDocuments,
      );

      if (!application) {
        return reply.status(404).send({
          error: "Profile not found",
        });
      }

      return reply.send(application);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to update account profile",
      });
    }
  });

  app.post("/api/account-applications", async (request, reply) => {
    const { parsedBody, uploadedDocuments } = await parseApplicationMultipartRequest(request);

    if (!parsedBody.success) {
      return reply.status(400).send({
        error: "Invalid application payload",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const application = uploadedDocuments.length
        ? await createAccountApplicationWithDocuments(parsedBody.data, uploadedDocuments)
        : await createAccountApplication(parsedBody.data);
      return reply.status(201).send(application);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to create account application",
      });
    }
  });

  app.get("/api/account-applications/edit/:publicEditToken", async (request, reply) => {
    const publicEditToken = z.string().uuid().safeParse(
      (request.params as { publicEditToken?: string }).publicEditToken,
    );

    if (!publicEditToken.success) {
      return reply.status(400).send({
        error: "Invalid public edit token",
      });
    }

    try {
      const application = await fetchAccountApplicationByPublicToken(publicEditToken.data);

      if (!application || application.status !== "DENIED") {
        return reply.status(404).send({
          error: "Application not available for editing",
        });
      }

      return reply.send(application);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to fetch editable application",
      });
    }
  });

  app.get("/api/account-applications/register/:publicRegistrationToken", async (request, reply) => {
    const publicRegistrationToken = z.string().uuid().safeParse(
      (request.params as { publicRegistrationToken?: string }).publicRegistrationToken,
    );

    if (!publicRegistrationToken.success) {
      return reply.status(400).send({
        error: "Invalid registration token",
      });
    }

    try {
      const application = await fetchAccountApplicationByRegistrationToken(publicRegistrationToken.data);

      if (!application || application.status !== "APPROVED" || application.accountRegisteredAt) {
        return reply.status(404).send({
          error: "Registration link is not available",
        });
      }

      return reply.send({
        contactName: application.contactName,
        businessName: application.businessName,
        email: application.email,
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to fetch registration invitation",
      });
    }
  });

  app.post("/api/account-applications/register/:publicRegistrationToken/complete", async (request, reply) => {
    const publicRegistrationToken = z.string().uuid().safeParse(
      (request.params as { publicRegistrationToken?: string }).publicRegistrationToken,
    );

    if (!publicRegistrationToken.success) {
      return reply.status(400).send({
        error: "Invalid registration token",
      });
    }

    const parsedBody = z.object({
      email: z.string().trim().email(),
    }).safeParse(request.body);

    if (!parsedBody.success) {
      return reply.status(400).send({
        error: "Invalid registration completion payload",
      });
    }

    try {
      const application = await fetchAccountApplicationByRegistrationToken(publicRegistrationToken.data);

      if (!application || application.status !== "APPROVED" || application.accountRegisteredAt) {
        return reply.status(404).send({
          error: "Registration link is not available",
        });
      }

      if (application.email.trim().toLowerCase() !== parsedBody.data.email.trim().toLowerCase()) {
        return reply.status(400).send({
          error: "Registration email must match the approved application email",
        });
      }

      const completedApplication = await completeApprovedRegistration(
        publicRegistrationToken.data,
        parsedBody.data.email,
      );

      return reply.send({
        id: completedApplication.id,
        email: completedApplication.email,
        accountRegisteredAt: completedApplication.accountRegisteredAt,
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to complete approved registration",
      });
    }
  });

  app.put("/api/account-applications/edit/:publicEditToken", async (request, reply) => {
    const publicEditToken = z.string().uuid().safeParse(
      (request.params as { publicEditToken?: string }).publicEditToken,
    );

    if (!publicEditToken.success) {
      return reply.status(400).send({
        error: "Invalid public edit token",
      });
    }

    const { parsedBody, uploadedDocuments } = await parseApplicationMultipartRequest(request);

    if (!parsedBody.success) {
      return reply.status(400).send({
        error: "Invalid resubmission payload",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const existingApplication = await fetchAccountApplicationByPublicToken(publicEditToken.data);

      if (!existingApplication || existingApplication.status !== "DENIED") {
        return reply.status(404).send({
          error: "Application not available for resubmission",
        });
      }

      const application = await resubmitAccountApplication(
        publicEditToken.data,
        parsedBody.data,
        uploadedDocuments,
      );
      return reply.send(application);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to resubmit account application",
      });
    }
  });

  app.get("/api/admin/account-applications", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    try {
      const applications = await fetchAccountApplications();
      return reply.send(applications);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to fetch account applications",
      });
    }
  });

  app.get("/api/admin/account-application-documents/:documentId/download", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const documentId = z.string().min(1).safeParse(
      (request.params as { documentId?: string }).documentId,
    );

    if (!documentId.success) {
      return reply.status(400).send({
        error: "Invalid document id",
      });
    }

    try {
      const documentRecord = await fetchApplicationDocumentById(documentId.data);

      if (!documentRecord) {
        return reply.status(404).send({
          error: "Document not found",
        });
      }

      reply.header(
        "Content-Type",
        documentRecord.mimeType || "application/octet-stream",
      );
      reply.header(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(documentRecord.originalFilename)}"`,
      );

      return reply.send(
        createStoredApplicationDocumentReadStream(
          documentRecord.application.id,
          documentRecord.storedFilename,
        ),
      );
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to download document",
      });
    }
  });

  app.patch("/api/admin/account-applications/:applicationId", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const applicationId = z.string().min(1).safeParse(
      (request.params as { applicationId?: string }).applicationId,
    );

    if (!applicationId.success) {
      return reply.status(400).send({
        error: "Invalid application id",
      });
    }

    const parsedBody = reviewAccountApplicationSchema.superRefine((value, context) => {
      if (value.status === "DENIED" && !value.deniedReason?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deniedReason"],
          message: "Denied applications require a denial reason",
        });
      }
    }).safeParse(request.body);

    if (!parsedBody.success) {
      return reply.status(400).send({
        error: "Invalid review payload",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const application = await reviewAccountApplication(applicationId.data, parsedBody.data);
      let emailNotification:
        | {
            sent: true;
          }
        | {
            sent: false;
            reason: string;
          }
        | null = null;

      if (
        parsedBody.data.status === "DENIED" &&
        application.publicEditToken &&
        application.deniedReason
      ) {
        try {
          const result = await sendDeniedApplicationEmail({
            to: application.email,
            contactName: application.contactName,
            businessName: application.businessName,
            deniedReason: application.deniedReason,
            resubmissionLink: `${config.APP_BASE_URL}/open-account?token=${application.publicEditToken}`,
          });

          emailNotification = result;

          if (result.sent) {
            request.log.info(
              {
                applicationId: application.id,
                applicantEmail: application.email,
              },
              "Denied application email sent.",
            );
          } else {
            request.log.warn(
              {
                applicationId: application.id,
                applicantEmail: application.email,
                reason: result.reason,
              },
              "Denied application email skipped.",
            );
          }
        } catch (emailError) {
          const reason =
            emailError instanceof Error ? emailError.message : "Unknown email delivery error";

          emailNotification = {
            sent: false,
            reason,
          };

          request.log.error(
            {
              error: emailError,
              applicationId: application.id,
              applicantEmail: application.email,
            },
            "Denied application email failed.",
          );
        }
      }

      if (
        parsedBody.data.status === "APPROVED" &&
        application.publicRegistrationToken
      ) {
        try {
          const result = await sendApprovedApplicationEmail({
            to: application.email,
            contactName: application.contactName,
            businessName: application.businessName,
            registrationLink: `${config.APP_BASE_URL}/register?token=${application.publicRegistrationToken}`,
          });

          emailNotification = result;

          if (result.sent) {
            request.log.info(
              {
                applicationId: application.id,
                applicantEmail: application.email,
              },
              "Approved application email sent.",
            );
          } else {
            request.log.warn(
              {
                applicationId: application.id,
                applicantEmail: application.email,
                reason: result.reason,
              },
              "Approved application email skipped.",
            );
          }
        } catch (emailError) {
          const reason =
            emailError instanceof Error ? emailError.message : "Unknown email delivery error";

          emailNotification = {
            sent: false,
            reason,
          };

          request.log.error(
            {
              error: emailError,
              applicationId: application.id,
              applicantEmail: application.email,
            },
            "Approved application email failed.",
          );
        }
      }

      return reply.send({
        ...application,
        emailNotification,
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to review account application",
      });
    }
  });

  app.delete("/api/admin/account-applications/:applicationId", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const applicationId = z.string().min(1).safeParse(
      (request.params as { applicationId?: string }).applicationId,
    );

    if (!applicationId.success) {
      return reply.status(400).send({
        error: "Invalid application id",
      });
    }

    try {
      const application = await deleteAccountApplicationById(applicationId.data);

      if (!application) {
        return reply.status(404).send({
          error: "Application not found",
        });
      }

      return reply.send({
        id: application.id,
        email: application.email,
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to delete account application",
      });
    }
  });
}
