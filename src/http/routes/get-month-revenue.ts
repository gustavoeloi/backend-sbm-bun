import Elysia from "elysia";
import { auth } from "../auth";
import dayjs from "dayjs";
import { UnauthorizedError } from "../errors/unauthorized-errors";
import { db } from "../../db/connection";
import { orders } from "../../db/schema";
import { and, eq, gte, sql, sum } from "drizzle-orm";

export const getMonthRevenue = new Elysia().use(auth).get('/metrics/month-revenue', async ({ cookie: { authCookie }, jwt, }) => {

  const cookie = String(authCookie.cookie.value);

  const payload = await jwt.verify(cookie);

  if (!payload || !payload.establishmentsId) {
    throw new UnauthorizedError()
  }

  const today = dayjs();
  const lastMonth = today.subtract(1, 'month');
  const startOfLastMonth = lastMonth.startOf('month');

  const currentMonthWithYear = today.format('YYYY-MM')
  const lastMonthWithYear = lastMonth.format('YYYY-MM');

  const monthsRevenue = await db.select({
    monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
    receipt: sum(orders.totalInCents).mapWith(Number),
  }).from(orders).where(and(
    eq(orders.establishmentId, payload.establishmentsId),
    gte(orders.createdAt, startOfLastMonth.toDate()) // retornando todos os pedidos desde o mês anterior (dia 1 do mês anterior)
  )).groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)


  const currentMonthRevenue = monthsRevenue.find((monthRevenue) => {
    return monthRevenue.monthWithYear === currentMonthWithYear
  })

  const lastMonthRevenue = monthsRevenue.find((monthRevenue) => {
    return monthRevenue.monthWithYear === lastMonthWithYear
  })

  const diffFromLastMonth = currentMonthRevenue && lastMonthRevenue ? (currentMonthRevenue.receipt * 100) / lastMonthRevenue.receipt : null

  return {
    revenue: currentMonthRevenue?.receipt,
    diffFromLastMonth: diffFromLastMonth ? Number((diffFromLastMonth - 100).toFixed(2)) : 0
  };
})