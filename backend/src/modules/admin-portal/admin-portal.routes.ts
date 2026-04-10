import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { config } from "../../config.js";
import {
  fetchAdminPortalUsers,
  resolveAdminPortalRoleByEmail,
} from "./admin-portal.service.js";

function isAuthorizedAdminRequest(request: FastifyRequest) {
  const token = request.headers["x-admin-token"];
  return typeof token === "string" && token === config.ADMIN_API_TOKEN;
}

export async function registerAdminPortalRoutes(app: FastifyInstance) {
  app.get("/api/admin/portal-users", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const parsedRole = z.enum(["admin", "sales_rep"]).optional().safeParse(
      (request.query as { role?: string }).role,
    );

    if (!parsedRole.success) {
      return reply.status(400).send({
        error: "Invalid role filter",
      });
    }

    try {
      const users = await fetchAdminPortalUsers(parsedRole.data);
      return reply.send(users);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to fetch admin portal users",
      });
    }
  });

  app.get("/api/admin/portal-users/resolve", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const parsedEmail = z.string().trim().email().safeParse(
      (request.query as { email?: string }).email,
    );

    if (!parsedEmail.success) {
      return reply.status(400).send({
        error: "Invalid email",
      });
    }

    try {
      const role = await resolveAdminPortalRoleByEmail(parsedEmail.data);
      return reply.send({
        email: parsedEmail.data.trim().toLowerCase(),
        role,
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to resolve admin portal role",
      });
    }
  });
}
