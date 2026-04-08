import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { config } from "../../config.js";
import {
  fetchWholesaleOrderById,
  fetchWholesaleOrders,
  fetchWholesaleOrdersByFilter,
  submitSalesOrderForApprovedCustomer,
} from "./order.service.js";

const submitOrderSchema = z.object({
  email: z.string().trim().email(),
  items: z.array(
    z.object({
      productId: z.string().trim().min(1),
      quantity: z.coerce.number().positive(),
      unitPrice: z.string().trim().min(1),
      productName: z.string().trim().optional(),
      productCode: z.string().trim().optional(),
    }),
  ).min(1),
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
        salesOrderId: salesOrder.salesOrderId ?? null,
        orderNumber: salesOrder.orderNumber ?? null,
        localOrderId: salesOrder.localOrderId ?? null,
      });
    } catch (error) {
      request.log.error(error);

      const message = error instanceof Error ? error.message : "Failed to submit sales order to Inflow";
      const statusCode =
        message.includes("No approved registered wholesale application") || message.includes("Cart is empty")
          ? 400
          : 502;

      return reply.status(statusCode).send({
        error: message,
      });
    }
  });
}
