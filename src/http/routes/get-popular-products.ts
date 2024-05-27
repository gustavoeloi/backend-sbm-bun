import Elysia from "elysia";
import { auth } from "../auth";
import { db } from "../../db/connection";
import { UnauthorizedError } from "../errors/unauthorized-errors";
import { orderItems, orders, products } from "../../db/schema";
import { count, desc, eq, sum } from "drizzle-orm";

export const getPopularProducts = new Elysia()
  .use(auth)
  .get("/metrics/popular-products", async ({ cookie: { authCookie }, jwt }) => {
    const authenticatedCookie = String(authCookie.cookie.value);

    const payload = await jwt.verify(authenticatedCookie);

    if (!payload || !payload.establishmentsId) {
      throw new UnauthorizedError();
    }

    const popularProducts = await db
      .select({
        product: products.name,
        amount: sum(orderItems.quantity).mapWith(Number),
      })
      .from(orderItems)
      .leftJoin(orders, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(products.id, orderItems.productId))
      .where(eq(orders.establishmentId, payload.establishmentsId))
      .groupBy(products.name)
      .orderBy((fields) => {
        return desc(fields.amount);
      })
      .limit(5);

    return popularProducts;
  });
