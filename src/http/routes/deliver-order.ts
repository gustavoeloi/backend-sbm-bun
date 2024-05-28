import Elysia, { t } from "elysia";
import { auth } from "../auth";
import { UnauthorizedError } from "../errors/unauthorized-errors";
import { db } from "../../db/connection";
import { orders } from "../../db/schema";
import { eq } from "drizzle-orm";

export const deliverOrder = new Elysia().use(auth).patch(
  "/orders/:orderId/deliver",
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

    if (order.status !== "delivering") {
      set.status = 400;

      return {
        message:
          "You cannot deliver order that are not in 'delivering' status..",
      };
    }

    await db
      .update(orders)
      .set({
        status: "delivered",
      })
      .where(eq(orders.id, orderId));
  },
  {
    params: t.Object({
      orderId: t.String(),
    }),
  }
);
