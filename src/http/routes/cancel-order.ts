import Elysia, { t } from "elysia";
import { auth } from "../auth";
import { UnauthorizedError } from "../errors/unauthorized-errors";
import { db } from "../../db/connection";
import { orders } from "../../db/schema";
import { eq } from "drizzle-orm";

export const cancelOrder = new Elysia().use(auth).patch("/orders/:orderId/cancel", async ({ jwt, cookie: { authCookie }, params: { orderId }, set }) => {

  const cookie = String(authCookie.cookie.value);

  const payload = await jwt.verify(cookie);

  if (!payload) {
    throw new UnauthorizedError();
  }

  if (!payload.establishmentsId) {
    throw new UnauthorizedError();
  }

  const order = await db.query.orders.findFirst({
    where(fields, { eq }) {
      return eq(fields.id, orderId)
    },
  })

  if (!order) {
    set.status = 400;

    return { message: "Order not found" }
  }

  if(!['processing', 'pending'].includes(order.status as string)) {
    set.status = 400;

    return { message: "You cannot cancel the order, it has already been dispatched or canceled"}
  }

  await db.update(orders).set({
    status: "canceled"
  }).where(eq(orders.id, orderId))

}, {
  params: t.Object({
    orderId: t.String()
  })
})