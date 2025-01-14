import Elysia, { t } from "elysia";
import { auth } from "../auth";
import { UnauthorizedError } from "../errors/unauthorized-errors";
import { db } from "../../db/connection";
import { orders } from "../../db/schema";
import { eq } from "drizzle-orm";

export const dispatchOrder = new Elysia().use(auth).patch(
  "/orders/:orderId/dispatch",
  async ({ jwt, cookie: { authCookie }, params: { orderId }, set }) => {
    const cookie = String(authCookie.cookie.value);

    const payload = await jwt.verify(cookie);

    if (!payload || !payload.establishmentsId) {
      throw new UnauthorizedError();
    }

    const order = await db.query.orders.findFirst({
      where(fields, { eq, and }) {
        return and(
          eq(fields.id, orderId),
          eq(fields.establishmentId, String(payload.establishmentsId))
        );
      },
    });

    if (!order) {
      set.status = 400;

      return { message: "Order not found" };
    }

    if (order.status !== "processing") {
      set.status = 400;

      return {
        message: "You cannot dispatch orders that are not 'processing' status.",
      };
    }

    await db
      .update(orders)
      .set({
        status: "delivering",
      })
      .where(eq(orders.id, orderId));
  },
  {
    params: t.Object({
      orderId: t.String(),
    }),
  }
);
