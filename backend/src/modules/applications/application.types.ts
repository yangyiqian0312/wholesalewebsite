import { z } from "zod";

export const applicationStatusSchema = z.enum(["PENDING", "APPROVED", "DENIED"]);

export const createAccountApplicationSchema = z.object({
  contactName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  businessName: z.string().trim().min(1),
  businessType: z.string().trim().min(1),
  companyAddress: z.string().trim().min(1),
  city: z.string().trim().min(1),
  stateProvince: z.string().trim().min(1),
  zipPostalCode: z.string().trim().min(1),
  country: z.string().trim().min(1),
  website: z.string().trim().optional().or(z.literal("")),
  storeMarketplaceLink: z.string().trim().optional().or(z.literal("")),
  businessModel: z.string().trim().min(1),
  salesChannels: z.array(z.string().trim().min(1)).default([]),
  physicalStoreAddress: z.string().trim().optional().or(z.literal("")),
  onlineChannelNotes: z.string().trim().optional().or(z.literal("")),
  productInterests: z.array(z.string().trim().min(1)).default([]),
  expectedPurchaseVolume: z.string().trim().min(1),
  hasResellerPermitOrTaxId: z.boolean(),
  uploadedDocumentNames: z.array(z.string().trim().min(1)).default([]),
});

export const reviewAccountApplicationSchema = z.object({
  status: z.enum(["APPROVED", "DENIED"]),
  deniedReason: z.string().trim().optional().or(z.literal("")),
  reviewedByEmail: z.string().trim().email(),
  assignedSalesRepEmail: z.string().trim().email().nullable().optional().or(z.literal("")),
});

export const updateAccountProfileSchema = z.object({
  contactName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  businessName: z.string().trim().min(1),
  businessType: z.string().trim().min(1),
  companyAddress: z.string().trim().min(1),
  city: z.string().trim().min(1),
  stateProvince: z.string().trim().min(1),
  zipPostalCode: z.string().trim().min(1),
  country: z.string().trim().min(1),
  website: z.string().trim().optional().or(z.literal("")),
  storeMarketplaceLink: z.string().trim().optional().or(z.literal("")),
  businessModel: z.string().trim().min(1),
  salesChannels: z.array(z.string().trim().min(1)).default([]),
  physicalStoreAddress: z.string().trim().optional().or(z.literal("")),
  onlineChannelNotes: z.string().trim().optional().or(z.literal("")),
  productInterests: z.array(z.string().trim().min(1)).default([]),
  expectedPurchaseVolume: z.string().trim().min(1),
  hasResellerPermitOrTaxId: z.boolean(),
});

export type CreateAccountApplicationInput = z.infer<typeof createAccountApplicationSchema>;
export type ReviewAccountApplicationInput = z.infer<typeof reviewAccountApplicationSchema>;
export type ResubmitAccountApplicationInput = CreateAccountApplicationInput;
export type UpdateAccountProfileInput = z.infer<typeof updateAccountProfileSchema>;

export type AccountApplicationDocumentRecord = {
  id: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string | null;
  fileSizeBytes: number;
  createdAt: Date;
};

export type AccountApplicationRecord = {
  id: string;
  accountNumber: string | null;
  publicEditToken: string | null;
  publicRegistrationToken: string | null;
  contactName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  companyAddress: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country: string;
  website: string | null;
  storeMarketplaceLink: string | null;
  businessModel: string;
  salesChannels: string[];
  physicalStoreAddress: string | null;
  onlineChannelNotes: string | null;
  productInterests: string[];
  expectedPurchaseVolume: string;
  hasResellerPermitOrTaxId: boolean;
  uploadedDocumentNames: string[];
  documents: AccountApplicationDocumentRecord[];
  status: "PENDING" | "APPROVED" | "DENIED";
  deniedReason: string | null;
  reviewedByEmail: string | null;
  reviewedAt: Date | null;
  approvedInviteSentAt: Date | null;
  accountRegisteredAt: Date | null;
  assignedSalesRepEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
};
