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
  salesUomName?: string;
  salesUomQuantity?: string;
  salesUomStandardQuantity?: string;
  productName?: string;
  productCode?: string;
  standardUomName?: string;
};

type ApproveOrderLineInput = {
  id: string;
  quantity: number;
  originalUnitPrice: string;
  discountPercent?: string;
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
  physicalStoreAddress?: string | null;
};

type WholesaleOrderStatus = "SUBMITTED" | "APPROVED" | "PAID" | "CANCELLED";

type WholesaleOrderLineRecord = {
  id: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  submittedQuantity: number;
  quantity: number;
  salesUomName: string | null;
  standardUomName: string | null;
  salesUomStandardQuantity: string | null;
  salesUomQuantity: string | null;
  submittedOriginalUnitPrice: string | null;
  originalUnitPrice: string | null;
  submittedDiscountPercent: string | null;
  unitPrice: string;
  discountPercent: string | null;
  submittedLineTotal: string;
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
  freightAmount: string;
  taxName: string | null;
  taxRate: string | null;
  taxAmount: string;
  salesRepNote: string | null;
  customerCancelRequestedAt: Date | null;
  customerCancelRequestedByEmail: string | null;
  cancelledAt: Date | null;
  cancelledByEmail: string | null;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lines: WholesaleOrderLineRecord[];
  adjustments: WholesaleOrderAdjustmentRecord[];
};

type WholesaleOrderApprovalApplication = InflowCustomerApplication & {
  assignedSalesRepEmail: string | null;
};

type WholesaleOrderApprovalRecord = WholesaleOrderRecord & {
  application: WholesaleOrderApprovalApplication;
};

type InflowSalesOrder = {
  salesOrderId: string;
  orderNumber?: string;
  isCancelled?: boolean;
};

function buildWholesaleOrderInclude() {
  return {
    adjustments: {
      orderBy: [{ createdAt: "asc" as const }],
    },
    lines: {
      orderBy: [{ createdAt: "asc" as const }],
    },
  };
}

function buildWholesaleOrderApprovalInclude() {
  return {
    ...buildWholesaleOrderInclude(),
    application: true,
  };
}

type PersistedWholesaleOrderLine = {
  id: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  submittedQuantity: number;
  quantity: number;
  salesUomName: string | null;
  standardUomName: string | null;
  salesUomStandardQuantity: { toString(): string } | null;
  salesUomQuantity: { toString(): string } | null;
  submittedOriginalUnitPrice: { toString(): string } | null;
  originalUnitPrice: { toString(): string } | null;
  submittedDiscountPercent: { toString(): string } | null;
  unitPrice: { toString(): string };
  discountPercent: { toString(): string } | null;
  submittedLineTotal: { toString(): string };
  lineTotal: { toString(): string };
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

function parsePercent(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const numericValue = Number(value.replace(/[^0-9.-]/g, ""));

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.max(0, Math.min(100, numericValue)).toFixed(2);
}

function normalizeQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function normalizeApprovedQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
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

  return (((original - current) / original) * 100).toFixed(2);
}

function calculateDiscountedUnitPrice(originalUnitPrice: string | null, discountPercent: string | null) {
  const original = toMoneyNumber(originalUnitPrice ?? "0");
  const discount = Number(discountPercent ?? "0");

  if (original <= 0 || !Number.isFinite(discount) || discount <= 0) {
    return original.toFixed(2);
  }

  return (original * (1 - discount / 100)).toFixed(2);
}

function parseDecimalText(value?: string | null, fallback = "1") {
  const numericValue = Number(value?.trim() ?? "");

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback;
  }

  return numericValue.toString();
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
  const businessName = application.businessName.trim();
  const contactName = application.contactName.trim();

  return businessName || contactName;
}

type InflowAddress = {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function buildCompanyBillingAddress(application: InflowCustomerApplication): InflowAddress {
  return {
    address: application.companyAddress,
    city: application.city,
    state: application.stateProvince,
    postalCode: application.zipPostalCode,
    country: application.country,
  };
}

function parsePhysicalStoreAddress(value?: string | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  const lines = trimmedValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  const addressee = lines[0] ?? "";
  const streetAddress = lines[1] ?? "";
  const cityStateLine = lines[2] ?? "";
  const postalCode = lines[3] ?? "";
  const country = lines[4] ?? "";
  const cityStateMatch = cityStateLine.match(/^(.*?)(?:,\s*([A-Za-z .'-]+))?$/);

  return {
    addressee,
    address: streetAddress,
    city: cityStateMatch?.[1]?.trim() ?? "",
    state: cityStateMatch?.[2]?.trim() ?? "",
    postalCode,
    country,
  };
}

function buildShippingAddress(application: InflowCustomerApplication): InflowAddress {
  const parsedShippingAddress = parsePhysicalStoreAddress(application.physicalStoreAddress);

  if (
    parsedShippingAddress?.address &&
    parsedShippingAddress.city &&
    parsedShippingAddress.state &&
    parsedShippingAddress.postalCode &&
    parsedShippingAddress.country
  ) {
    return {
      address: parsedShippingAddress.address,
      city: parsedShippingAddress.city,
      state: parsedShippingAddress.state,
      postalCode: parsedShippingAddress.postalCode,
      country: parsedShippingAddress.country,
    };
  }

  return buildCompanyBillingAddress(application);
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
    ...buildCompanyBillingAddress(application),
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

async function fetchInflowSalesOrderById(salesOrderId: string) {
  return inflowRequest<InflowSalesOrder>(`/sales-orders/${salesOrderId}`);
}

async function syncCancelledStatusFromInflow(order: WholesaleOrderRecord | null) {
  if (!order?.inflowSalesOrderId || order.status === "CANCELLED") {
    return order;
  }

  try {
    const inflowSalesOrder = await fetchInflowSalesOrderById(order.inflowSalesOrderId);

    if (!inflowSalesOrder.isCancelled) {
      return order;
    }

    const cancelledOrder = await prisma.wholesaleOrder.update({
      where: {
        id: order.id,
      },
      data: {
        status: "CANCELLED",
        customerCancelRequestedAt: null,
        customerCancelRequestedByEmail: null,
        cancelledAt: order.cancelledAt ?? new Date(),
        cancelledByEmail: order.cancelledByEmail ?? null,
      },
      include: buildWholesaleOrderInclude(),
    });

    return cancelledOrder as unknown as WholesaleOrderRecord;
  } catch {
    return order;
  }
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
      submittedQuantity: quantity,
      quantity,
      salesUomName: item.salesUomName?.trim() || item.standardUomName?.trim() || null,
      standardUomName: item.standardUomName?.trim() || null,
      salesUomStandardQuantity: parseDecimalText(item.salesUomStandardQuantity, "1"),
      salesUomQuantity: parseDecimalText(item.salesUomQuantity, "1"),
      submittedOriginalUnitPrice: originalUnitPrice,
      originalUnitPrice,
      submittedDiscountPercent: discountPercent,
      unitPrice,
      discountPercent,
      submittedLineTotal: lineTotal,
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
      freightAmount: "0.00",
      taxName: null,
      taxRate: null,
      taxAmount: "0.00",
      salesRepNote: null,
      customerCancelRequestedAt: null,
      customerCancelRequestedByEmail: null,
      cancelledAt: null,
      cancelledByEmail: null,
      submittedAt: new Date(),
      lines: {
        create: normalizedItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          submittedQuantity: item.submittedQuantity,
          quantity: item.quantity,
          salesUomName: item.salesUomName,
          standardUomName: item.standardUomName,
          salesUomStandardQuantity: item.salesUomStandardQuantity,
          salesUomQuantity: item.salesUomQuantity,
          submittedOriginalUnitPrice: item.submittedOriginalUnitPrice,
          originalUnitPrice: item.originalUnitPrice,
          submittedDiscountPercent: item.submittedDiscountPercent,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          submittedLineTotal: item.submittedLineTotal,
          lineTotal: item.lineTotal,
        })),
      },
    } as never,
    include: buildWholesaleOrderInclude(),
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
    include: buildWholesaleOrderInclude(),
    orderBy: [{ submittedAt: "desc" }],
  });

  const typedOrders = orders as unknown as WholesaleOrderRecord[];

  if (!filters?.customerEmail && !filters?.applicationId) {
    return typedOrders;
  }

  const syncedOrders = await Promise.all(typedOrders.map((order) => syncCancelledStatusFromInflow(order)));
  return syncedOrders.filter((order): order is WholesaleOrderRecord => Boolean(order));
}

export async function fetchWholesaleOrderById(orderId: string) {
  const order = await prisma.wholesaleOrder.findUnique({
    where: {
      id: orderId,
    },
    include: buildWholesaleOrderInclude(),
  });

  return syncCancelledStatusFromInflow((order as unknown as WholesaleOrderRecord | null) ?? null);
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
  freightAmount?: string,
  taxName?: string,
  taxRate?: string,
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
    include: buildWholesaleOrderApprovalInclude(),
  }) as WholesaleOrderApprovalRecord | null;

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  const persistedLines = existingOrder.lines as unknown as PersistedWholesaleOrderLine[];

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
  const missingLine = persistedLines.find((line) => !lineMap.has(line.id));

  if (missingLine || lines.length !== persistedLines.length) {
    throw new Error("Order line payload does not match the current order");
  }

  const normalizedLines = persistedLines.map((line) => {
    const input = lineMap.get(line.id);

    if (!input) {
      throw new Error("Missing line update");
    }

    const quantity = normalizeApprovedQuantity(input.quantity);
    const originalUnitPrice = parseOptionalMoney(input.originalUnitPrice) ?? line.originalUnitPrice?.toString() ?? null;
    const discountPercent = parsePercent(input.discountPercent) ?? "0.00";
    const unitPrice = calculateDiscountedUnitPrice(originalUnitPrice, discountPercent);
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

  const orderableLines = normalizedLines.filter((line) => line.quantity > 0);

  if (!orderableLines.length) {
    throw new Error("At least one order line must have quantity above 0");
  }

  const subtotalAmount = orderableLines
    .reduce((total, line) => total + toMoneyNumber(line.lineTotal), 0)
    .toFixed(2);
  const normalizedFreightAmount = parseMoney(freightAmount ?? "0");
  const normalizedTaxRate = parsePercent(taxRate);
  const normalizedTaxName = taxName?.trim() || null;
  const taxAmount = normalizedTaxRate
    ? ((toMoneyNumber(subtotalAmount) * Number(normalizedTaxRate)) / 100).toFixed(2)
    : "0.00";
  const totalAmount = (
    toMoneyNumber(subtotalAmount) +
    toMoneyNumber(normalizedFreightAmount) +
    toMoneyNumber(taxAmount) +
    normalizedAdjustments.reduce((total, adjustment) => total + toMoneyNumber(adjustment.amount), 0)
  ).toFixed(2);

  const inflowCustomer = await upsertInflowCustomer(existingOrder.application);
  const billingAddress = buildCompanyBillingAddress(existingOrder.application);
  const shippingAddress = buildShippingAddress(existingOrder.application);
  const parsedShippingAddress = parsePhysicalStoreAddress(existingOrder.application.physicalStoreAddress);
  const sameBillingAndShipping =
    billingAddress.address === shippingAddress.address &&
    billingAddress.city === shippingAddress.city &&
    billingAddress.state === shippingAddress.state &&
    billingAddress.postalCode === shippingAddress.postalCode &&
    billingAddress.country === shippingAddress.country;
  const salesOrderPayload = {
    salesOrderId: existingOrder.inflowSalesOrderId || randomUUID(),
    customerId: inflowCustomer.customerId,
    contactName: existingOrder.application.contactName,
    email: existingOrder.application.email,
    phone: existingOrder.application.phone,
    source: existingOrder.source,
    showShipping: toMoneyNumber(normalizedFreightAmount) > 0,
    sameBillingAndShipping,
    shipToCompanyName:
      parsedShippingAddress?.addressee ||
      existingOrder.application.businessName.trim() ||
      existingOrder.application.contactName.trim(),
    billingAddress,
    shippingAddress,
    orderDate: new Date().toISOString(),
    orderFreight: toMoneyNumber(normalizedFreightAmount) > 0 ? normalizedFreightAmount : null,
    orderRemarks: salesRepNote?.trim() || undefined,
    tax1Name: normalizedTaxName ?? undefined,
    tax1Rate: normalizedTaxRate ?? undefined,
    tax1OnShipping: false,
    lines: orderableLines.map((line) => ({
      salesOrderLineId: randomUUID(),
      productId: persistedLines.find((existingLine) => existingLine.id === line.id)?.productId ?? "",
      unitPrice: line.originalUnitPrice ?? line.unitPrice,
      discount: Number(line.discountPercent ?? "0") > 0
        ? {
            value: line.discountPercent,
            isPercent: true,
          }
        : undefined,
      quantity: {
        standardQuantity: (
          Number(persistedLines.find((existingLine) => existingLine.id === line.id)?.salesUomStandardQuantity?.toString() ?? "1") /
          Number(persistedLines.find((existingLine) => existingLine.id === line.id)?.salesUomQuantity?.toString() ?? "1") *
          line.quantity
        ).toString(),
        uomQuantity: String(line.quantity),
        uom:
          persistedLines.find((existingLine) => existingLine.id === line.id)?.salesUomName ??
          persistedLines.find((existingLine) => existingLine.id === line.id)?.standardUomName ??
          undefined,
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
        freightAmount: normalizedFreightAmount,
        taxName: normalizedTaxName,
        taxRate: normalizedTaxRate,
        taxAmount,
        salesRepNote: salesRepNote?.trim() || null,
        customerCancelRequestedAt: null,
        customerCancelRequestedByEmail: null,
        cancelledAt: null,
        cancelledByEmail: null,
        adjustments: {
          create: normalizedAdjustments.map((adjustment) => ({
            label: adjustment.label,
            amount: adjustment.amount,
          })),
        },
      } as never,
      include: buildWholesaleOrderInclude(),
    });
  });

  return updatedOrder as unknown as WholesaleOrderRecord;
}

export async function requestWholesaleOrderCancellation(orderId: string, customerEmail: string) {
  const normalizedCustomerEmail = customerEmail.trim().toLowerCase();

  if (!normalizedCustomerEmail) {
    throw new Error("Customer email is required");
  }

  const existingOrder = await fetchWholesaleOrderById(orderId);

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  if (existingOrder.customerEmail.trim().toLowerCase() !== normalizedCustomerEmail) {
    throw new Error("You can only manage your own orders");
  }

  if (existingOrder.status === "CANCELLED") {
    return {
      order: existingOrder,
      action: "cancelled" as const,
    };
  }

  if (existingOrder.status === "SUBMITTED") {
    const cancelledOrder = await prisma.wholesaleOrder.update({
      where: {
        id: orderId,
      },
      data: {
        status: "CANCELLED",
        customerCancelRequestedAt: null,
        customerCancelRequestedByEmail: null,
        cancelledAt: new Date(),
        cancelledByEmail: normalizedCustomerEmail,
      },
      include: buildWholesaleOrderInclude(),
    });

    return {
      order: cancelledOrder as unknown as WholesaleOrderRecord,
      action: "cancelled" as const,
    };
  }

  if (existingOrder.status === "APPROVED" || existingOrder.status === "PAID") {
    if (existingOrder.customerCancelRequestedAt) {
      return {
        order: existingOrder,
        action: "requested" as const,
      };
    }

    const requestedOrder = await prisma.wholesaleOrder.update({
      where: {
        id: orderId,
      },
      data: {
        customerCancelRequestedAt: new Date(),
        customerCancelRequestedByEmail: normalizedCustomerEmail,
      },
      include: buildWholesaleOrderInclude(),
    });

    return {
      order: requestedOrder as unknown as WholesaleOrderRecord,
      action: "requested" as const,
    };
  }

  throw new Error("This order can no longer be cancelled from the customer portal");
}

export async function cancelWholesaleOrder(orderId: string, reviewerEmail: string) {
  const normalizedReviewerEmail = reviewerEmail.trim().toLowerCase();

  if (!normalizedReviewerEmail) {
    throw new Error("Reviewer email is required");
  }

  const reviewerRole = await resolveAdminPortalRoleByEmail(normalizedReviewerEmail);

  if (!reviewerRole) {
    throw new Error("Only admin portal users can cancel orders");
  }

  const existingOrder = await prisma.wholesaleOrder.findUnique({
    where: {
      id: orderId,
    },
    include: buildWholesaleOrderApprovalInclude(),
  }) as WholesaleOrderApprovalRecord | null;

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  if (
    reviewerRole === "sales_rep" &&
    existingOrder.application.assignedSalesRepEmail?.trim().toLowerCase() !== normalizedReviewerEmail
  ) {
    throw new Error("You can only cancel orders for your own customers");
  }

  const syncedOrder = await syncCancelledStatusFromInflow(existingOrder as unknown as WholesaleOrderRecord);

  if (syncedOrder?.status === "CANCELLED") {
    return syncedOrder;
  }

  if (existingOrder.inflowSalesOrderId) {
    await inflowRequest<SubmitOrderResult>(
      "/sales-orders",
      {},
      {
        method: "PUT",
        body: {
          salesOrderId: existingOrder.inflowSalesOrderId,
          isCancelled: true,
        },
      },
    );
  }

  const cancelledOrder = await prisma.wholesaleOrder.update({
    where: {
      id: orderId,
    },
    data: {
      status: "CANCELLED",
      customerCancelRequestedAt: null,
      customerCancelRequestedByEmail: null,
      cancelledAt: new Date(),
      cancelledByEmail: normalizedReviewerEmail,
    },
    include: buildWholesaleOrderInclude(),
  });

  return cancelledOrder as unknown as WholesaleOrderRecord;
}
