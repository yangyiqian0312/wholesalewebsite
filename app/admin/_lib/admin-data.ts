import { getAdminApiToken, getBackendBaseUrl } from "../../../utils/backend-api";

export type ApplicationStatus = "PENDING" | "APPROVED" | "DENIED";

export type AccountApplication = {
  id: string;
  publicEditToken: string | null;
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
  documents: Array<{
    id: string;
    originalFilename: string;
    mimeType: string | null;
    fileSizeBytes: number;
    createdAt: string;
  }>;
  status: ApplicationStatus;
  deniedReason: string | null;
  reviewedByEmail: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type AdminListing = {
  productId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  upc: string | null;
  totalQuantityOnHand: string;
  isActive: boolean;
  lastModifiedDateTime?: string | null;
  defaultPrice?: {
    unitPrice?: string;
  };
};

export type AdminOrderLine = {
  id: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  createdAt: string;
};

export type AdminOrder = {
  id: string;
  applicationId: string;
  customerEmail: string;
  customerName: string;
  businessName: string;
  inflowSalesOrderId: string | null;
  inflowOrderNumber: string | null;
  source: string;
  subtotalAmount: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  lines: AdminOrderLine[];
};

type AdminListingsResponse = {
  items: AdminListing[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  summary: {
    totalListings: number;
    activeListings: number;
    outOfStockListings: number;
  };
};

export async function fetchAdminApplications() {
  const response = await fetch(`${getBackendBaseUrl()}/api/admin/account-applications`, {
    headers: {
      "x-admin-token": getAdminApiToken(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load admin applications: ${response.status}`);
  }

  return (await response.json()) as AccountApplication[];
}

export async function fetchAdminApplicationById(applicationId: string) {
  const applications = await fetchAdminApplications();
  return applications.find((application) => application.id === applicationId) ?? null;
}

export async function fetchAdminListings({
  smart,
  listingStatus,
  page,
}: {
  smart?: string;
  listingStatus?: "active" | "oos";
  page?: number;
} = {}) {
  const query = new URLSearchParams({
    inStockOnly: "false",
    page: String(page ?? 1),
    pageSize: "24",
  });

  if (smart?.trim()) {
    query.set("smart", smart.trim());
  }

  if (listingStatus) {
    query.set("listingStatus", listingStatus);
  }

  const response = await fetch(
    `${getBackendBaseUrl()}/api/catalog/products?${query.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load admin listings: ${response.status}`);
  }

  const payload = (await response.json()) as AdminListingsResponse;
  return payload;
}

export async function fetchAdminOrders() {
  const response = await fetch(`${getBackendBaseUrl()}/api/admin/orders`, {
    headers: {
      "x-admin-token": getAdminApiToken(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load admin orders: ${response.status}`);
  }

  return (await response.json()) as AdminOrder[];
}

export async function fetchAdminOrderById(orderId: string) {
  const response = await fetch(`${getBackendBaseUrl()}/api/admin/orders/${orderId}`, {
    headers: {
      "x-admin-token": getAdminApiToken(),
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load admin order detail: ${response.status}`);
  }

  return (await response.json()) as AdminOrder;
}

export async function fetchAdminOrdersByApplicationId(applicationId: string) {
  const orders = await fetchAdminOrders();
  return orders.filter((order) => order.applicationId === applicationId);
}

export function formatAdminDate(value: string | null) {
  if (!value) {
    return "Not reviewed";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
