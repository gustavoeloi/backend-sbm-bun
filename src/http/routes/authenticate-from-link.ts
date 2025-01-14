import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "../../db/connection";
import { authLinks } from "../../db/schema";
import { auth } from "../auth";

export const authenticateFromLink = new Elysia().use(auth).get(
  "/auth-links/authenticate",
  async ({ query, jwt, cookie: { authCookie }, set }) => {
    const { code, redirect } = query;

    const authLinkFromCode = await db.query.authLinks.findFirst({
      where(fields, { eq }) {
        return eq(fields.code, code);
      },
    });

    if (!authLinkFromCode) {
      throw new Error("Auth link not found");
    }

    const daysSinceAuthLinkWasCreated = dayjs().diff(
      authLinkFromCode.createdAt,
      "days",
    );

    if (daysSinceAuthLinkWasCreated > 7) {
      throw new Error("Auth link expired, generate a new one to acess SBM");
    }

    const managedEstablishments = await db.query.establishments.findFirst({
      where(fields, { eq }) {
        return eq(fields.managerId, authLinkFromCode.userId);
      },
    });

    const token = await jwt.sign({
      sub: authLinkFromCode.userId,
      establishmentsId: managedEstablishments?.id,
    });

    authCookie.set({
      value: token,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    await db.delete(authLinks).where(eq(authLinks.code, code));

    set.redirect = redirect;
  },
  {
    query: t.Object({
      code: t.String(),
      redirect: t.String(),
    }),
  },
);
