import Elysia, { t } from "elysia";
import { auth } from "../auth";
import { UnauthorizedError } from "../errors/unauthorized-errors";
import { db } from "../../db/connection";

export const getOrderDetails = new Elysia().use(auth).get("/orders/:orderId", async ({ set, jwt, cookie: { authCookie }, params: { orderId } }) => {

  const cookie = String(authCookie.cookie.value);

  const payload = await jwt.verify(cookie);

  if (!payload) {
    throw new UnauthorizedError();
  }

  const profile = {
    userId: payload.sub,
    establishmentId: payload.establishmentsId
  }

  if (!profile.establishmentId) {
    throw new UnauthorizedError();
  }

  const order = await db.query.orders.findFirst({
    columns: {
      id: true,
      status: true,
      totalInCents: true,
      createdAt: true,
    },
    with: {
      customer: {
        columns: {
          name: true,
          phone: true,
          email: true,
        }
      },
      orderItems: {
        columns: {
          id: true,
          totalInCents: true,
          quantity: true
        },
        with: {
          product: {
            columns: {
              name: true
            }
          }
        }
      }
    },
    where(fields, { eq }) {
      return eq(fields.id, orderId)
    },
  })

  if(!order) {
    set.status = 400;

    return {message: "Order not found"}
  }

  return order;

}, {
  params: t.Object({
    orderId: t.String()
  })
})