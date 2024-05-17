import jwt from "@elysiajs/jwt";
import { env } from "../env";
import Elysia, { t } from "elysia";
import cookie from "@elysiajs/cookie";
import { UnauthorizedError } from "./errors/unauthorized-errors";

export const auth = new Elysia()
  .error({
    UNAUTHORIZED: UnauthorizedError,
  })
  .onError(({error, code, set}) => {
    switch(code) {
      case "UNAUTHORIZED": {
        set.status = 401;
        return { code, message: error.message }
      }
    }
  })
  .use(
    jwt({
      secret: env.JWT_SECRET_KEY,
      schema: t.Object({
        sub: t.String(),
        establishmentsId: t.Optional(t.String()),
      }),
    }),
  )
  .use(cookie())

