import { randomUUID } from "node:crypto";
import { prisma } from "../../db/prisma.js";
import { inflowRequest } from "../../integrations/inflow/client.js";
import { fetchApprovedRegisteredApplicationByEmail } from "../applications/application.service.js";

type SubmitOrderItemInput = {
  productId: string;
  quantity: number;
  unitPrice: string;
  productName?: string;
  productCode?: string;
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

type WholesaleOrderLineRecord = {
  id: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  createdAt: Date;
};

type WholesaleOrderRecord = {
  id: string;
  applicationId: string;
  customerEmail: string;
  customerName: string;
  businessName: string;
  inflowSalesOrderId: string | null;
  inflowOrderNumber: string | null;
  source: string;
  subtotalAmount: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lines: WholesaleOrderLineRecord[];
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

function normalizeQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
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

function buildInflowCustomerName(application: NonNullable<Awaited<ReturnType<typeof fetchApprovedRegisteredApplicationByEmail>>>) {
  return `${application.businessName}: ${application.contactName}`.trim();
}

async function upsertInflowCustomer(email: string) {
  const application = await fetchApprovedRegisteredApplicationByEmail(email);

  if (!application) {
    throw new Error("No approved registered wholesale application found for this email");
  }

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
    application,
    customerId: customer.customerId,
  };
}

async function createLocalWholesaleOrder(
  application: Awaited<ReturnType<typeof fetchApprovedRegisteredApplicationByEmail>>,
  salesOrder: SubmitOrderResult,
  items: readonly SubmitOrderItemInput[],
) {
  if (!application) {
    throw new Error("No approved wholesale application found for this email");
  }

  const normalizedItems = items.map((item) => {
    const quantity = normalizeQuantity(item.quantity);
    const unitPrice = parseMoney(item.unitPrice);
    const lineTotal = (toMoneyNumber(unitPrice) * quantity).toFixed(2);

    return {
      productId: item.productId,
      productName: item.productName?.trim() || null,
      productCode: item.productCode?.trim() || null,
      quantity,
      unitPrice,
      lineTotal,
    };
  });

  const subtotalAmount = normalizedItems
    .reduce((total, item) => total + toMoneyNumber(item.lineTotal), 0)
    .toFixed(2);

  const createdOrder = await prisma.wholesaleOrder.create({
    data: {
      applicationId: application.id,
      customerEmail: application.email,
      customerName: application.contactName,
      businessName: application.businessName,
      inflowSalesOrderId: salesOrder.salesOrderId ?? null,
      inflowOrderNumber: salesOrder.orderNumber ?? null,
      source: "Crossing Web Store",
      subtotalAmount,
      submittedAt: new Date(),
      lines: {
        create: normalizedItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
      },
    },
    include: {
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

  const { application, customerId } = await upsertInflowCustomer(email);

  const payload = {
    salesOrderId: randomUUID(),
    customerId,
    source: "Crossing Web Store",
    showShipping: false,
    sameBillingAndShipping: true,
    orderDate: new Date().toISOString(),
    lines: items.map((item) => ({
      salesOrderLineId: randomUUID(),
      productId: item.productId,
      unitPrice: parseMoney(item.unitPrice),
      quantity: {
        standardQuantity: String(normalizeQuantity(item.quantity)),
        uomQuantity: String(normalizeQuantity(item.quantity)),
      },
    })),
  };

  const salesOrder = await inflowRequest<SubmitOrderResult>(
    "/sales-orders",
    {},
    {
      method: "PUT",
      body: payload,
    },
  );

  const localOrder = await createLocalWholesaleOrder(application, salesOrder, items);

  return {
    ...salesOrder,
    localOrderId: localOrder.id,
  };
}
