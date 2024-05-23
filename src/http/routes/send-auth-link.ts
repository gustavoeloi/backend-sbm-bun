import Elysia, { t } from "elysia";
import { db } from "../../db/connection";
import { createId } from "@paralleldrive/cuid2";
import { authLinks } from "../../db/schema";
import { env } from "../../env";
import { mail } from "../lib/nodemailer";

import nodemailer from 'nodemailer'

export const sendAuthLink = new Elysia().post(
  "/authenticate",
  async ({ body }) => {
    const { email } = body;

    const userFromEmail = await db.query.users.findFirst({
      where(fields, { eq }) { 
        return eq(fields.email, email);
      },
    });

    if (!userFromEmail) {
      throw new Error("User not found.");
    }

    const authLinkCode = createId();

    await db.insert(authLinks).values({
      userId: userFromEmail.id,
      code: authLinkCode,
    });

    const authLink = new URL("/auth-links/authenticate", env.API_BASE_URL);

    authLink.searchParams.set("code", authLinkCode);
    authLink.searchParams.set("redirect", env.AUTH_REDIRECT_URL);

    console.log(authLink.toString());

    // TODO: Enviar E-mail
    const emailLink = await mail.sendMail({
      from: {
        name: "SBM - Small Bussiness Managment",
        address: "dev@sbm.com"
      },
      to: email,
      subject: "Link de autenticação ao SBM",
      text: `Clique no seguinte link para se autenticar ao SBM ${authLink.toString()}`
    })
    console.log(nodemailer.getTestMessageUrl(emailLink))
  },
  {
    body: t.Object({
      email: t.String({ format: "email" }),
    }),
  },
);
