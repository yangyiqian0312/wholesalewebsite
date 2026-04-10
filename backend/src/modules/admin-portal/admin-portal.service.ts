import { prisma } from "../../db/prisma.js";

export type AdminPortalRole = "admin" | "sales_rep";

type AdminPortalUserRecord = {
  id: string;
  email: string;
  role: AdminPortalRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type AdminPortalUserModel = {
  findMany: (args: unknown) => Promise<unknown>;
  findFirst: (args: unknown) => Promise<unknown>;
};

function getAdminPortalUserModel() {
  return (prisma as typeof prisma & { adminPortalUser: AdminPortalUserModel }).adminPortalUser;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function fetchAdminPortalUsers(role?: AdminPortalRole) {
  return (getAdminPortalUserModel().findMany({
    where: {
      isActive: true,
      ...(role ? { role } : {}),
    },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  }) as unknown) as Promise<AdminPortalUserRecord[]>;
}

export async function resolveAdminPortalRoleByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const portalUser = await (getAdminPortalUserModel().findFirst({
    where: {
      email: normalizedEmail,
      isActive: true,
    },
  }) as unknown as Promise<AdminPortalUserRecord | null>);

  return portalUser?.role ?? null;
}
