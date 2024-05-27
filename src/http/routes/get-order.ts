import Elysia, { t } from "elysia";
import { auth } from "../auth";

import { createSelectSchema } from 'drizzle-typebox'
import { orders, users } from "../../db/schema";
import { UnauthorizedError } from "../errors/unauthorized-errors";
import { db } from "../../db/connection";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";

export const getOrders = new Elysia().use(auth).get("/orders", async ({ query: { pageIndex, customerName, orderId, status }, jwt, cookie: { authCookie } }) => {

  const cookie = String(authCookie.cookie.value);

  const payload = await jwt.verify(cookie);

  if (!payload) {
    throw new UnauthorizedError();
  }

  if (!payload.establishmentsId) {
    throw new UnauthorizedError();
  }

  const baseQuery = db.select({
    orderId: orders.id,
    createdAt: orders.createdAt,
    status: orders.status,
    totalInCents: orders.totalInCents,
    customerName: users.name
  }).from(orders).innerJoin(users, eq(users.id, orders.customerId)).where(and(
    eq(orders.establishmentId, payload.establishmentsId),
    orderId ? ilike(orders.id, `%${orderId}%`) : undefined,
    status ? eq(orders.status, status) : undefined,
    customerName ? ilike(users.name, `%${customerName}%`) : undefined
  ))


  const [[{ count: amountOfOrders }], allOrders] = await Promise.all([
    db.select({ count: count() }).from(baseQuery.as('baseQuery')),
    db.select().from(baseQuery.as("baseQuery")).offset(pageIndex * 10).limit(10).orderBy((fields) => {
      return [
        sql`CASE ${fields.status} 
          WHEN 'pending' THEN 1
          WHEN 'processing' THEN 2
          WHEN 'delivering' THEN 3
          WHEN 'delivered' THEN 4
          WHEN 'canceled' THEN 99
        END`,
        desc(fields.createdAt)
      ]
    })
  ])

  return {
    orders: allOrders,
    meta: {
      pageIndex,
      perPage: 10,
      totalCount: amountOfOrders
    }
  }

}, {
  query: t.Object({
    customerName: t.Optional(t.String()),
    orderId: t.Optional(t.String()),
    status: t.Optional(createSelectSchema(orders).properties.status),
    pageIndex: t.Numeric({ minimum: 0 })
  })
})