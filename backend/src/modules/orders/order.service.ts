import { randomUUID } from "node:crypto";
import { prisma } from "../../db/prisma.js";
import { fetchApprovedRegisteredApplicationByEmail } from "../applications/application.service.js";
import { resolveAdminPortalRoleByEmail } from "../admin-portal/admin-portal.service.js";
import { inflowRequest } from "../../integrations/inflow/client.js";

type SubmitOrderItemInput = {
  productId: string;
  quantity: number;
  unitPrice: string;
  originalUnitPrice?: string;
  productName?: string;
  productCode?: string;
};

type ApproveOrderLineInput = {
  id: string;
  quantity: number;
  unitPrice: string;
};

type ApproveOrderAdjustmentInput = {
  label: string;
  amount: string;
};

type InflowCustomer = {
  customerId: string;
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
};

type SubmitOrderResult = {
  salesOrderId?: string;
  orderNumber?: string;
};

type InflowCustomerApplication = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  companyAddress: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country: string;
};

type WholesaleOrderStatus = "SUBMITTED" | "APPROVED" | "PAID" | "CANCELLED";

type WholesaleOrderLineRecord = {
  id: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  quantity: number;
  originalUnitPrice: string | null;
  unitPrice: string;
  discountPercent: string | null;
  lineTotal: string;
  createdAt: Date;
};

type WholesaleOrderAdjustmentRecord = {
  id: string;
  label: string;
  amount: string;
  createdAt: Date;
};

type WholesaleOrderRecord = {
  id: string;
  applicationId: string;
  customerEmail: string;
  customerName: string;
  businessName: string;
  status: WholesaleOrderStatus;
  approvedByEmail: string | null;
  approvedAt: Date | null;
  inflowSalesOrderId: string | null;
  inflowOrderNumber: string | null;
  source: string;
  subtotalAmount: string;
  totalAmount: string;
  salesRepNote: string | null;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lines: WholesaleOrderLineRecord[];
  adjustments: WholesaleOrderAdjustmentRecord[];
};

function toMoneyNumber(value: string) {
  const numericValue = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function parseMoney(value: string) {
  const numericValue = Number(value.replace(/[^0-9.-]/g, ""));

  if (!Number.isFinite(numericValue)) {
    return "0.00";
  }

  return numericValue.toFixed(2);
}

function parseOptionalMoney(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const normalizedValue = parseMoney(value);
  return toMoneyNumber(normalizedValue) > 0 ? normalizedValue : null;
}

function normalizeQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function calculateDiscountPercent(originalUnitPrice: string | null, unitPrice: string) {
  if (!originalUnitPrice) {
    return null;
  }

  const original = toMoneyNumber(originalUnitPrice);
  const current = toMoneyNumber(unitPrice);

  if (original <= 0 || current <= 0 || current >= original) {
    return null;
  }

  return String(Math.round(((original - current) / original) * 100));
}

async function findInflowCustomerByEmail(email: string) {
  const customers = await inflowRequest<InflowCustomer[]>("/customers", {
    "filter[email]": email,
  });

  return customers.find((customer) => customer.email?.trim().toLowerCase() === email.trim().toLowerCase()) ?? null;
}

async function findInflowCustomerByName(name: string) {
  const customers = await inflowRequest<InflowCustomer[]>("/customers", {
    "filter[name]": name,
  });

  return customers.find((customer) => customer.name?.trim().toLowerCase() === name.trim().toLowerCase()) ?? null;
}

function buildInflowCustomerName(application: InflowCustomerApplication) {
  return `${application.businessName}: ${application.contactName}`.trim();
}

async function upsertInflowCustomer(
  application: InflowCustomerApplication,
) {
  const inflowCustomerName = buildInflowCustomerName(application);
  const existingCustomer =
    (await findInflowCustomerByEmail(application.email)) ??
    (await findInflowCustomerByName(inflowCustomerName));
  const customerId = existingCustomer?.customerId ?? randomUUID();

  const customerPayload = {
    customerId,
    name: inflowCustomerName,
    contactName: application.contactName,
    email: application.email,
    phone: application.phone,
    address: application.companyAddress,
    city: application.city,
    state: application.stateProvince,
    postalCode: application.zipPostalCode,
    country: application.country,
  };

  let customer: InflowCustomer;

  try {
    customer = await inflowRequest<InflowCustomer>(
      "/customers",
      {},
      {
        method: "PUT",
        body: customerPayload,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (!message.includes("customer_name_conflict")) {
      throw error;
    }

    const conflictingCustomer = await findInflowCustomerByName(inflowCustomerName);

    if (!conflictingCustomer?.customerId) {
      throw error;
    }

    customer = await inflowRequest<InflowCustomer>(
      "/customers",
      {},
      {
        method: "PUT",
        body: {
          ...customerPayload,
          customerId: conflictingCustomer.customerId,
        },
      },
    );
  }

  return {
    customerId: customer.customerId,
  };
}

async function createLocalWholesaleOrder(
  application: NonNullable<Awaited<ReturnType<typeof fetchApprovedRegisteredApplicationByEmail>>>,
  items: readonly SubmitOrderItemInput[],
) {
  const normalizedItems = items.map((item) => {
    const quantity = normalizeQuantity(item.quantity);
    const unitPrice = parseMoney(item.unitPrice);
    const originalUnitPrice = parseOptionalMoney(item.originalUnitPrice);
    const discountPercent = calculateDiscountPercent(originalUnitPrice, unitPrice);
    const lineTotal = (toMoneyNumber(unitPrice) * quantity).toFixed(2);

    return {
      productId: item.productId,
      productName: item.productName?.trim() || null,
      productCode: item.productCode?.trim() || null,
      quantity,
      originalUnitPrice,
      unitPrice,
      discountPercent,
      lineTotal,
    };
  });

  const subtotalAmount = normalizedItems
    .reduce((total, item) => total + toMoneyNumber(item.lineTotal), 0)
    .toFixed(2);
  const totalAmount = subtotalAmount;

  const createdOrder = await prisma.wholesaleOrder.create({
    data: {
      applicationId: application.id,
      customerEmail: application.email,
      customerName: application.contactName,
      businessName: application.businessName,
      status: "SUBMITTED",
      approvedByEmail: null,
      approvedAt: null,
      inflowSalesOrderId: null,
      inflowOrderNumber: null,
      source: "Crossing Web Store",
      subtotalAmount,
      totalAmount,
      salesRepNote: null,
      submittedAt: new Date(),
      lines: {
        create: normalizedItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          quantity: item.quantity,
          originalUnitPrice: item.originalUnitPrice,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          lineTotal: item.lineTotal,
        })),
      },
    },
    include: {
      adjustments: {
        orderBy: [{ createdAt: "asc" }],
      },
      lines: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  return createdOrder as unknown as WholesaleOrderRecord;
}

export async function fetchWholesaleOrders() {
  return fetchWholesaleOrdersByFilter();
}

export async function fetchWholesaleOrdersByFilter(filters?: {
  customerEmail?: string;
  applicationId?: string;
}) {
  const orders = await prisma.wholesaleOrder.findMany({
    where: {
      ...(filters?.customerEmail
        ? {
            customerEmail: filters.customerEmail.trim().toLowerCase(),
          }
        : {}),
      ...(filters?.applicationId
        ? {
            applicationId: filters.applicationId,
          }
        : {}),
    },
    include: {
      adjustments: {
        orderBy: [{ createdAt: "asc" }],
      },
      lines: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
    orderBy: [{ submittedAt: "desc" }],
  });

  return orders as unknown as WholesaleOrderRecord[];
}

export async function fetchWholesaleOrderById(orderId: string) {
  const order = await prisma.wholesaleOrder.findUnique({
    where: {
      id: orderId,
    },
    include: {
      adjustments: {
        orderBy: [{ createdAt: "asc" }],
      },
      lines: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  return (order as unknown as WholesaleOrderRecord | null) ?? null;
}

export async function submitSalesOrderForApprovedCustomer(
  email: string,
  items: readonly SubmitOrderItemInput[],
) {
  if (!items.length) {
    throw new Error("Cart is empty");
  }

  const application = await fetchApprovedRegisteredApplicationByEmail(email);

  if (!application) {
    throw new Error("No approved registered wholesale application found for this email");
  }

  const localOrder = await createLocalWholesaleOrder(application, items);

  return {
    localOrderId: localOrder.id,
    status: localOrder.status,
  };
}

export async function approveWholesaleOrder(
  orderId: string,
  reviewerEmail: string,
  lines: readonly ApproveOrderLineInput[],
  adjustments: readonly ApproveOrderAdjustmentInput[],
  salesRepNote?: string,
) {
  const normalizedReviewerEmail = reviewerEmail.trim().toLowerCase();

  if (!normalizedReviewerEmail) {
    throw new Error("Reviewer email is required");
  }

  const reviewerRole = await resolveAdminPortalRoleByEmail(normalizedReviewerEmail);

  if (!reviewerRole) {
    throw new Error("Only admin portal users can approve orders");
  }

  const existingOrder = await prisma.wholesaleOrder.findUnique({
    where: {
      id: orderId,
    },
    include: {
      adjustments: {
        orderBy: [{ createdAt: "asc" }],
      },
      lines: {
        orderBy: [{ createdAt: "asc" }],
      },
      application: {
        include: {
          documents: {
            orderBy: [{ createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  if (
    reviewerRole === "sales_rep" &&
    existingOrder.application.assignedSalesRepEmail?.trim().toLowerCase() !== normalizedReviewerEmail
  ) {
    throw new Error("You can only approve orders for your own customers");
  }

  if (existingOrder.status !== "SUBMITTED") {
    throw new Error("Only submitted orders can be approved");
  }

  const lineMap = new Map(lines.map((line) => [line.id, line]));
  const missingLine = existingOrder.lines.find((line) => !lineMap.has(line.id));

  if (missingLine || lines.length !== existingOrder.lines.length) {
    throw new Error("Order line payload does not match the current order");
  }

  const normalizedLines = existingOrder.lines.map((line) => {
    const input = lineMap.get(line.id);

    if (!input) {
      throw new Error("Missing line update");
    }

    const quantity = normalizeQuantity(input.quantity);
    const unitPrice = parseMoney(input.unitPrice);
    const originalUnitPrice = line.originalUnitPrice?.toString() ?? null;
    const discountPercent = calculateDiscountPercent(originalUnitPrice, unitPrice);
    const lineTotal = (toMoneyNumber(unitPrice) * quantity).toFixed(2);

    return {
      id: line.id,
      quantity,
      originalUnitPrice,
      unitPrice,
      discountPercent,
      lineTotal,
    };
  });

  const normalizedAdjustments = adjustments
    .map((adjustment) => ({
      label: adjustment.label.trim(),
      amount: parseMoney(adjustment.amount),
    }))
    .filter((adjustment) => adjustment.label && toMoneyNumber(adjustment.amount) !== 0);

  const subtotalAmount = normalizedLines
    .reduce((total, line) => total + toMoneyNumber(line.lineTotal), 0)
    .toFixed(2);
  const totalAmount = (
    toMoneyNumber(subtotalAmount) +
    normalizedAdjustments.reduce((total, adjustment) => total + toMoneyNumber(adjustment.amount), 0)
  ).toFixed(2);

  const inflowCustomer = await upsertInflowCustomer(existingOrder.application);
  const salesOrderPayload = {
    salesOrderId: existingOrder.inflowSalesOrderId || randomUUID(),
    customerId: inflowCustomer.customerId,
    source: existingOrder.source,
    showShipping: false,
    sameBillingAndShipping: true,
    orderDate: new Date().toISOString(),
    lines: normalizedLines.map((line) => ({
      salesOrderLineId: randomUUID(),
      productId: existingOrder.lines.find((existingLine) => existingLine.id === line.id)?.productId ?? "",
      unitPrice: line.unitPrice,
      quantity: {
        standardQuantity: String(line.quantity),
        uomQuantity: String(line.quantity),
      },
    })),
  };

  const salesOrder = await inflowRequest<SubmitOrderResult>(
    "/sales-orders",
    {},
    {
      method: "PUT",
      body: salesOrderPayload,
    },
  );

  const updatedOrder = await prisma.$transaction(async (tx) => {
    for (const line of normalizedLines) {
      await tx.wholesaleOrderLine.update({
        where: {
          id: line.id,
        },
        data: {
          quantity: line.quantity,
          originalUnitPrice: line.originalUnitPrice,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          lineTotal: line.lineTotal,
        },
      });
    }

    await tx.wholesaleOrderAdjustment.deleteMany({
      where: {
        orderId,
      },
    });

    return tx.wholesaleOrder.update({
      where: {
        id: orderId,
      },
      data: {
        status: "APPROVED",
        approvedByEmail: normalizedReviewerEmail,
        approvedAt: new Date(),
        inflowSalesOrderId: salesOrder.salesOrderId ?? existingOrder.inflowSalesOrderId,
        inflowOrderNumber: salesOrder.orderNumber ?? existingOrder.inflowOrderNumber,
        subtotalAmount,
        totalAmount,
        salesRepNote: salesRepNote?.trim() || null,
        adjustments: {
          create: normalizedAdjustments.map((adjustment) => ({
            label: adjustment.label,
            amount: adjustment.amount,
          })),
        },
      },
      include: {
        adjustments: {
          orderBy: [{ createdAt: "asc" }],
        },
        lines: {
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });
  });

  return updatedOrder as unknown as WholesaleOrderRecord;
}
