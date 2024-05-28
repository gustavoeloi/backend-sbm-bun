import Elysia, { t } from "elysia";
import { auth } from "../auth";
import dayjs from "dayjs";
import { UnauthorizedError } from "../errors/unauthorized-errors";
import { db } from "../../db/connection";
import { and, desc, eq, gte, lte, sql, sum } from "drizzle-orm";
import { orders } from "../../db/schema";

export const getDailyRevenueInPeriod = new Elysia().use(auth).get(
  "/metrics/daily-revenue-in-period",
  async ({ cookie: { authCookie }, jwt, query: { from, to }, set }) => {
    const cookie = String(authCookie.cookie.value);

    const payload = await jwt.verify(cookie);

    if (!payload || !payload.establishmentsId) {
      throw new UnauthorizedError();
    }

    const startDate = from ? dayjs(from) : dayjs().subtract(7, "days");
    const endDate = to ? dayjs(to) : from ? startDate.add(7, "days") : dayjs();

    if (endDate.diff(startDate, "days") > 7) {
      set.status = 400;

      return {
        message: "You cannot list revenue in a larger period than 7 days",
      };
    }

    const revenuePerDay = await db
      .select({
        date: sql<string>`TO_CHAR(${orders.createdAt}, 'DD/MM')`,
        revenue: sum(orders.totalInCents).mapWith(Number),
      })
      .from(orders)
      .where(
        and(
          eq(orders.establishmentId, payload.establishmentsId),
          gte(
            orders.createdAt,
            startDate
              .startOf("day")
              .add(startDate.utcOffset(), "minutes")
              .toDate()
          ),
          lte(
            orders.createdAt,
            endDate.endOf("day").add(startDate.utcOffset(), "minutes").toDate()
          )
        )
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'DD/MM')`);

    const orderedRevenuePerDay = revenuePerDay.sort((a, b) => {
      const [dayA, monthA] = a.date.split("/").map(Number);
      const [dayB, monthB] = b.date.split("/").map(Number);

      if(monthA === monthB) {
        return dayA - dayB
      } else {
        const dateA = new Date(2024, monthA - 1)
        const dateB = new Date(2024 - monthB - 1)

        return dateA.getTime() - dateB.getTime()
      }
    });

    return orderedRevenuePerDay;
  },
  {
    query: t.Object({
      from: t.Optional(t.String()),
      to: t.Optional(t.String()),
    }),
  }
);
