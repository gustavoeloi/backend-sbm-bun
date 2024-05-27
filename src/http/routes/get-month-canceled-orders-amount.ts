import Elysia from "elysia";
import { auth } from "../auth";
import dayjs from "dayjs";
import { UnauthorizedError } from "../errors/unauthorized-errors";
import { db } from "../../db/connection";
import { orders } from "../../db/schema";
import { and, count, eq, gte, sql } from "drizzle-orm";

export const getMonthCanceledOrdersAmount = new Elysia()
  .use(auth)
  .get(
    "/metrics/month-canceled-orders-amount",
    async ({ cookie: { authCookie }, jwt }) => {
      const cookie = String(authCookie.cookie.value);

      const payload = await jwt.verify(cookie);

      if (!payload || !payload.establishmentsId) {
        throw new UnauthorizedError();
      }

      const today = dayjs();
      const lastMonth = today.subtract(1, "month");
      const startOfLastMonth = lastMonth.startOf("month");

      const currentMonthWithYear = today.format("YYYY-MM");
      const lastMonthWithYear = lastMonth.format("YYYY-MM");

      const orderPerMonths = await db
        .select({
          monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
          amount: count(),
        })
        .from(orders)
        .where(
          and(
            eq(orders.establishmentId, payload.establishmentsId),
            eq(orders.status, "canceled"),
            gte(orders.createdAt, startOfLastMonth.toDate())
          )
        )
        .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`);

      const currentMonthOrdersAmount = orderPerMonths.find((orderPerMonth) => {
        return orderPerMonth.monthWithYear === currentMonthWithYear;
      });

      const lastMonthOrdersAmount = orderPerMonths.find((orderPerMonth) => {
        return orderPerMonth.monthWithYear === lastMonthWithYear;
      });

      const diffFromLastMonth =
        currentMonthOrdersAmount && lastMonthOrdersAmount
          ? (currentMonthOrdersAmount.amount * 100) /
            lastMonthOrdersAmount.amount
          : null;

      return {
        amount: currentMonthOrdersAmount?.amount,
        diffFromLastMonth: diffFromLastMonth
          ? Number((diffFromLastMonth - 100).toFixed(2))
          : 0,
      };
    }
  );
