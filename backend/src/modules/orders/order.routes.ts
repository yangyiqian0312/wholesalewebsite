import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { config } from "../../config.js";
import { INFLOW_RATE_LIMIT_MESSAGE, isInflowRateLimitError } from "../../integrations/inflow/client.js";
import { sendApprovedOrderEmail } from "../notifications/email.service.js";
import {
  approveWholesaleOrder,
  cancelWholesaleOrder,
  fetchWholesaleOrderById,
  fetchWholesaleOrders,
  fetchWholesaleOrdersByFilter,
  requestWholesaleOrderCancellation,
  submitSalesOrderForApprovedCustomer,
} from "./order.service.js";

const submitOrderSchema = z.object({
  email: z.string().trim().email(),
  items: z.array(
    z.object({
      productId: z.string().trim().min(1),
      quantity: z.coerce.number().positive(),
      unitPrice: z.string().trim().min(1),
      originalUnitPrice: z.string().trim().optional(),
      salesUomName: z.string().trim().optional(),
      salesUomQuantity: z.string().trim().optional(),
      salesUomStandardQuantity: z.string().trim().optional(),
      productName: z.string().trim().optional(),
      productCode: z.string().trim().optional(),
      standardUomName: z.string().trim().optional(),
    }),
  ).min(1),
});

const approveOrderSchema = z.object({
  reviewedByEmail: z.string().trim().email(),
  frontendBaseUrl: z.string().trim().url().optional(),
  salesRepNote: z.string().trim().max(2000).optional(),
  freightAmount: z.string().trim().optional(),
  taxName: z.string().trim().optional(),
  taxRate: z.string().trim().optional(),
  lines: z.array(
    z.object({
      id: z.string().trim().min(1),
      quantity: z.coerce.number().min(0),
      originalUnitPrice: z.string().trim().min(1),
      discountPercent: z.string().trim().optional(),
    }),
  ).min(1),
  adjustments: z.array(
    z.object({
      label: z.string().trim().min(1),
      amount: z.string().trim().min(1),
    }),
  ).default([]),
});

const customerCancelOrderSchema = z.object({
  email: z.string().trim().email(),
});

const adminCancelOrderSchema = z.object({
  cancelledByEmail: z.string().trim().email(),
});

export async function registerOrderRoutes(app: FastifyInstance) {
  function isAuthorizedAdminRequest(request: FastifyRequest) {
    const token = request.headers["x-admin-token"];
    return typeof token === "string" && token === config.ADMIN_API_TOKEN;
  }

  app.get("/api/admin/orders", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const email = z.string().trim().email().optional().safeParse(
      (request.query as { email?: string }).email,
    );

    if (!email.success) {
      return reply.status(400).send({
        error: "Invalid email",
      });
    }

    try {
      const orders = email.data
        ? await fetchWholesaleOrdersByFilter({ customerEmail: email.data })
        : await fetchWholesaleOrders();
      return reply.send(orders);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to fetch orders",
      });
    }
  });

  app.get("/api/admin/orders/:orderId", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const orderId = z.string().min(1).safeParse((request.params as { orderId?: string }).orderId);

    if (!orderId.success) {
      return reply.status(400).send({
        error: "Invalid order id",
      });
    }

    try {
      const order = await fetchWholesaleOrderById(orderId.data);

      if (!order) {
        return reply.status(404).send({
          error: "Order not found",
        });
      }

      return reply.send(order);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to fetch order detail",
      });
    }
  });

  app.post("/api/orders/submit", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const parsedBody = submitOrderSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.status(400).send({
        error: "Invalid submit order payload",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const salesOrder = await submitSalesOrderForApprovedCustomer(
        parsedBody.data.email,
        parsedBody.data.items,
      );

      return reply.send({
        localOrderId: salesOrder.localOrderId ?? null,
        status: salesOrder.status,
      });
    } catch (error) {
      request.log.error(error);

      if (isInflowRateLimitError(error)) {
        return reply.status(503).send({
          error: INFLOW_RATE_LIMIT_MESSAGE,
          code: "INFLOW_RATE_LIMIT",
        });
      }

      const message = error instanceof Error ? error.message : "Failed to submit order";
      const statusCode =
        message.includes("No approved registered wholesale application") || message.includes("Cart is empty")
          ? 400
          : 502;

      return reply.status(statusCode).send({
        error: message,
      });
    }
  });

  app.patch("/api/admin/orders/:orderId/approve", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const orderId = z.string().trim().min(1).safeParse((request.params as { orderId?: string }).orderId);
    const parsedBody = approveOrderSchema.safeParse(request.body);

    if (!orderId.success) {
      return reply.status(400).send({
        error: "Invalid order id",
      });
    }

    if (!parsedBody.success) {
      return reply.status(400).send({
        error: "Invalid approve order payload",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const updatedOrder = await approveWholesaleOrder(
        orderId.data,
        parsedBody.data.reviewedByEmail,
        parsedBody.data.lines,
        parsedBody.data.adjustments,
        parsedBody.data.salesRepNote,
        parsedBody.data.freightAmount,
        parsedBody.data.taxName,
        parsedBody.data.taxRate,
      );

      let emailNotification:
        | { sent: true }
        | { sent: false; error?: string; reason?: string }
        | null = null;

      try {
        const orderLinkBase = parsedBody.data.frontendBaseUrl?.trim() || config.APP_BASE_URL;
        const orderReference = updatedOrder.inflowOrderNumber || updatedOrder.inflowSalesOrderId || updatedOrder.id;
        const result = await sendApprovedOrderEmail({
          to: updatedOrder.customerEmail,
          contactName: updatedOrder.customerName,
          businessName: updatedOrder.businessName,
          orderReference,
          orderLink: `${orderLinkBase.replace(/\/+$/, "")}/profile/orders`,
        });

        emailNotification = result.sent
          ? result
          : {
              sent: false,
              reason: result.reason,
            };
      } catch (error) {
        request.log.error(error);
        emailNotification = {
          sent: false,
          error: error instanceof Error ? error.message : "Failed to send approved order email",
        };
      }

      return reply.send({
        ...updatedOrder,
        emailNotification,
      });
    } catch (error) {
      request.log.error(error);

      if (isInflowRateLimitError(error)) {
        return reply.status(503).send({
          error: INFLOW_RATE_LIMIT_MESSAGE,
          code: "INFLOW_RATE_LIMIT",
        });
      }

      const message = error instanceof Error ? error.message : "Failed to approve order";
      const statusCode =
        message.includes("not found")
          ? 404
          : message.includes("Only admin portal users") || message.includes("You can only approve orders")
            ? 403
          : message.includes("Only submitted orders") || message.includes("only approve orders")
            ? 409
            : message.includes("payload") || message.includes("required")
              ? 400
              : 502;

      return reply.status(statusCode).send({
        error: message,
      });
    }
  });

  app.patch("/api/orders/:orderId/cancel", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const orderId = z.string().trim().min(1).safeParse((request.params as { orderId?: string }).orderId);
    const parsedBody = customerCancelOrderSchema.safeParse(request.body);

    if (!orderId.success) {
      return reply.status(400).send({
        error: "Invalid order id",
      });
    }

    if (!parsedBody.success) {
      return reply.status(400).send({
        error: "Invalid cancel order payload",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const result = await requestWholesaleOrderCancellation(orderId.data, parsedBody.data.email);

      return reply.send(result);
    } catch (error) {
      request.log.error(error);

      if (isInflowRateLimitError(error)) {
        return reply.status(503).send({
          error: INFLOW_RATE_LIMIT_MESSAGE,
          code: "INFLOW_RATE_LIMIT",
        });
      }

      const message = error instanceof Error ? error.message : "Failed to update order cancellation";
      const statusCode =
        message.includes("not found")
          ? 404
          : message.includes("your own orders")
            ? 403
            : message.includes("no longer be cancelled")
              ? 409
              : message.includes("required")
                ? 400
                : 502;

      return reply.status(statusCode).send({
        error: message,
      });
    }
  });

  app.patch("/api/admin/orders/:orderId/cancel", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const orderId = z.string().trim().min(1).safeParse((request.params as { orderId?: string }).orderId);
    const parsedBody = adminCancelOrderSchema.safeParse(request.body);

    if (!orderId.success) {
      return reply.status(400).send({
        error: "Invalid order id",
      });
    }

    if (!parsedBody.success) {
      return reply.status(400).send({
        error: "Invalid cancel order payload",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const updatedOrder = await cancelWholesaleOrder(orderId.data, parsedBody.data.cancelledByEmail);

      return reply.send(updatedOrder);
    } catch (error) {
      request.log.error(error);

      if (isInflowRateLimitError(error)) {
        return reply.status(503).send({
          error: INFLOW_RATE_LIMIT_MESSAGE,
          code: "INFLOW_RATE_LIMIT",
        });
      }

      const message = error instanceof Error ? error.message : "Failed to cancel order";
      const statusCode =
        message.includes("not found")
          ? 404
          : message.includes("Only admin portal users") || message.includes("You can only cancel orders")
            ? 403
            : message.includes("required")
              ? 400
              : 502;

      return reply.status(statusCode).send({
        error: message,
      });
    }
  });
}
